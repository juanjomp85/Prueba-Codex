const cardForm = document.querySelector('#card-form');
const board = document.querySelector('#board');
const searchInput = document.querySelector('#search');
const clearCompletedButton = document.querySelector('#clear-completed');
const template = document.querySelector('#card-template');

let cards = [];
let searchTerm = '';

bootstrap();

async function bootstrap() {
  await refreshCards();

  cardForm.addEventListener('submit', onCreateCard);
  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value.toLowerCase().trim();
    renderCards();
  });

  clearCompletedButton.addEventListener('click', async () => {
    await fetch('/api/cards', { method: 'DELETE' });
    await refreshCards();
  });

  board.addEventListener('click', onBoardClick);
  board.addEventListener('change', onBoardChange);
}

async function onCreateCard(event) {
  event.preventDefault();

  const formData = new FormData(cardForm);
  const title = String(formData.get('title')).trim();

  if (!title) return;

  const payload = {
    type: String(formData.get('type')),
    title,
    content: String(formData.get('content')).trim(),
    color: String(formData.get('color')),
  };

  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    alert('No se pudo guardar la tarjeta. Revisa conexión con MySQL.');
    return;
  }

  cardForm.reset();
  document.querySelector('#color').value = '#fff8b8';
  await refreshCards();
}

async function onBoardClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const cardElement = target.closest('.card');
  if (!cardElement) return;

  const id = cardElement.dataset.id;
  if (!id) return;

  if (target.classList.contains('delete-btn')) {
    await fetch(`/api/cards/${id}`, { method: 'DELETE' });
    await refreshCards();
  }
}

async function onBoardChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!target.classList.contains('done-checkbox')) return;

  const cardElement = target.closest('.card');
  if (!cardElement) return;

  const id = cardElement.dataset.id;
  if (!id) return;

  await fetch(`/api/cards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: target.checked }),
  });

  await refreshCards();
}

async function refreshCards() {
  const response = await fetch('/api/cards');

  if (!response.ok) {
    board.innerHTML = '<p class="empty-state">No se pudo conectar con la base de datos MySQL.</p>';
    return;
  }

  cards = await response.json();
  renderCards();
}

function renderCards() {
  board.replaceChildren();

  const filteredCards = cards.filter((card) => {
    if (!searchTerm) return true;
    return [card.title, card.content].join(' ').toLowerCase().includes(searchTerm);
  });

  if (!filteredCards.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = searchTerm
      ? 'No se encontraron tarjetas con ese texto.'
      : 'Aún no tienes tarjetas. Crea tu primera nota o tarea.';
    board.append(empty);
    return;
  }

  for (const card of filteredCards) {
    const node = template.content.firstElementChild.cloneNode(true);
    if (!(node instanceof HTMLElement)) continue;

    node.dataset.id = card.id;
    node.style.background = card.color;
    if (card.done) node.classList.add('done');

    const titleNode = node.querySelector('.card-title');
    const contentNode = node.querySelector('.card-content');
    const taskRow = node.querySelector('.task-row');
    const doneCheckbox = node.querySelector('.done-checkbox');
    const timestamp = node.querySelector('.timestamp');

    titleNode.textContent = card.title;
    contentNode.textContent = card.content || '(Sin contenido)';

    if (card.type === 'task') {
      taskRow.hidden = false;
      doneCheckbox.checked = card.done;
    }

    timestamp.textContent = `Creada: ${new Date(card.createdAt).toLocaleString('es-ES')}`;

    board.append(node);
  }
}
