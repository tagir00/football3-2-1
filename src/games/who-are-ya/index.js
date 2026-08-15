import { template } from './template.js';
import { loadFamousPool, normalizeName } from './pool.js';
import { nationalityTr, leagueTr } from './labels.js';

const STYLE_HREF = new URL('./game.css', import.meta.url).href;
const MAX_GUESSES = 8;
const AGE_CLOSE = 2;
const SHIRT_CLOSE = 3;

function ensureStylesheet() {
  if (document.querySelector('link[data-game-style="who-are-ya"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.gameStyle = 'who-are-ya';
  document.head.append(link);
}

let cleanup = null;

export async function mount(container) {
  ensureStylesheet();
  container.innerHTML = template();
  const pool = await loadFamousPool();

  const els = {
    homePanel: container.querySelector('#wHomePanel'),
    gamePanel: container.querySelector('#wGamePanel'),
    infoModal: container.querySelector('#wInfoModal'),
    infoButton: container.querySelector('#wInfoButton'),
    closeInfoButton: container.querySelector('#wCloseInfoButton'),
    startButton: container.querySelector('#wStartButton'),
    backButton: container.querySelector('#wBackButton'),
    title: container.querySelector('#wTitle'),
    guessBadge: container.querySelector('#wGuessBadge'),
    status: container.querySelector('#wStatus'),
    input: container.querySelector('#wGuessInput'),
    guessButton: container.querySelector('#wGuessButton'),
    suggestions: container.querySelector('#wSuggestions'),
    guessList: container.querySelector('#wGuessList'),
    result: container.querySelector('#wResult'),
    resultEyebrow: container.querySelector('#wResultEyebrow'),
    resultTitle: container.querySelector('#wResultTitle'),
    resultSub: container.querySelector('#wResultSub'),
    playAgainButton: container.querySelector('#wPlayAgainButton'),
  };

  const state = {
    target: null,
    guesses: [],
    status: 'idle', // idle | playing | won | lost
    usedIds: new Set(),
  };

  const listeners = [];
  function bind(el, ev, fn) {
    el.addEventListener(ev, fn);
    listeners.push(() => el.removeEventListener(ev, fn));
  }

  function pickTarget() {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function startNewGame() {
    state.target = pickTarget();
    state.guesses = [];
    state.status = 'playing';
    state.usedIds = new Set();

    els.homePanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');
    els.result.classList.add('hidden');
    els.title.textContent = '???';
    els.status.textContent = '';
    els.input.value = '';
    els.input.disabled = false;
    els.guessButton.disabled = false;
    els.guessList.innerHTML = '';
    renderSuggestions('');
    updateBadge();
    els.input.focus();
  }

  function updateBadge() {
    els.guessBadge.textContent = `${state.guesses.length} / ${MAX_GUESSES}`;
  }

  function renderSuggestions(query) {
    const q = normalizeName(query);
    if (!q) {
      els.suggestions.innerHTML = '';
      return;
    }
    const matches = pool
      .filter((p) => !state.usedIds.has(p.id))
      .filter((p) => normalizeName(p.name).includes(q))
      .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
      .slice(0, 8);

    els.suggestions.innerHTML = matches
      .map((p) => `<span class="suggestion-chip" data-id="${p.id}">${p.name}</span>`)
      .join('');
    els.suggestions.querySelectorAll('[data-id]').forEach((chip) => {
      chip.addEventListener('click', () => {
        els.input.value = chip.textContent;
        renderSuggestions('');
        els.input.focus();
      });
    });
  }

  function findGuess(query) {
    const q = normalizeName(query);
    if (!q) return null;
    const exact = pool.find((p) => normalizeName(p.name) === q);
    if (exact) return exact;
    const starts = pool.find((p) => normalizeName(p.name).startsWith(q));
    if (starts) return starts;
    return pool.find((p) => normalizeName(p.name).includes(q)) ?? null;
  }

  function evaluateGuess(guess, target) {
    return {
      nationality: guess.nationality === target.nationality ? 'match' : 'miss',
      league: guess.league === target.league ? 'match' : 'miss',
      team: guess.team === target.team ? 'match' : 'miss',
      position: guess.position === target.position ? 'match' : 'miss',
      age: numericFeedback(guess.age, target.age, AGE_CLOSE),
      shirt: shirtFeedback(guess.shirt, target.shirt),
    };
  }

  function numericFeedback(guessVal, targetVal, closeWindow) {
    if (guessVal == null || targetVal == null) return { kind: 'unknown', text: '?' };
    if (guessVal === targetVal) return { kind: 'match', text: String(guessVal) };
    const diff = Math.abs(guessVal - targetVal);
    const arrow = guessVal < targetVal ? '↑' : '↓';
    const kind = diff <= closeWindow ? 'close' : 'miss';
    return { kind, text: `${guessVal} ${arrow}` };
  }

  function shirtFeedback(guessVal, targetVal) {
    if (guessVal == null || targetVal == null) return { kind: 'unknown', text: '?' };
    return numericFeedback(guessVal, targetVal, SHIRT_CLOSE);
  }

  const POSITION_TR = { GK: 'KLC', DEF: 'DEF', MID: 'ORT', FW: 'FRW' };

  function labelForCategory(guess, key) {
    switch (key) {
      case 'nationality': return nationalityTr(guess.nationality);
      case 'league': return leagueTr(guess.league);
      case 'team': return guess.team;
      case 'position': return POSITION_TR[guess.position] ?? guess.position;
      default: return '?';
    }
  }

  function renderGuessRow(guess, feedback) {
    const row = document.createElement('div');
    row.className = 'wy-guess-row';
    row.innerHTML = `
      <div class="wy-name-cell" title="${guess.name}">${guess.name}</div>
      <div class="wy-tile ${feedback.nationality}">${labelForCategory(guess, 'nationality')}</div>
      <div class="wy-tile ${feedback.league}">${labelForCategory(guess, 'league')}</div>
      <div class="wy-tile ${feedback.team}">${labelForCategory(guess, 'team')}</div>
      <div class="wy-tile ${feedback.position}">${labelForCategory(guess, 'position')}</div>
      <div class="wy-tile ${feedback.age.kind}">${feedback.age.text}</div>
      <div class="wy-tile ${feedback.shirt.kind}">${feedback.shirt.text}</div>
    `;
    els.guessList.append(row);
  }

  function submitGuess() {
    if (state.status !== 'playing') return;
    const raw = els.input.value.trim();
    if (!raw) return;
    const guess = findGuess(raw);
    if (!guess) {
      els.status.textContent = `"${raw}" havuzda bulunamadı. Öneriye tıklayabilirsin.`;
      return;
    }
    if (state.usedIds.has(guess.id)) {
      els.status.textContent = `${guess.name} zaten denendi.`;
      return;
    }

    const feedback = evaluateGuess(guess, state.target);
    state.guesses.push({ guess, feedback });
    state.usedIds.add(guess.id);
    renderGuessRow(guess, feedback);
    updateBadge();

    els.input.value = '';
    renderSuggestions('');

    const won =
      feedback.nationality === 'match' &&
      feedback.league === 'match' &&
      feedback.team === 'match' &&
      feedback.position === 'match' &&
      feedback.age.kind === 'match' &&
      feedback.shirt.kind === 'match';

    if (won) {
      finishGame('won');
    } else if (state.guesses.length >= MAX_GUESSES) {
      finishGame('lost');
    } else {
      els.status.textContent = '';
      els.input.focus();
    }
  }

  function finishGame(result) {
    state.status = result;
    els.input.disabled = true;
    els.guessButton.disabled = true;
    els.suggestions.innerHTML = '';
    els.result.classList.remove('hidden');
    els.result.classList.toggle('win', result === 'won');
    els.result.classList.toggle('lose', result === 'lost');

    if (result === 'won') {
      els.resultEyebrow.textContent = 'Tebrikler';
      els.resultTitle.textContent = state.target.name;
      els.resultSub.textContent = `${state.guesses.length}. tahminde buldun.`;
    } else {
      els.resultEyebrow.textContent = 'Bulunamadı';
      els.resultTitle.textContent = state.target.name;
      els.resultSub.textContent = `${state.target.team} • ${nationalityTr(state.target.nationality)} • ${POSITION_TR[state.target.position] ?? state.target.position} • ${state.target.age}`;
    }
  }

  function goHome() {
    state.status = 'idle';
    els.gamePanel.classList.add('hidden');
    els.homePanel.classList.remove('hidden');
  }

  bind(els.startButton, 'click', startNewGame);
  bind(els.playAgainButton, 'click', startNewGame);
  bind(els.backButton, 'click', goHome);
  bind(els.guessButton, 'click', submitGuess);
  bind(els.input, 'input', (e) => renderSuggestions(e.target.value));
  bind(els.input, 'keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitGuess();
    }
  });
  bind(els.infoButton, 'click', () => {
    els.infoModal.classList.remove('hidden');
    els.infoModal.setAttribute('aria-hidden', 'false');
  });
  bind(els.closeInfoButton, 'click', () => {
    els.infoModal.classList.add('hidden');
    els.infoModal.setAttribute('aria-hidden', 'true');
  });

  cleanup = () => {
    listeners.forEach((fn) => fn());
    listeners.length = 0;
  };
}

export function unmount() {
  cleanup?.();
  cleanup = null;
}
