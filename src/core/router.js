import { games, getGame } from './registry.js';

let hubRoot = null;
let gameRoot = null;
let activeGame = null;

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash || null;
}

function renderHub() {
  hubRoot.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Oyun Kutusu</p>
      <h1>Bir oyun sec</h1>
      <p class="panel-copy">Asagidan bir mini oyun sec ve baslat.</p>
    </section>
    <div class="hub-grid">
      ${games
        .map(
          (game) => `
            <a class="hub-card ${game.accent ?? ''}" href="#/${game.id}">
              <span class="hub-card-title">${game.title}</span>
              <span class="hub-card-description">${game.description}</span>
            </a>
          `,
        )
        .join('')}
    </div>
  `;
}

function showHub() {
  if (activeGame) {
    activeGame.module.unmount?.();
    activeGame = null;
  }

  gameRoot.classList.add('hidden');
  gameRoot.innerHTML = '';
  hubRoot.classList.remove('hidden');
}

async function showGame(id) {
  const game = getGame(id);

  if (!game) {
    window.location.hash = '#/';
    return;
  }

  if (activeGame?.id === id) {
    return;
  }

  if (activeGame) {
    activeGame.module.unmount?.();
    activeGame = null;
  }

  hubRoot.classList.add('hidden');
  gameRoot.classList.remove('hidden');

  const module = await game.load();
  activeGame = { id, module };
  await module.mount(gameRoot);
}

function handleRouteChange() {
  const route = parseRoute();

  if (!route) {
    showHub();
    return;
  }

  showGame(route);
}

export function startRouter() {
  hubRoot = document.querySelector('#hubRoot');
  gameRoot = document.querySelector('#gameRoot');

  renderHub();
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}
