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
    <section class="app-title">
      <h1>Pro Football Player</h1>
    </section>
    <div class="hub-grid">
      ${games
        .map(
          (game) => `
            <a class="hub-card ${game.accent ?? ''}" href="#/${game.id}">
              <img class="hub-card-cover" src="${game.cover}" alt="${game.title}" loading="lazy" />
              <span class="hub-card-title">${game.title}</span>
            </a>
          `,
        )
        .join('')}
    </div>
  `;
}

function setTheme(name) {
  document.body.dataset.theme = name;
}

function showHub() {
  if (activeGame) {
    activeGame.module.unmount?.();
    activeGame = null;
  }

  gameRoot.classList.add('hidden');
  gameRoot.innerHTML = '';
  hubRoot.classList.remove('hidden');
  setTheme('stadium');
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
  setTheme('tactic');

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
