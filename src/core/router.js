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
  document.body.classList.remove('game-loading');
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

  // Games draw their screen first and wire up buttons only after their data
  // (up to ~1 MB) has downloaded; until then the buttons are inert, so show
  // that the game is still loading.
  document.body.classList.add('game-loading');
  try {
    const module = await game.load();
    activeGame = { id, module };
    await module.mount(gameRoot);
  } catch (error) {
    console.error(error);
    if (activeGame?.id === id) {
      activeGame.module.unmount?.();
      activeGame = null;
    }
    if (parseRoute() === id) {
      renderLoadError(id);
    }
  } finally {
    document.body.classList.remove('game-loading');
  }
}

function renderLoadError(id) {
  gameRoot.innerHTML = `
    <section class="load-error">
      <h2>Oyun yüklenemedi</h2>
      <p>İnternet bağlantını kontrol edip tekrar dene.</p>
      <button class="primary-button" type="button" data-retry>Tekrar Dene</button>
      <a class="ghost-button" href="#/">Ana Menü</a>
    </section>
  `;
  gameRoot.querySelector('[data-retry]').addEventListener('click', () => showGame(id));
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
