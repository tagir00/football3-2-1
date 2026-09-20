import { template } from './template.js';
import { clubs as ALL_CLUBS } from '../futbol321/data.js';

const STYLE_HREF = new URL('./game.css', import.meta.url).href;
const PLAYER_DATA_URL = new URL('./playerPool.json', import.meta.url);
const TOTAL_ROUNDS = 5;
const MAX_SUGGESTIONS = 10;

function ensureStylesheet() {
  if (document.querySelector('link[data-game-style="rastgele-besler"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.gameStyle = 'rastgele-besler';
  document.head.append(link);
}

function normalizeName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickN(arr, n) {
  return shuffle(arr).slice(0, n);
}

// Pick n items with a soft cap on how many overlap with an exclusion set.
// Falls back to unconstrained pick if the pool is too small to satisfy the cap.
function pickNWithOverlapCap(arr, n, excludeNames, maxOverlap = 1) {
  const excluded = new Set(excludeNames);
  const shuffled = shuffle(arr);
  const picked = [];
  let overlapUsed = 0;
  for (const c of shuffled) {
    if (picked.length >= n) break;
    if (excluded.has(c.name)) {
      if (overlapUsed >= maxOverlap) continue;
      overlapUsed++;
    }
    picked.push(c);
  }
  if (picked.length < n) return shuffled.slice(0, n); // safety fallback
  return picked;
}

// Curated "big-name" club pool for the 5-club draw. Only these clubs appear
// on the wheel — obscure clubs (Nottingham Forest, Gaziantep FK, Sassuolo,
// Real Sociedad, etc.) produced 5-club combinations where players couldn't
// even find one 2-hit crossings pick. Every club here has enough presence in
// the 2000+ player pool that two of them together typically share several
// footballers.
const BIG_CLUB_NAMES = new Set([
  // Premier League big 8
  'Arsenal','Aston Villa','Chelsea','Liverpool','Manchester City',
  'Manchester United','Newcastle United','Tottenham Hotspur',
  // LaLiga
  'Atletico Madrid','Barcelona','Real Madrid','Sevilla','Valencia','Villarreal',
  // Serie A
  'AC Milan','Inter Milan','Juventus','Napoli','Roma','Lazio','Fiorentina',
  // Bundesliga
  'Bayer Leverkusen','Bayern Munich','Borussia Dortmund','Eintracht Frankfurt',
  'RB Leipzig',
  // Ligue 1
  'Lyon','Marseille','Monaco','Paris Saint-Germain',
  // Süper Lig big 4
  'Besiktas','Fenerbahce','Galatasaray','Trabzonspor',
  // Extras with strong crossings
  'Ajax','Benfica','Sporting CP','PSV Eindhoven',
]);

function buildBigClubList(allClubs) {
  return allClubs.filter((c) => BIG_CLUB_NAMES.has(c.name));
}

let cleanup = null;
let playerPoolPromise = null;

function loadPlayerPool() {
  if (playerPoolPromise) return playerPoolPromise;
  playerPoolPromise = fetch(PLAYER_DATA_URL)
    .then((r) => r.json())
    .then((rows) =>
      rows.map((p, idx) => {
        // PowerShell's ConvertTo-Json emits single-element arrays as bare
        // strings, so normalize `clubs` to always be an array here.
        const clubs = Array.isArray(p.clubs) ? p.clubs : (p.clubs ? [p.clubs] : []);
        return {
          id: idx,
          name: p.name,
          normalized: normalizeName(p.name),
          clubs,
          clubsNormalized: clubs.map((c) => c.toLowerCase()),
          apps: p.apps ?? 0,
        };
      }),
    );
  return playerPoolPromise;
}

export async function mount(container) {
  ensureStylesheet();
  container.innerHTML = template();
  const playerPool = await loadPlayerPool();
  const drawClubs = buildBigClubList(ALL_CLUBS);

  const els = {
    homePanel: container.querySelector('#rHomePanel'),
    setupPanel: container.querySelector('#rSetupPanel'),
    gamePanel: container.querySelector('#rGamePanel'),
    infoModal: container.querySelector('#rInfoModal'),
    infoButton: container.querySelector('#rInfoButton'),
    closeInfoButton: container.querySelector('#rCloseInfoButton'),
    startButton: container.querySelector('#rStartButton'),
    setupBackButton: container.querySelector('#rSetupBackButton'),
    player1Input: container.querySelector('#rPlayer1Input'),
    player2Input: container.querySelector('#rPlayer2Input'),
    setupStatus: container.querySelector('#rSetupStatus'),
    coinSideA: container.querySelector('#rCoinSideA'),
    coinSideB: container.querySelector('#rCoinSideB'),
    coinResult: container.querySelector('#rCoinResult'),
    coinWinnerLabel: container.querySelector('#rCoinWinnerLabel'),
    spinCoinButton: container.querySelector('#rSpinCoinButton'),
    goToGameButton: container.querySelector('#rGoToGameButton'),
    gameBackButton: container.querySelector('#rGameBackButton'),
    roundEyebrow: container.querySelector('#rRoundEyebrow'),
    clubsStrip: container.querySelector('#rClubsStrip'),
    spinButton: container.querySelector('#rSpinButton'),
    board: container.querySelector('#rBoard'),
    picksA: container.querySelector('#rPicksA'),
    picksB: container.querySelector('#rPicksB'),
    nameA: container.querySelector('#rNameA'),
    nameB: container.querySelector('#rNameB'),
    totalNameA: container.querySelector('#rTotalNameA'),
    totalNameB: container.querySelector('#rTotalNameB'),
    totalA: container.querySelector('#rTotalA'),
    totalB: container.querySelector('#rTotalB'),
    turnPanel: container.querySelector('#rTurnPanel'),
    turnLabel: container.querySelector('#rTurnLabel'),
    guessInput: container.querySelector('#rGuessInput'),
    guessButton: container.querySelector('#rGuessButton'),
    suggestions: container.querySelector('#rSuggestions'),
    gameStatus: container.querySelector('#rGameStatus'),
    roundDone: container.querySelector('#rRoundDone'),
    roundDoneEyebrow: container.querySelector('#rRoundDoneEyebrow'),
    roundSummary: container.querySelector('#rRoundSummary'),
    nextRoundButton: container.querySelector('#rNextRoundButton'),
    result: container.querySelector('#rResult'),
    resultEyebrow: container.querySelector('#rResultEyebrow'),
    resultTitle: container.querySelector('#rResultTitle'),
    resultSub: container.querySelector('#rResultSub'),
    playAgainButton: container.querySelector('#rPlayAgainButton'),
  };
  const clubSlots = Array.from(container.querySelectorAll('.rb-club-slot'));

  const state = {
    players: [
      { name: 'Oyuncu 1', total: 0, picks: [] },
      { name: 'Oyuncu 2', total: 0, picks: [] },
    ],
    startingPlayerIndex: 0,
    activePlayerIndex: 0,
    currentClubs: [],
    previousRoundClubs: [], // used to cap overlap between consecutive rounds
    round: 0, // 1-based when active
    picksThisRound: 0,
    isSpinning: false,
    isFinished: false,
    usedPlayerIds: new Set(),
  };

  const listeners = [];
  function bind(el, ev, fn) {
    el.addEventListener(ev, fn);
    listeners.push(() => el.removeEventListener(ev, fn));
  }

  function resetState() {
    state.players[0].total = 0; state.players[0].picks = [];
    state.players[1].total = 0; state.players[1].picks = [];
    state.startingPlayerIndex = 0;
    state.activePlayerIndex = 0;
    state.currentClubs = [];
    state.previousRoundClubs = [];
    state.round = 0;
    state.picksThisRound = 0;
    state.isSpinning = false;
    state.isFinished = false;
    state.usedPlayerIds = new Set();
  }

  function showHome() {
    els.homePanel.classList.remove('hidden');
    els.setupPanel.classList.add('hidden');
    els.gamePanel.classList.add('hidden');
  }

  function showSetup() {
    els.homePanel.classList.add('hidden');
    els.setupPanel.classList.remove('hidden');
    els.gamePanel.classList.add('hidden');
    resetSetup();
  }

  function resetSetup() {
    els.player1Input.value = '';
    els.player2Input.value = '';
    els.setupStatus.textContent = 'İki oyuncunun da adını yaz, sonra yazı-turayı at.';
    els.coinResult.classList.add('hidden');
    els.coinSideA.classList.remove('winner', 'spinning');
    els.coinSideB.classList.remove('winner', 'spinning');
    els.coinSideA.querySelector('.coin-name').textContent = '1';
    els.coinSideB.querySelector('.coin-name').textContent = '2';
    els.goToGameButton.classList.add('hidden');
    els.spinCoinButton.disabled = false;
    els.spinCoinButton.textContent = 'Yazı-Tura At';
    els.spinCoinButton.classList.add('primary-button');
    els.spinCoinButton.classList.remove('ghost-button');
  }

  function updateSetupStatusOnType() {
    const a = els.player1Input.value.trim();
    const b = els.player2Input.value.trim();
    if (a && b) {
      els.setupStatus.textContent = "İsimler tamam. Şimdi Yazı-Tura'yı at.";
    } else {
      els.setupStatus.textContent = 'İki oyuncunun da adını yaz, sonra yazı-turayı at.';
    }
    if (!els.coinResult.classList.contains('hidden')) {
      const winner = state.players[state.startingPlayerIndex];
      els.coinSideA.querySelector('.coin-name').textContent = a || '1';
      els.coinSideB.querySelector('.coin-name').textContent = b || '2';
      const label = state.startingPlayerIndex === 0 ? (a || '1') : (b || '2');
      els.coinWinnerLabel.textContent = label;
    }
  }

  function flipCoin() {
    const a = els.player1Input.value.trim();
    const b = els.player2Input.value.trim();
    if (!a || !b) {
      els.setupStatus.textContent = 'İki oyuncunun da adını girmen gerek.';
      return;
    }
    state.players[0].name = a;
    state.players[1].name = b;
    els.coinSideA.querySelector('.coin-name').textContent = a;
    els.coinSideB.querySelector('.coin-name').textContent = b;
    els.coinResult.classList.add('hidden');
    els.coinSideA.classList.remove('winner');
    els.coinSideB.classList.remove('winner');
    els.coinSideA.classList.add('spinning');
    els.coinSideB.classList.add('spinning');
    els.spinCoinButton.disabled = true;
    els.setupStatus.textContent = 'Yazı-tura dönüyor...';

    const totalTicks = 14 + Math.floor(Math.random() * 6);
    let ticks = 0;
    const interval = window.setInterval(() => {
      ticks++;
      const cur = ticks % 2;
      els.coinSideA.classList.toggle('winner', cur === 0);
      els.coinSideB.classList.toggle('winner', cur === 1);
      if (ticks >= totalTicks) {
        window.clearInterval(interval);
        const winner = Math.random() < 0.5 ? 0 : 1;
        state.startingPlayerIndex = winner;
        state.activePlayerIndex = winner;
        els.coinSideA.classList.remove('spinning');
        els.coinSideB.classList.remove('spinning');
        els.coinSideA.classList.toggle('winner', winner === 0);
        els.coinSideB.classList.toggle('winner', winner === 1);
        els.coinWinnerLabel.textContent = state.players[winner].name;
        els.coinResult.classList.remove('hidden');
        els.setupStatus.textContent = 'Sonuç geldi. Oyuna geçebilirsin.';
        els.spinCoinButton.disabled = false;
        els.spinCoinButton.textContent = 'Tekrar At';
        els.spinCoinButton.classList.remove('primary-button');
        els.spinCoinButton.classList.add('ghost-button');
        els.goToGameButton.classList.remove('hidden');
      }
    }, 90);
  }

  function goToGame() {
    els.homePanel.classList.add('hidden');
    els.setupPanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');
    startGame();
  }

  function startGame() {
    resetState();
    // Restore player names + coin flip winner
    state.players[0].name = els.player1Input.value.trim() || 'Oyuncu 1';
    state.players[1].name = els.player2Input.value.trim() || 'Oyuncu 2';
    // startingPlayerIndex already set by coin flip
    renderNames();
    renderPicks();
    renderScoreboard();
    resetClubs();
    els.result.classList.add('hidden');
    els.roundDone.classList.add('hidden');
    els.turnPanel.classList.add('hidden');
    els.spinButton.classList.remove('hidden');
    els.spinButton.disabled = false;
    state.round = 1;
    els.roundEyebrow.textContent = `TUR ${state.round} / ${TOTAL_ROUNDS}`;
    els.gameStatus.textContent = '';
    els.spinButton.textContent = 'Takımları Getir';
  }

  function renderNames() {
    els.nameA.textContent = state.players[0].name;
    els.nameB.textContent = state.players[1].name;
    els.totalNameA.textContent = state.players[0].name;
    els.totalNameB.textContent = state.players[1].name;
  }

  function renderScoreboard() {
    els.totalA.textContent = state.players[0].total;
    els.totalB.textContent = state.players[1].total;
  }

  function renderPicks() {
    for (const [playerIdx, listEl] of [[0, els.picksA], [1, els.picksB]]) {
      const list = listEl;
      const items = list.querySelectorAll('.rb-pick');
      const picks = state.players[playerIdx].picks;
      items.forEach((li, i) => {
        const p = picks[i];
        if (!p) {
          li.className = 'rb-pick empty';
          li.textContent = '';
        } else {
          li.className = 'rb-pick';
          if (p.roundWinner) li.classList.add('winner-round');
          li.innerHTML = `<span class="rb-pick-name">${p.name}</span><span class="rb-pick-score">${p.score}</span>`;
        }
      });
    }
  }

  function resetClubs() {
    clubSlots.forEach((slot) => {
      slot.classList.remove('spinning', 'landed');
      slot.querySelector('.rb-club-logo').style.backgroundImage = '';
      slot.querySelector('.rb-club-name').textContent = '-';
    });
    state.currentClubs = [];
  }

  function setSlotClub(slotEl, club) {
    const logoEl = slotEl.querySelector('.rb-club-logo');
    const nameEl = slotEl.querySelector('.rb-club-name');
    logoEl.style.backgroundImage = `url(${club.localLogoPath})`;
    nameEl.textContent = club.displayName;
  }

  function spinClubs() {
    if (state.isSpinning) return;
    if (state.round > TOTAL_ROUNDS) return;
    state.isSpinning = true;
    els.spinButton.disabled = true;
    els.roundDone.classList.add('hidden');
    els.turnPanel.classList.add('hidden');

    const previousNames = state.previousRoundClubs.map((c) => c.name);
    const finalClubs = pickNWithOverlapCap(drawClubs, 5, previousNames, 1);
    clubSlots.forEach((slot) => slot.classList.add('spinning'));

    // Each slot cycles at its own pace, then locks in sequence
    const slotStates = clubSlots.map(() => ({ tick: 0, stopAt: 0 }));
    const baseDuration = 18;
    slotStates.forEach((s, idx) => {
      s.stopAt = baseDuration + idx * 4 + Math.floor(Math.random() * 3);
    });

    let done = 0;
    const interval = window.setInterval(() => {
      slotStates.forEach((s, idx) => {
        if (s.tick >= s.stopAt) return; // already landed
        const temp = drawClubs[Math.floor(Math.random() * drawClubs.length)];
        setSlotClub(clubSlots[idx], temp);
        s.tick++;
        if (s.tick >= s.stopAt) {
          setSlotClub(clubSlots[idx], finalClubs[idx]);
          clubSlots[idx].classList.remove('spinning');
          clubSlots[idx].classList.add('landed');
          window.setTimeout(() => clubSlots[idx].classList.remove('landed'), 520);
          done++;
        }
      });
      if (done >= clubSlots.length) {
        window.clearInterval(interval);
        state.previousRoundClubs = finalClubs.slice();
        state.currentClubs = finalClubs;
        state.isSpinning = false;
        els.spinButton.classList.add('hidden');
        beginRoundPicks();
      }
    }, 55);
  }

  function beginRoundPicks() {
    // Starting player of this round: alternates each round
    const starter = (state.startingPlayerIndex + (state.round - 1)) % 2;
    state.activePlayerIndex = starter;
    state.picksThisRound = 0;
    els.turnPanel.classList.remove('hidden');
    els.turnLabel.textContent = state.players[state.activePlayerIndex].name;
    els.guessInput.value = '';
    els.guessInput.disabled = false;
    els.guessButton.disabled = false;
    els.suggestions.innerHTML = '';
    els.gameStatus.textContent = '';
    els.guessInput.focus();
  }

  function findPlayerByName(query) {
    const q = normalizeName(query);
    if (!q) return null;
    // Exact
    const exact = playerPool.find((p) => p.normalized === q);
    if (exact) return exact;
    // Starts with
    const starts = playerPool.find((p) => p.normalized.startsWith(q));
    if (starts) return starts;
    // Includes
    return playerPool.find((p) => p.normalized.includes(q)) ?? null;
  }

  function renderSuggestions(query) {
    if (!els.suggestions) return;
    const q = normalizeName(query);
    if (!q) {
      els.suggestions.innerHTML = '';
      return;
    }
    const currentSet = new Set(state.currentClubs.map((c) => c.name.toLowerCase()));
    const matches = playerPool
      .filter((p) => p.normalized.includes(q))
      .map((p) => {
        const hits = p.clubsNormalized.filter((c) => currentSet.has(c)).length;
        return { p, hits };
      })
      .sort((a, b) => {
        // Prefer players whose careers match the current 5 clubs, then by fame (apps)
        if (b.hits !== a.hits) return b.hits - a.hits;
        return (b.p.apps ?? 0) - (a.p.apps ?? 0);
      })
      .slice(0, MAX_SUGGESTIONS);

    els.suggestions.innerHTML = matches
      .map(({ p, hits }) => {
        const used = state.usedPlayerIds.has(p.id);
        return `<span class="rb-suggestion${used ? ' used' : ''}" data-id="${p.id}" title="${p.clubs.join(', ')}">${p.name}${hits > 0 ? ` · ${hits}` : ''}</span>`;
      })
      .join('');

    els.suggestions.querySelectorAll('[data-id]').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('used')) return;
        const id = Number(chip.dataset.id);
        const player = playerPool.find((x) => x.id === id);
        if (!player) return;
        els.guessInput.value = player.name;
        submitGuess();
      });
    });
  }

  function scoreForCurrentClubs(player) {
    const currentSet = new Set(state.currentClubs.map((c) => c.name.toLowerCase()));
    let matched = 0;
    const matches = [];
    for (const c of player.clubsNormalized) {
      if (currentSet.has(c)) {
        matched++;
        matches.push(c);
      }
    }
    return { count: matched, matches };
  }

  function submitGuess() {
    if (state.picksThisRound >= 2) return;
    const raw = els.guessInput.value.trim();
    if (!raw) {
      els.gameStatus.textContent = 'Bir futbolcu adı yaz.';
      return;
    }
    const found = findPlayerByName(raw);
    if (!found) {
      els.gameStatus.textContent = `"${raw}" havuzda bulunamadı, tekrar dene.`;
      return;
    }
    if (state.usedPlayerIds.has(found.id)) {
      els.gameStatus.textContent = `${found.name} bu oyunda zaten seçildi. Başka biri.`;
      return;
    }
    const { count } = scoreForCurrentClubs(found);
    state.usedPlayerIds.add(found.id);
    const activePlayer = state.players[state.activePlayerIndex];
    const pick = { name: found.name, score: count, round: state.round };
    activePlayer.picks.push(pick);
    activePlayer.total += count;
    state.picksThisRound += 1;
    renderPicks();
    renderScoreboard();
    els.guessInput.value = '';
    els.suggestions.innerHTML = '';
    els.gameStatus.textContent = `${activePlayer.name}: ${found.name} = ${count} puan.`;

    if (state.picksThisRound >= 2) {
      finishRound();
    } else {
      state.activePlayerIndex = state.activePlayerIndex === 0 ? 1 : 0;
      els.turnLabel.textContent = state.players[state.activePlayerIndex].name;
      els.guessInput.focus();
    }
  }

  function finishRound() {
    els.turnPanel.classList.add('hidden');
    // Determine round winner (last pick of each) and mark it
    const idx = state.round - 1;
    const p0Pick = state.players[0].picks[idx];
    const p1Pick = state.players[1].picks[idx];
    if (p0Pick && p1Pick) {
      if (p0Pick.score > p1Pick.score) p0Pick.roundWinner = true;
      else if (p1Pick.score > p0Pick.score) p1Pick.roundWinner = true;
    }
    renderPicks();

    if (state.round >= TOTAL_ROUNDS) {
      finishGame();
      return;
    }

    els.roundDone.classList.remove('hidden');
    els.roundDoneEyebrow.textContent = `Tur ${state.round} Bitti`;
    const [p0, p1] = state.players;
    els.roundSummary.textContent = `${p0.name} bu tur ${p0Pick?.score ?? 0} · ${p1.name} bu tur ${p1Pick?.score ?? 0}. Toplam ${p0.total} — ${p1.total}.`;
    els.nextRoundButton.textContent = `Tur ${state.round + 1}: Takımları Getir`;
  }

  function nextRound() {
    state.round += 1;
    els.roundEyebrow.textContent = `TUR ${state.round} / ${TOTAL_ROUNDS}`;
    resetClubs();
    els.roundDone.classList.add('hidden');
    els.gameStatus.textContent = '';
    // Fold the "Takımları Getir" click into the "Sonraki Tur" click so users
    // don't have to press two buttons back-to-back.
    els.spinButton.classList.add('hidden');
    spinClubs();
  }

  function finishGame() {
    state.isFinished = true;
    els.turnPanel.classList.add('hidden');
    els.roundDone.classList.add('hidden');
    els.spinButton.classList.add('hidden');
    const [p0, p1] = state.players;
    els.result.classList.remove('hidden');
    els.result.classList.remove('win', 'tie');
    if (p0.total === p1.total) {
      els.result.classList.add('tie');
      els.resultEyebrow.textContent = 'Berabere';
      els.resultTitle.textContent = `${p0.total} — ${p1.total}`;
      els.resultSub.textContent = `İki oyuncu da ${p0.total} puanla bitirdi. İstersen yeniden oyna.`;
    } else {
      els.result.classList.add('win');
      const winner = p0.total > p1.total ? p0 : p1;
      const loser  = p0.total > p1.total ? p1 : p0;
      els.resultEyebrow.textContent = 'Kazanan';
      els.resultTitle.textContent = winner.name;
      els.resultSub.textContent = `${winner.name} ${winner.total} · ${loser.name} ${loser.total}`;
    }
    els.playAgainButton.textContent = 'Yeni Oyun';
  }

  function goHome() {
    showHome();
  }

  bind(els.startButton, 'click', showSetup);
  bind(els.setupBackButton, 'click', goHome);
  bind(els.gameBackButton, 'click', goHome);
  bind(els.spinCoinButton, 'click', flipCoin);
  bind(els.goToGameButton, 'click', goToGame);
  bind(els.spinButton, 'click', spinClubs);
  bind(els.guessButton, 'click', submitGuess);
  bind(els.guessInput, 'input', (e) => renderSuggestions(e.target.value));
  bind(els.guessInput, 'keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitGuess(); }
  });
  bind(els.player1Input, 'input', updateSetupStatusOnType);
  bind(els.player2Input, 'input', updateSetupStatusOnType);
  bind(els.nextRoundButton, 'click', () => { nextRound(); });
  bind(els.playAgainButton, 'click', () => { showSetup(); });
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
