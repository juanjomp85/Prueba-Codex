# Keep Mini (Tareas + Notas) con MySQL

Aplicación web estilo **Google Keep** para crear y administrar tarjetas de notas y tareas con persistencia en **MySQL**.
# Keep Mini (Tareas + Notas)

Aplicación web estática tipo **Google Keep** para crear y administrar tarjetas de notas y tareas.

## Funcionalidades

- Crear tarjetas de tipo **Nota** o **Tarea**.
- Asignar color personalizado por tarjeta.
- Marcar tareas como completadas.
- Buscar por título o contenido.
- Eliminar tarjetas.
- Limpiar todas las tareas completadas.
- Persistencia en base de datos MySQL.

## Requisitos

- Node.js 18+
- MySQL 8+

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

3. Crea la base de datos y tabla:

```bash
mysql -u root -p < db/schema.sql
```

4. Inicia la aplicación:

```bash
npm start
```

5. Abre en navegador:

- http://localhost:3000

## API rápida

- `GET /api/cards`
- `POST /api/cards`
- `PATCH /api/cards/:id` (actualiza `done`)
- `DELETE /api/cards/:id`
- `DELETE /api/cards` (limpia tareas completadas)
- Persistencia local con `localStorage`.

## Ejecutar

Solo abre `index.html` en tu navegador.
