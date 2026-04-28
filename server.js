require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('node:crypto');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT || 3000);

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'keep_mini',
};

let pool;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true, db: 'connected' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'database_unavailable' });
  }
});

app.get('/api/cards', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT id, type, title, content, color, done, created_at AS createdAt
     FROM cards
     ORDER BY created_at DESC`
  );

  const cards = rows.map((row) => ({
    ...row,
    done: Boolean(row.done),
    createdAt: new Date(row.createdAt).toISOString(),
  }));

  return res.json(cards);
});

app.post('/api/cards', async (req, res) => {
  const { type = 'note', title = '', content = '', color = '#fff8b8' } = req.body || {};

  const safeTitle = String(title).trim().slice(0, 80);
  const safeContent = String(content).trim().slice(0, 400);
  const safeType = type === 'task' ? 'task' : 'note';
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(String(color)) ? String(color) : '#fff8b8';

  if (!safeTitle) {
    return res.status(400).json({ error: 'title_required' });
  }

  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO cards (id, type, title, content, color, done)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [id, safeType, safeTitle, safeContent, safeColor]
  );

  const [[created]] = await pool.query(
    `SELECT id, type, title, content, color, done, created_at AS createdAt
     FROM cards
     WHERE id = ?`,
    [id]
  );

  return res.status(201).json({
    ...created,
    done: Boolean(created.done),
    createdAt: new Date(created.createdAt).toISOString(),
  });
});

app.patch('/api/cards/:id', async (req, res) => {
  const { id } = req.params;
  const { done } = req.body || {};

  if (typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done_must_be_boolean' });
  }

  const [result] = await pool.query('UPDATE cards SET done = ? WHERE id = ?', [done ? 1 : 0, id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'card_not_found' });
  }

  return res.json({ ok: true });
});

app.delete('/api/cards/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM cards WHERE id = ?', [id]);
  return res.status(204).send();
});

app.delete('/api/cards', async (_req, res) => {
  await pool.query(`DELETE FROM cards WHERE type = 'task' AND done = 1`);
  return res.status(204).send();
});

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ error: 'internal_server_error' });
});

async function startServer() {
  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
  });

  app.listen(port, () => {
    console.log(`Keep Mini disponible en http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
