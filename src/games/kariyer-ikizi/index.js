import { template } from './template.js';
import { createShuffleBag } from '../../core/shuffleBag.js';

const STYLE_HREF = new URL('./game.css', import.meta.url).href;
const PLAYERS_URL = new URL('./players.json', import.meta.url);
const CRITERIA_PER_REF = 5;

// ---------------- Criteria ----------------
// `key` is the column in players.json. `min` is the smallest reference value
// that makes the row worth playing (0 red cards or 2 league games would make a
// dull or near-impossible row), `needs` an extra condition on the reference.
const LEAGUES = [
  { code: 'pl', name: 'Premier League', short: 'PL' },
  { code: 'll', name: 'La Liga', short: 'La Liga' },
  { code: 'sa', name: 'Serie A', short: 'Serie A' },
  { code: 'bl', name: 'Bundesliga', short: 'Bundesliga' },
  { code: 'l1', name: 'Ligue 1', short: 'Ligue 1' },
  { code: 'sl', name: 'Süper Lig', short: 'Süper Lig' },
];

const CRITERIA = [
  { id: 'clubApps', label: 'Kulüp Maçı', key: 'ca', family: 'club', min: 50 },
  { id: 'clubGoals', label: 'Kulüp Golü', key: 'cg', family: 'club-goals', min: 10 },
  { id: 'clubAssists', label: 'Kulüp Asisti', key: 'cs', family: 'club-assists', min: 10 },
  { id: 'caps', label: 'Milli Maç', key: 'nc', family: 'nt', min: 5 },
  { id: 'intlGoals', label: 'Milli Gol', key: 'ng', family: 'nt', min: 3 },
  { id: 'trophies', label: 'Toplam Kupa', key: 'tr', family: 'trophies', min: 1 },
  { id: 'fees', label: 'Toplam Bonservis', key: 'fe', family: 'fees', min: 1, format: 'fee' },
  { id: 'height', label: 'Boy', key: 'h', family: 'bio', min: 150, format: 'cm' },
  { id: 'birth', label: 'Doğum Tarihi', key: 'b', family: 'bio', format: 'date' },
  { id: 'yellow', label: 'Sarı Kart', key: 'y', family: 'cards', min: 10 },
  { id: 'red', label: 'Kırmızı Kart', key: 'r', family: 'cards', min: 2 },
  { id: 'uclApps', label: 'Şampiyonlar Ligi Maçı', short: 'ŞL Maçı', key: 'ua', family: 'ucl', min: 10 },
  { id: 'uclGoals', label: 'Şampiyonlar Ligi Golü', short: 'ŞL Golü', key: 'ug', family: 'ucl', min: 3 },
  ...LEAGUES.flatMap((l) => [
    { id: `${l.code}Apps`, label: `${l.name} Maçı`, short: `${l.short} Maçı`, key: `${l.code}a`, family: l.code, min: 15, league: true },
    { id: `${l.code}Goals`, label: `${l.name} Golü`, short: `${l.short} Golü`, key: `${l.code}g`, family: l.code, min: 3, needs: { key: `${l.code}a`, min: 30 }, league: true },
    { id: `${l.code}Assists`, label: `${l.name} Asisti`, short: `${l.short} Asisti`, key: `${l.code}s`, family: l.code, min: 3, needs: { key: `${l.code}a`, min: 30 }, league: true },
  ]),
];

function dateToDays(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
}

function numericValue(criterion, raw) {
  return criterion.format === 'date' ? dateToDays(raw) : Number(raw);
}

function formatValue(criterion, raw) {
  if (raw == null) return '—';
  switch (criterion.format) {
    case 'fee':
      return `${Number(raw).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} M €`;
    case 'cm':
      return `${raw} cm`;
    case 'date': {
      const [y, m, d] = String(raw).split('-');
      return `${d}.${m}.${y}`;
    }
    default:
      return Number(raw).toLocaleString('tr-TR');
  }
}

function formatDiff(criterion, diff) {
  if (criterion.format === 'date') return `${diff.toLocaleString('tr-TR')} gün`;
  if (criterion.format === 'fee') return `${diff.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} M €`;
  if (criterion.format === 'cm') return `${diff} cm`;
  return diff.toLocaleString('tr-TR');
}

function normalizeName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ø/g, 'o')
    .replace(/ł/g, 'l')
    .replace(/đ/g, 'd')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function isPlayable(criterion, ref) {
  const raw = ref[criterion.key];
  if (raw == null) return false;
  if (criterion.min != null && Number(raw) < criterion.min) return false;
  if (criterion.needs && !(Number(ref[criterion.needs.key] ?? 0) >= criterion.needs.min)) return false;
  return true;
}

// Five criteria from different families, at most two tied to a league.
function pickCriteria(ref) {
  const chosen = [];
  const families = new Set();
  let leagues = 0;
  for (const criterion of shuffle(CRITERIA.filter((c) => isPlayable(c, ref)))) {
    if (families.has(criterion.family)) continue;
    if (criterion.league && leagues >= 2) continue;
    chosen.push(criterion);
    families.add(criterion.family);
    if (criterion.league) leagues += 1;
    if (chosen.length === CRITERIA_PER_REF) break;
  }
  return chosen.length === CRITERIA_PER_REF ? chosen : null;
}

// ---------------- Data ----------------
let poolPromise = null;

function loadPool() {
  if (poolPromise) return poolPromise;
  poolPromise = fetch(PLAYERS_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`players.json ${r.status}`);
      return r.json();
    })
    .then(({ keys, rows }) =>
      rows.map((row) => {
        const player = {};
        keys.forEach((key, i) => {
          if (row[i] != null) player[key] = row[i];
        });
        player.normalized = normalizeName(player.n);
        return player;
      }),
    )
    .catch((error) => {
      // Başarısız indirme hafızada kalmasın; bir sonraki girişte tekrar dener.
      poolPromise = null;
      throw error;
    });
  return poolPromise;
}

function ensureStylesheet() {
  if (document.querySelector('link[data-game-style="kariyer-ikizi"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.gameStyle = 'kariyer-ikizi';
  document.head.append(link);
}

let cleanup = null;

export async function mount(container) {
  ensureStylesheet();
  container.innerHTML = template();
  const pool = await loadPool();
  const byName = new Map(pool.map((p) => [p.n, p]));
  const refBag = createShuffleBag(
    'kariyer-ikizi-ref-bag',
    pool.filter((p) => p.ref).map((p) => p.n),
  );

  const $ = (id) => container.querySelector(`#${id}`);
  const els = {
    homePanel: $('kiHomePanel'),
    infoButton: $('kiInfoButton'),
    startButton: $('kiStartButton'),
    coinPanel: $('kiCoinPanel'),
    coinBackButton: $('kiCoinBackButton'),
    player1Input: $('kiPlayer1Input'),
    player2Input: $('kiPlayer2Input'),
    coinStatus: $('kiCoinStatus'),
    coinName1: $('kiCoinName1'),
    coinName2: $('kiCoinName2'),
    coinResult: $('kiCoinResult'),
    coinWinnerName: $('kiCoinWinnerName'),
    spinCoinButton: $('kiSpinCoinButton'),
    goToGameButton: $('kiGoToGameButton'),
    gamePanel: $('kiGamePanel'),
    helpButton: $('kiHelpButton'),
    scoreNameA: $('kiScoreNameA'),
    scoreNameB: $('kiScoreNameB'),
    scoreA: $('kiScoreA'),
    scoreB: $('kiScoreB'),
    refEyebrow: $('kiRefEyebrow'),
    refName: $('kiRefName'),
    board: $('kiBoard'),
    pickPanel: $('kiPickPanel'),
    turn: $('kiTurn'),
    turnCrit: $('kiTurnCrit'),
    searchInput: $('kiSearchInput'),
    searchClear: $('kiSearchClear'),
    suggestions: $('kiSuggestions'),
    searchStatus: $('kiSearchStatus'),
    undoButton: $('kiUndoButton'),
    revealButton: $('kiRevealButton'),
    result: $('kiResult'),
    resultEyebrow: $('kiResultEyebrow'),
    resultTitle: $('kiResultTitle'),
    resultSub: $('kiResultSub'),
    endGameButton: $('kiEndGameButton'),
    nextRefButton: $('kiNextRefButton'),
    infoModal: $('kiInfoModal'),
    closeInfoButton: $('kiCloseInfoButton'),
  };

  const state = {
    players: [
      { name: 'Oyuncu 1', score: 0 },
      { name: 'Oyuncu 2', score: 0 },
    ],
    coinStarter: -1,
    coinSpinning: false,
    refNumber: 0,
    refStarter: 0,
    ref: null,
    criteria: [],
    row: 0,
    // rows[i] = { picks: [pickA, pickB], order: [playerIdx...], revealed, winner }
    rows: [],
    roundScore: [0, 0],
    used: new Set(),
    revealing: false,
    finished: false,
  };

  const listeners = [];
  const timers = new Set();
  function bind(el, ev, fn, opts) {
    el.addEventListener(ev, fn, opts);
    listeners.push(() => el.removeEventListener(ev, fn, opts));
  }
  function later(fn, ms) {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }

  // ---------------- Panels ----------------
  function showOnly(panel) {
    for (const p of [els.homePanel, els.coinPanel, els.gamePanel]) {
      p.classList.toggle('hidden', p !== panel);
    }
  }

  function toggleInfo(open) {
    els.infoModal.classList.toggle('hidden', !open);
    els.infoModal.setAttribute('aria-hidden', String(!open));
  }

  // ---------------- Coin flip ----------------
  function showCoin() {
    showOnly(els.coinPanel);
    state.coinStarter = -1;
    els.coinName1.classList.remove('highlight', 'dim');
    els.coinName2.classList.remove('highlight', 'dim');
    els.coinResult.classList.add('hidden');
    els.goToGameButton.classList.add('hidden');
    els.spinCoinButton.classList.remove('secondary');
    els.spinCoinButton.textContent = 'Yazı-Tura At';
    updateCoinNames();
    els.player1Input.focus();
  }

  function updateCoinNames() {
    els.coinName1.textContent = els.player1Input.value.trim() || '?';
    els.coinName2.textContent = els.player2Input.value.trim() || '?';
    if (state.coinSpinning) return;
    const ready = els.player1Input.value.trim() && els.player2Input.value.trim();
    els.spinCoinButton.disabled = !ready;
    els.spinCoinButton.classList.toggle('is-disabled', !ready);
    if (!ready) {
      els.coinStatus.textContent = 'İki oyuncunun da adını yaz, sonra yazı-turayı at.';
    } else if (state.coinStarter === -1) {
      els.coinStatus.textContent = "İsimler tamam. Şimdi Yazı-Tura'yı at.";
    }
  }

  function flipCoin() {
    if (state.coinSpinning) return;
    const a = els.player1Input.value.trim();
    const b = els.player2Input.value.trim();
    if (!a || !b) return;
    state.players[0].name = a;
    state.players[1].name = b;
    state.coinSpinning = true;
    els.spinCoinButton.disabled = true;
    els.coinResult.classList.add('hidden');
    els.coinStatus.textContent = 'Yazı-tura dönüyor...';
    const winner = Math.random() < 0.5 ? 0 : 1;
    const totalTicks = 14 + Math.floor(Math.random() * 6);
    let ticks = 0;
    const highlight = (idx) => {
      els.coinName1.classList.toggle('highlight', idx === 0);
      els.coinName2.classList.toggle('highlight', idx === 1);
      els.coinName1.classList.toggle('dim', idx !== 0);
      els.coinName2.classList.toggle('dim', idx !== 1);
    };
    const interval = window.setInterval(() => {
      highlight(ticks % 2);
      ticks += 1;
      if (ticks < totalTicks) return;
      window.clearInterval(interval);
      highlight(winner);
      state.coinStarter = winner;
      state.coinSpinning = false;
      els.coinWinnerName.textContent = state.players[winner].name;
      els.coinResult.classList.remove('hidden');
      els.coinStatus.textContent = 'İlk kriterde bu oyuncu başlar; sonra sıra her kriterde değişir.';
      els.goToGameButton.classList.remove('hidden');
      els.spinCoinButton.textContent = 'Tekrar At';
      els.spinCoinButton.classList.add('secondary');
      els.spinCoinButton.disabled = false;
    }, 90);
    listeners.push(() => window.clearInterval(interval));
  }

  // ---------------- Game ----------------
  function startGame() {
    state.players.forEach((p) => (p.score = 0));
    state.refNumber = 0;
    state.refStarter = state.coinStarter;
    state.finished = false;
    showOnly(els.gamePanel);
    els.scoreNameA.textContent = state.players[0].name;
    els.scoreNameB.textContent = state.players[1].name;
    nextReference();
  }

  function drawReference() {
    // A reference needs five playable criteria; skip the rare ones that don't.
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const ref = byName.get(refBag.draw());
      const criteria = ref && pickCriteria(ref);
      if (criteria) return { ref, criteria };
    }
    return null;
  }

  function nextReference() {
    const drawn = drawReference();
    if (!drawn) {
      els.searchStatus.textContent = 'Uygun futbolcu bulunamadı.';
      return;
    }
    if (state.refNumber > 0) state.refStarter = 1 - state.refStarter;
    state.refNumber += 1;
    state.ref = drawn.ref;
    state.criteria = drawn.criteria;
    state.row = 0;
    state.rows = drawn.criteria.map(() => ({ picks: [null, null], order: [], revealed: false, winner: null }));
    state.roundScore = [0, 0];
    state.used = new Set([drawn.ref.n]);
    state.revealing = false;
    els.refEyebrow.textContent = `${state.refNumber}. Futbolcu`;
    els.refName.textContent = drawn.ref.n;
    els.result.classList.add('hidden');
    els.pickPanel.classList.remove('hidden');
    renderAll();
    focusSearch();
  }

  function rowStarter(rowIndex) {
    return (state.refStarter + rowIndex) % 2;
  }

  function currentPicker() {
    const row = state.rows[state.row];
    if (!row || row.revealed) return null;
    const first = rowStarter(state.row);
    if (!row.picks[first]) return first;
    if (!row.picks[1 - first]) return 1 - first;
    return null;
  }

  function renderScores() {
    els.scoreA.textContent = state.players[0].score;
    els.scoreB.textContent = state.players[1].score;
  }

  function cellHtml(pick, criterion, row, side) {
    if (!pick) return `<span class="ki-cell-name ki-empty">${row === state.row && !state.rows[row].revealed ? '?' : ''}</span>`;
    const value = state.rows[row].revealed ? formatValue(criterion, pick.raw) : '';
    const win = state.rows[row].revealed && state.rows[row].winner === side ? ' ki-win' : '';
    const tie = state.rows[row].revealed && state.rows[row].winner === -1 ? ' ki-tie' : '';
    return `
      <span class="ki-cell-name">${pick.name}</span>
      <span class="ki-cell-val${win}${tie}">${value}</span>
    `;
  }

  function renderBoard() {
    els.board.innerHTML = state.criteria
      .map((criterion, i) => {
        const row = state.rows[i];
        const active = i === state.row && !row.revealed ? ' active' : '';
        const refValue = row.revealed ? formatValue(criterion, state.ref[criterion.key]) : '?';
        return `
          <div class="ki-row${active}${row.revealed ? ' revealed' : ''}" data-row="${i}">
            <div class="ki-cell ki-side${row.winner === 0 ? ' won' : ''}">${cellHtml(row.picks[0], criterion, i, 0)}</div>
            <div class="ki-cell ki-mid">
              <span class="ki-crit">${criterion.short ?? criterion.label}</span>
              <span class="ki-ref-val">${refValue}</span>
            </div>
            <div class="ki-cell ki-side ki-right${row.winner === 1 ? ' won' : ''}">${cellHtml(row.picks[1], criterion, i, 1)}</div>
          </div>
        `;
      })
      .join('');
  }

  function renderPickPanel() {
    const row = state.rows[state.row];
    const criterion = state.criteria[state.row];
    const picker = currentPicker();
    els.undoButton.disabled = !row || row.revealed || row.order.length === 0 || state.revealing;
    if (picker != null) {
      els.turn.textContent = `Sıra: ${state.players[picker].name}`;
      els.turnCrit.textContent = criterion.label;
      els.searchInput.disabled = false;
      els.revealButton.disabled = true;
      els.revealButton.textContent = 'Sonucu Aç';
    } else if (row && !row.revealed) {
      els.turn.textContent = 'İki seçim de hazır';
      els.turnCrit.textContent = criterion.label;
      els.searchInput.disabled = true;
      els.revealButton.disabled = state.revealing;
      els.revealButton.textContent = 'Sonucu Aç';
    } else {
      els.turn.textContent = row?.winner === -1 ? 'Berabere, puan yok' : `Puan: ${state.players[row.winner].name}`;
      els.turnCrit.textContent = criterion.label;
      els.searchInput.disabled = true;
      els.revealButton.disabled = state.revealing;
      els.revealButton.textContent = 'Sonraki Kriter';
    }
  }

  function renderAll() {
    renderScores();
    renderBoard();
    renderPickPanel();
    renderSuggestions();
  }

  function focusSearch() {
    if (!els.searchInput.disabled && window.matchMedia('(hover: hover)').matches) {
      els.searchInput.focus();
    }
  }

  // ---------------- Search ----------------
  function candidates(query) {
    const criterion = state.criteria[state.row];
    const q = normalizeName(query);
    if (!q || !criterion) return [];
    const starts = [];
    const contains = [];
    for (const p of pool) {
      if (p[criterion.key] == null || state.used.has(p.n)) continue;
      if (p.normalized.startsWith(q) || p.normalized.includes(` ${q}`)) starts.push(p);
      else if (p.normalized.includes(q)) contains.push(p);
    }
    // Household names (reference candidates) first, then longer careers, so
    // "vieri" offers Christian before Lido.
    const byFame = (a, b) => (b.ref ?? 0) - (a.ref ?? 0) || (b.ca ?? 0) - (a.ca ?? 0);
    return [...starts.sort(byFame), ...contains.sort(byFame)].slice(0, 8);
  }

  function renderSuggestions() {
    const query = els.searchInput.value;
    if (els.searchInput.disabled || !query.trim()) {
      els.suggestions.innerHTML = '';
      return;
    }
    const list = candidates(query);
    els.suggestions.innerHTML = list
      .map((p) => `<button class="ki-suggestion" type="button" data-name="${p.n.replace(/"/g, '&quot;')}">${p.n}</button>`)
      .join('');
    if (list.length === 0) {
      const criterion = state.criteria[state.row];
      els.searchStatus.className = 'ki-search-status info';
      els.searchStatus.textContent = `Bu isimde, ${criterion.label.toLocaleLowerCase('tr-TR')} verisi olan futbolcu yok.`;
    } else if (els.searchStatus.classList.contains('info')) {
      els.searchStatus.textContent = '';
    }
  }

  function choose(name) {
    const picker = currentPicker();
    const player = byName.get(name);
    if (picker == null || !player) return;
    const criterion = state.criteria[state.row];
    const row = state.rows[state.row];
    row.picks[picker] = { name: player.n, raw: player[criterion.key] };
    row.order.push(picker);
    state.used.add(player.n);
    els.searchInput.value = '';
    els.searchStatus.className = 'ki-search-status ok';
    els.searchStatus.textContent = `${state.players[picker].name} → ${player.n}`;
    renderAll();
    focusSearch();
  }

  function undo() {
    const row = state.rows[state.row];
    if (!row || row.revealed || row.order.length === 0 || state.revealing) return;
    const picker = row.order.pop();
    state.used.delete(row.picks[picker].name);
    row.picks[picker] = null;
    els.searchStatus.className = 'ki-search-status info';
    els.searchStatus.textContent = 'Son seçim geri alındı.';
    renderAll();
    focusSearch();
  }

  // ---------------- Reveal ----------------
  function reveal() {
    const row = state.rows[state.row];
    if (!row || row.revealed || currentPicker() != null || state.revealing) return;
    const criterion = state.criteria[state.row];
    const target = numericValue(criterion, state.ref[criterion.key]);
    const diffs = row.picks.map((p) => Math.abs(numericValue(criterion, p.raw) - target));
    row.winner = diffs[0] === diffs[1] ? -1 : diffs[0] < diffs[1] ? 0 : 1;
    row.revealed = true;
    row.diffs = diffs;
    state.revealing = true;
    if (row.winner >= 0) {
      state.players[row.winner].score += 1;
      state.roundScore[row.winner] += 1;
    }
    renderAll();

    // Ref value first, then the two picks, like the TV format.
    const rowEl = els.board.querySelector(`[data-row="${state.row}"]`);
    rowEl?.classList.add('revealing');
    const vals = rowEl ? [rowEl.querySelector('.ki-ref-val'), ...rowEl.querySelectorAll('.ki-cell-val')] : [];
    vals.forEach((el, i) => later(() => el.classList.add('shown'), 350 * i));
    later(() => {
      rowEl?.classList.remove('revealing');
      state.revealing = false;
      const diffText = diffs.map((d, i) => `${state.players[i].name} ${formatDiff(criterion, d)} uzak`).join(' · ');
      els.searchStatus.className = 'ki-search-status info';
      els.searchStatus.textContent = diffText;
      if (state.row === state.criteria.length - 1) {
        showRoundResult();
      } else {
        renderPickPanel();
      }
    }, 350 * vals.length + 150);
  }

  function nextRow() {
    const row = state.rows[state.row];
    if (!row?.revealed || state.revealing) return;
    if (state.row < state.criteria.length - 1) {
      state.row += 1;
      els.searchStatus.textContent = '';
      renderAll();
      focusSearch();
    }
  }

  function onPrimary() {
    const row = state.rows[state.row];
    if (row?.revealed) nextRow();
    else reveal();
  }

  function showRoundResult() {
    const [a, b] = state.roundScore;
    const [pa, pb] = state.players;
    els.pickPanel.classList.add('hidden');
    els.result.classList.remove('hidden', 'final');
    els.resultEyebrow.textContent = `${state.refNumber}. Futbolcu · ${state.ref.n}`;
    els.resultTitle.textContent = a === b ? `Berabere (${a}-${b})` : `${a > b ? pa.name : pb.name} aldı (${Math.max(a, b)}-${Math.min(a, b)})`;
    els.resultSub.textContent = `Genel skor: ${pa.name} ${pa.score} · ${pb.name} ${pb.score}`;
    els.endGameButton.textContent = 'Bitir';
    els.nextRefButton.textContent = 'Sonraki Futbolcu';
  }

  function endGame() {
    if (state.finished) {
      showCoin();
      return;
    }
    state.finished = true;
    const [pa, pb] = state.players;
    els.result.classList.add('final');
    els.resultEyebrow.textContent = 'Oyun Bitti';
    els.resultTitle.textContent = pa.score === pb.score ? 'Berabere!' : `🏆 ${pa.score > pb.score ? pa.name : pb.name} kazandı`;
    els.resultSub.textContent = `${pa.name} ${pa.score} · ${pb.name} ${pb.score} (${state.refNumber} futbolcu)`;
    els.endGameButton.textContent = 'Yeni Oyun';
    els.nextRefButton.textContent = 'Devam Et';
  }

  function onNextRef() {
    if (state.finished) {
      // "Devam Et": keep scores and carry on with another footballer.
      state.finished = false;
    }
    nextReference();
  }

  // ---------------- Bindings ----------------
  bind(els.startButton, 'click', showCoin);
  bind(els.infoButton, 'click', () => toggleInfo(true));
  bind(els.helpButton, 'click', () => toggleInfo(true));
  bind(els.closeInfoButton, 'click', () => toggleInfo(false));
  bind(els.infoModal, 'click', (e) => {
    if (e.target === els.infoModal) toggleInfo(false);
  });
  bind(document, 'keydown', (e) => {
    if (e.key === 'Escape' && !els.infoModal.classList.contains('hidden')) toggleInfo(false);
  });
  bind(els.coinBackButton, 'click', () => showOnly(els.homePanel));
  bind(els.player1Input, 'input', updateCoinNames);
  bind(els.player2Input, 'input', updateCoinNames);
  bind(els.spinCoinButton, 'click', flipCoin);
  bind(els.goToGameButton, 'click', startGame);
  bind(els.searchInput, 'input', () => {
    if (els.searchStatus.classList.contains('ok')) els.searchStatus.textContent = '';
    renderSuggestions();
  });
  bind(els.searchInput, 'keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = els.suggestions.querySelector('.ki-suggestion');
    if (first) choose(first.dataset.name);
  });
  bind(els.searchClear, 'click', () => {
    els.searchInput.value = '';
    renderSuggestions();
    focusSearch();
  });
  bind(els.suggestions, 'click', (e) => {
    const button = e.target.closest('.ki-suggestion');
    if (button) choose(button.dataset.name);
  });
  bind(els.undoButton, 'click', undo);
  bind(els.revealButton, 'click', onPrimary);
  bind(els.endGameButton, 'click', endGame);
  bind(els.nextRefButton, 'click', onNextRef);

  cleanup = () => {
    listeners.forEach((off) => off());
    listeners.length = 0;
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
  };
}

export function unmount() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}
