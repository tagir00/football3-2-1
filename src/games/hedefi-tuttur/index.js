import { template } from './template.js';

const STYLE_HREF = new URL('./game.css', import.meta.url).href;
const PLAYER_STATS_URL = new URL('./playerStats.json', import.meta.url);
const PICKS_PER_PLAYER = 5;

// Kategori sistemi — ileride yeni ligler/istatistikler eklenebilecek şekilde
// tutuluyor. playerStats.json'a yeni bir alan ekleyip buraya kayıt açman
// yeterli.
// Her kategorinin sabit bir hedefi var (kullanıcının belirlediği), setup'ta
// seçim yok — çark rastgele kategori seçer ve o kategorinin hedefiyle oynanır.
const PLAYER_ENTITY = {
  hint: 'Futbolcunu söyle.',
  slot: '+ Futbolcu',
  placeholder: 'Futbolcu ara...',
  progress: 'Futbolcu',
};

const CATEGORIES = [
  {
    id: 'serieA',
    label: 'Serie A Maçı',
    short: 'SERIE A MAÇI',
    field: 'serieAApps',
    target: 750,
    entity: {
      hint: 'Futbolcunu söyle.',
      slot: '+ Futbolcu',
      placeholder: 'Futbolcu ara...',
      progress: 'Futbolcu',
    },
  },
  {
    id: 'premierLeagueGoals',
    label: 'Premier League Golü',
    short: 'PREMIER LEAGUE GOLÜ',
    field: 'premierLeagueGoals',
    target: 200,
    entity: {
      hint: 'Futbolcunu söyle.',
      slot: '+ Futbolcu',
      placeholder: 'Futbolcu ara...',
      progress: 'Futbolcu',
    },
  },
  {
    id: 'turkishCoachSuperLig',
    label: 'Türk TD Süper Lig Maçı',
    short: 'SÜPER LİG MAÇI (TD)',
    field: 'turkishCoachSuperLigApps',
    target: 750,
    entity: {
      hint: 'Teknik direktörünü söyle.',
      slot: '+ Teknik Direktör',
      placeholder: 'Teknik direktör ara...',
      progress: 'Teknik Direktör',
    },
  },
  {
    id: 'bundesligaGoals',
    label: 'Bundesliga Golü',
    short: 'BUNDESLIGA GOLÜ',
    field: 'bundesligaGoals',
    target: 500,
    entity: {
      hint: 'Futbolcunu söyle.',
      slot: '+ Futbolcu',
      placeholder: 'Futbolcu ara...',
      progress: 'Futbolcu',
    },
  },
  {
    id: 'laLigaAssists',
    label: 'La Liga Asisti',
    short: 'LA LIGA ASİSTİ',
    field: 'laLigaAssists',
    target: 450,
    entity: {
      hint: 'Futbolcunu söyle.',
      slot: '+ Futbolcu',
      placeholder: 'Futbolcu ara...',
      progress: 'Futbolcu',
    },
  },
  {
    id: 'superLigGoals',
    label: 'Süper Lig Golü',
    short: 'SÜPER LİG GOLÜ',
    field: 'superLigGoals',
    target: 500,
    entity: {
      hint: 'Futbolcunu söyle.',
      slot: '+ Futbolcu',
      placeholder: 'Futbolcu ara...',
      progress: 'Futbolcu',
    },
  },
  {
    id: 'uclGoals',
    label: 'Şampiyonlar Ligi Golü',
    short: 'ŞAMPİYONLAR LİGİ GOLÜ',
    field: 'uclGoals',
    target: 300,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'turkeyGoals',
    label: 'Türk Milli Takım Golü',
    short: 'A MİLLİ TAKIM GOLÜ',
    field: 'turkeyGoals',
    target: 80,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'careerTrophies',
    label: 'Kariyer Kupası',
    short: 'KARİYER KUPASI',
    field: 'careerTrophies',
    target: 100,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'premierLeagueApps',
    label: 'Premier League Maçı',
    short: 'PREMIER LEAGUE MAÇI',
    field: 'premierLeagueApps',
    target: 750,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'worldCupGoals',
    label: 'Dünya Kupası Golü',
    short: 'DÜNYA KUPASI GOLÜ',
    field: 'worldCupGoals',
    target: 70,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'ligue1Goals',
    label: 'Ligue 1 Golü',
    short: 'LIGUE 1 GOLÜ',
    field: 'ligue1Goals',
    target: 500,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'uclAssists',
    label: 'Şampiyonlar Ligi Asisti',
    short: 'ŞAMPİYONLAR LİGİ ASİSTİ',
    field: 'uclAssists',
    target: 120,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'redCards',
    label: 'Kırmızı Kart',
    short: 'KIRMIZI KART',
    field: 'redCards',
    target: 60,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'serieAAssists',
    label: 'Serie A Asisti',
    short: 'SERIE A ASİSTİ',
    field: 'serieAAssists',
    target: 500,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'superLigApps',
    label: 'Süper Lig Maçı',
    short: 'SÜPER LİG MAÇI',
    field: 'superLigApps',
    target: 750,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'transferFees',
    label: 'Toplam Bonservis Bedeli',
    short: 'BONSERVİS BEDELİ',
    // Milyon € cinsinden (Transfermarkt kariyer toplamı, kiralık bedelleri dahil).
    field: 'transferFees',
    target: 600,
    unit: 'M €',
    entity: PLAYER_ENTITY,
  },
  {
    id: 'laLigaGoals',
    label: 'La Liga Golü',
    short: 'LA LIGA GOLÜ',
    field: 'laLigaGoals',
    target: 500,
    entity: PLAYER_ENTITY,
  },
  {
    id: 'turkeyApps',
    label: 'Türk Milli Takım Maçı',
    short: 'A MİLLİ TAKIM MAÇI',
    field: 'turkeyApps',
    target: 400,
    entity: PLAYER_ENTITY,
  },
];

function ensureStylesheet() {
  if (document.querySelector('link[data-game-style="hedefi-tuttur"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.gameStyle = 'hedefi-tuttur';
  document.head.append(link);
}

// Kategori değerini ekranda göster — birimli kategorilerde (bonservis, M €)
// ondalık ve birim eklenir, diğerleri düz sayı.
function formatValue(category, value) {
  if (!category?.unit) return String(value);
  const num = value.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  return `${num} ${category.unit}`;
}

// Ondalıklı toplamlarda kayan nokta artığını temizle (0.1 + 0.2 gibi).
function roundValue(value) {
  return Math.round(value * 100) / 100;
}

function normalizeName(name) {
  return String(name ?? '')
    .normalize('NFD')
    // Kombinasyon aksan işaretlerini çıkar
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // Türkçe özel karakterler için ek eşleme
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

let cleanup = null;
let statsPromise = null;

function loadStats() {
  if (statsPromise) return statsPromise;
  statsPromise = fetch(PLAYER_STATS_URL)
    .then((r) => r.json())
    .then((rows) =>
      rows.map((p, idx) => ({
        id: idx,
        name: p.name,
        normalized: normalizeName(p.name),
        stats: p, // ham stats — alan seçimi kategoriye göre yapılır
      })),
    );
  return statsPromise;
}

export async function mount(container) {
  ensureStylesheet();
  container.innerHTML = template();
  const playerPool = await loadStats();

  const els = {
    // Home
    homePanel: container.querySelector('#htHomePanel'),
    infoButton: container.querySelector('#htInfoButton'),
    startButton: container.querySelector('#htStartButton'),
    // İsim girişi + yazı-tura (tek ekran)
    coinPanel: container.querySelector('#htCoinPanel'),
    coinBackButton: container.querySelector('#htCoinBackButton'),
    player1Input: container.querySelector('#htPlayer1Input'),
    player2Input: container.querySelector('#htPlayer2Input'),
    coinStatus: container.querySelector('#htCoinStatus'),
    coinName1: container.querySelector('#htCoinName1'),
    coinName2: container.querySelector('#htCoinName2'),
    coinResult: container.querySelector('#htCoinResult'),
    coinWinnerName: container.querySelector('#htCoinWinnerName'),
    spinCoinButton: container.querySelector('#htSpinCoinButton'),
    goToWheelButton: container.querySelector('#htGoToWheelButton'),
    // Wheel
    wheelPanel: container.querySelector('#htWheelPanel'),
    wheelBackButton: container.querySelector('#htWheelBackButton'),
    wheelStatus: container.querySelector('#htWheelStatus'),
    wheelDisplay: container.querySelector('#htWheelDisplay'),
    wheelTitle: container.querySelector('#htWheelTitle'),
    wheelSub: container.querySelector('#htWheelSub'),
    wheelTargetBlock: container.querySelector('#htWheelTargetBlock'),
    wheelTargetVal: container.querySelector('#htWheelTargetVal'),
    spinWheelButton: container.querySelector('#htSpinWheelButton'),
    goToGameButton: container.querySelector('#htGoToGameButton'),
    // Game
    gamePanel: container.querySelector('#htGamePanel'),
    helpButton: container.querySelector('#htHelpButton'),
    scoreNameA: container.querySelector('#htScoreNameA'),
    scoreNameB: container.querySelector('#htScoreNameB'),
    scoreA: container.querySelector('#htScoreA'),
    scoreB: container.querySelector('#htScoreB'),
    playerColA: container.querySelector('#htPlayerColA'),
    playerColB: container.querySelector('#htPlayerColB'),
    playerNameA: container.querySelector('#htPlayerNameA'),
    playerNameB: container.querySelector('#htPlayerNameB'),
    progressA: container.querySelector('#htProgressA'),
    progressB: container.querySelector('#htProgressB'),
    slotListA: container.querySelector('#htSlotListA'),
    slotListB: container.querySelector('#htSlotListB'),
    totalA: container.querySelector('#htTotalA'),
    totalB: container.querySelector('#htTotalB'),
    diffA: container.querySelector('#htDiffA'),
    diffB: container.querySelector('#htDiffB'),
    targetValue: container.querySelector('#htTargetValue'),
    targetCat: container.querySelector('#htTargetCat'),
    turnName: container.querySelector('#htTurnName'),
    turnProgress: container.querySelector('#htTurnProgress'),
    turnHint: container.querySelector('#htTurnHint'),
    searchInput: container.querySelector('#htSearchInput'),
    searchClear: container.querySelector('#htSearchClear'),
    suggestions: container.querySelector('#htSuggestions'),
    searchStatus: container.querySelector('#htSearchStatus'),
    undoButton: container.querySelector('#htUndoButton'),
    resetRoundButton: container.querySelector('#htResetRoundButton'),
    revealButton: container.querySelector('#htRevealButton'),
    result: container.querySelector('#htResult'),
    resultEyebrow: container.querySelector('#htResultEyebrow'),
    resultTitle: container.querySelector('#htResultTitle'),
    resultSub: container.querySelector('#htResultSub'),
    endGameButton: container.querySelector('#htEndGameButton'),
    nextRoundButton: container.querySelector('#htNextRoundButton'),
    // Modals
    infoModal: container.querySelector('#htInfoModal'),
    closeInfoButton: container.querySelector('#htCloseInfoButton'),
    confirmModal: container.querySelector('#htConfirmModal'),
    confirmText: container.querySelector('#htConfirmText'),
    confirmOk: container.querySelector('#htConfirmOk'),
    confirmCancel: container.querySelector('#htConfirmCancel'),
  };

  const state = {
    players: [
      { name: 'Oyuncu 1', score: 0 },
      { name: 'Oyuncu 2', score: 0 },
    ],
    picks: [[], []], // her biri { id, name, apps } dizisi; apps DOM'a reveal'a kadar konmaz
    activePlayer: 0,
    starter: 0,
    turnOrder: [], // önceden hesaplanmış sıra
    turnIndex: 0,
    // Kategori çarktan gelene kadar null. `target` her zaman category.target'tan okunur.
    category: null,
    phase: 'setup', // setup | picking | revealing | result
    pendingConfirm: null,
    // Coin flip: winner becomes the starter for round 1. -1 = not yet flipped.
    coinStarter: -1,
    coinSpinning: false,
    wheelSpinning: false,
  };

  // Aktif hedef — category.target'tan okunur (setup'ta target chip yok).
  function currentTarget() {
    return state.category?.target ?? 0;
  }

  const listeners = [];
  function bind(el, ev, fn, opts) {
    el.addEventListener(ev, fn, opts);
    listeners.push(() => el.removeEventListener(ev, fn, opts));
  }

  function statFor(player) {
    return Number(player.stats[state.category.field] ?? 0);
  }

  // Bir futbolcu, aktif kategori için havuzda ancak `state.category.field`
  // alanı tanımlıysa (0 dahil) uygun sayılır. Bu sayede Premier League modunda
  // yalnız Serie A'da oynamış futbolcular öneriye çıkmaz — ve tersi.
  function isEligibleForCurrentCategory(player) {
    return player.stats[state.category.field] != null;
  }

  // ---------------- Panels ----------------

  function showHome() {
    els.homePanel.classList.remove('hidden');
    els.coinPanel.classList.add('hidden');
    els.wheelPanel.classList.add('hidden');
    els.gamePanel.classList.add('hidden');
  }

  // Draftinho ile aynı akış: isimler ve yazı-tura tek ekranda.
  function showCoin() {
    els.homePanel.classList.add('hidden');
    els.coinPanel.classList.remove('hidden');
    els.wheelPanel.classList.add('hidden');
    els.gamePanel.classList.add('hidden');
    resetCoinUI();
    els.player1Input.focus();
  }

  function resetCoinUI() {
    state.coinStarter = -1;
    state.coinSpinning = false;
    els.coinName1.classList.remove('highlight', 'dim');
    els.coinName2.classList.remove('highlight', 'dim');
    els.coinResult.classList.add('hidden');
    els.goToWheelButton.classList.add('hidden');
    els.spinCoinButton.classList.remove('secondary');
    els.spinCoinButton.textContent = 'Yazı-Tura At';
    els.coinStatus.textContent = "İsimleri gir, sonra Yazı-Tura'ya bas.";
    updateCoinNamesFromInputs();
  }

  function updateCoinNamesFromInputs() {
    els.coinName1.textContent = els.player1Input.value.trim() || '?';
    els.coinName2.textContent = els.player2Input.value.trim() || '?';
    updateFlipButtonState();
  }

  function updateFlipButtonState() {
    if (state.coinSpinning) return;
    const bothFilled = els.player1Input.value.trim().length > 0 && els.player2Input.value.trim().length > 0;
    els.spinCoinButton.disabled = !bothFilled;
    els.spinCoinButton.classList.toggle('is-disabled', !bothFilled);
    if (!bothFilled) {
      els.coinStatus.textContent = 'İki oyuncunun da adını yaz, sonra yazı-turayı at.';
    } else if (state.coinStarter === -1) {
      els.coinStatus.textContent = "İsimler tamam. Şimdi Yazı-Tura'yı at.";
    }
  }

  function flipCoin() {
    if (state.coinSpinning) return;
    const a = els.player1Input.value.trim();
    const b = els.player2Input.value.trim();
    if (!a || !b) {
      els.coinStatus.textContent = 'İki oyuncunun da adını girmen gerek.';
      (a ? els.player2Input : els.player1Input).focus();
      return;
    }
    state.players[0].name = a;
    state.players[1].name = b;
    updateCoinNamesFromInputs();
    state.coinSpinning = true;
    els.spinCoinButton.disabled = true;
    els.coinResult.classList.add('hidden');
    els.coinStatus.textContent = 'Yazı-tura dönüyor...';

    const finalIndex = Math.random() < 0.5 ? 0 : 1;
    const totalTicks = 14 + Math.floor(Math.random() * 6);
    let ticks = 0;
    const setHighlight = (idx) => {
      els.coinName1.classList.toggle('highlight', idx === 0);
      els.coinName2.classList.toggle('highlight', idx === 1);
      els.coinName1.classList.toggle('dim', idx !== 0);
      els.coinName2.classList.toggle('dim', idx !== 1);
    };
    const interval = window.setInterval(() => {
      setHighlight(ticks % 2);
      ticks++;
      if (ticks >= totalTicks) {
        window.clearInterval(interval);
        setHighlight(finalIndex);
        state.coinStarter = finalIndex;
        state.coinSpinning = false;
        els.coinWinnerName.textContent = state.players[finalIndex].name;
        els.coinResult.classList.remove('hidden');
        els.coinStatus.textContent = 'Sonuç geldi. Oyun boyunca ilk seçen bu oyuncu olur (turlar arası sıra değişir).';
        els.goToWheelButton.classList.remove('hidden');
        els.spinCoinButton.textContent = 'Tekrar At';
        els.spinCoinButton.classList.add('secondary');
        els.spinCoinButton.disabled = false;
      }
    }, 90);
  }

  function showWheel() {
    els.homePanel.classList.add('hidden');
    els.coinPanel.classList.add('hidden');
    els.wheelPanel.classList.remove('hidden');
    els.gamePanel.classList.add('hidden');
    resetWheelUI();
  }

  function resetWheelUI() {
    state.category = null;
    state.wheelSpinning = false;
    els.wheelTitle.textContent = '?';
    els.wheelSub.textContent = 'Çark dönmeye hazır';
    els.wheelTargetBlock.classList.add('hidden');
    els.wheelDisplay.classList.remove('spinning', 'landed');
    els.spinWheelButton.disabled = false;
    els.spinWheelButton.classList.remove('secondary');
    els.spinWheelButton.textContent = 'Kriter Çarkını Çevir';
    els.goToGameButton.classList.add('hidden');
    els.wheelStatus.textContent = 'Çark hazır. Çevir ve kategoriyi belirle.';
  }

  function spinWheel() {
    if (state.wheelSpinning) return;
    state.wheelSpinning = true;
    els.spinWheelButton.disabled = true;
    els.wheelStatus.textContent = 'Çark dönüyor...';
    els.goToGameButton.classList.add('hidden');
    els.wheelTargetBlock.classList.add('hidden');
    els.wheelDisplay.classList.remove('landed');
    els.wheelDisplay.classList.add('spinning');

    // Aynı kategori üst üste gelmesin — daha önce çıktıysa havuzdan çıkar.
    const pool = state.category
      ? CATEGORIES.filter((c) => c.id !== state.category.id)
      : CATEGORIES;
    const finalCat = pool[Math.floor(Math.random() * pool.length)];

    let ticks = 0;
    const totalTicks = 18 + Math.floor(Math.random() * 6);
    const interval = window.setInterval(() => {
      const tempCat = CATEGORIES[ticks % CATEGORIES.length];
      els.wheelTitle.textContent = tempCat.label;
      els.wheelSub.textContent = tempCat.short;
      ticks++;
      if (ticks >= totalTicks) {
        window.clearInterval(interval);
        state.category = finalCat;
        els.wheelTitle.textContent = finalCat.label;
        els.wheelSub.textContent = finalCat.short;
        els.wheelTargetVal.textContent = formatValue(finalCat, finalCat.target);
        els.wheelTargetBlock.classList.remove('hidden');
        els.wheelDisplay.classList.remove('spinning');
        els.wheelDisplay.classList.add('landed');
        state.wheelSpinning = false;
        els.spinWheelButton.disabled = false;
        els.spinWheelButton.textContent = 'Tekrar Çevir';
        els.spinWheelButton.classList.add('secondary');
        els.goToGameButton.classList.remove('hidden');
        els.wheelStatus.textContent = 'Kategori belirlendi. Oyuna geçebilirsin.';
        setTimeout(() => els.wheelDisplay.classList.remove('landed'), 620);
      }
    }, 90);
  }

  function showGame() {
    els.homePanel.classList.add('hidden');
    els.coinPanel.classList.add('hidden');
    els.wheelPanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');
  }

  function startGame() {
    // Names were already captured on flipCoin(). Fall back to defaults if the
    // coin was somehow skipped.
    if (!state.players[0].name) state.players[0].name = 'Oyuncu 1';
    if (!state.players[1].name) state.players[1].name = 'Oyuncu 2';
    // Score is preserved across rounds within this mount lifetime; only reset
    // when leaving the game (endGame). Coin winner (if any) becomes starter.
    startRound(true);
    showGame();
  }

  // ---------------- Round lifecycle ----------------

  function startRound(freshGame) {
    state.picks = [[], []];
    // Starter alternates each round; the fresh-game starter comes from the
    // coin flip when one was performed, else defaults to player 0.
    if (freshGame) state.starter = state.coinStarter >= 0 ? state.coinStarter : 0;
    else state.starter = state.starter === 0 ? 1 : 0;
    state.activePlayer = state.starter;
    state.turnOrder = buildTurnOrder(state.starter);
    state.turnIndex = 0;
    state.phase = 'picking';
    hideResult();
    renderAll();
    els.searchInput.disabled = false;
    els.searchInput.value = '';
    els.searchStatus.textContent = '';
    els.searchStatus.className = 'ht-search-status';
    els.suggestions.innerHTML = '';
    els.revealButton.disabled = true;
    els.undoButton.disabled = true;
    // Modda odak arama alanına gitsin (mobilde klavye açılmasın diye burada
    // odaklamıyoruz — moderator manuel dokunacak).
  }

  function buildTurnOrder(starter) {
    const order = [];
    for (let i = 0; i < PICKS_PER_PLAYER * 2; i++) {
      order.push(i % 2 === 0 ? starter : (starter === 0 ? 1 : 0));
    }
    return order;
  }

  function hideResult() {
    els.result.classList.add('hidden');
    els.result.classList.remove('win', 'tie');
  }

  // ---------------- Rendering ----------------

  function renderAll() {
    renderHeader();
    renderSlots();
    renderTurnPanel();
    renderTotalsBar();
  }

  function renderHeader() {
    els.scoreNameA.textContent = state.players[0].name;
    els.scoreNameB.textContent = state.players[1].name;
    els.scoreA.textContent = state.players[0].score;
    els.scoreB.textContent = state.players[1].score;
    els.playerNameA.textContent = state.players[0].name;
    els.playerNameB.textContent = state.players[1].name;
    els.progressA.textContent = `${state.picks[0].length} / ${PICKS_PER_PLAYER}`;
    els.progressB.textContent = `${state.picks[1].length} / ${PICKS_PER_PLAYER}`;
    els.targetValue.textContent = formatValue(state.category, currentTarget());
    els.targetCat.textContent = state.category.short;

    els.playerColA.classList.toggle('turn-active', state.phase === 'picking' && state.activePlayer === 0);
    els.playerColB.classList.toggle('turn-active', state.phase === 'picking' && state.activePlayer === 1);
  }

  function renderSlots() {
    const slotLabel = state.category.entity.slot;
    for (const playerIdx of [0, 1]) {
      const list = playerIdx === 0 ? els.slotListA : els.slotListB;
      const items = list.querySelectorAll('.ht-slot');
      const picks = state.picks[playerIdx];
      items.forEach((li, i) => {
        const pick = picks[i];
        if (!pick) {
          li.className = 'ht-slot empty';
          li.dataset.slot = String(i);
          li.innerHTML = `<span class="ht-slot-placeholder">${slotLabel}</span>`;
        } else {
          const wasRevealed = li.classList.contains('revealed');
          li.className = 'ht-slot filled' + (wasRevealed ? ' revealed' : '');
          li.dataset.slot = String(i);
          // İstatistik DOM'da başlangıçta boş. Reveal aşamasında sayı basılır.
          li.innerHTML = `
            <span class="ht-slot-name" title="${pick.name}">${pick.name}</span>
            <span class="ht-slot-stat" aria-hidden="true"></span>
          `;
        }
      });
    }
  }

  function renderTurnPanel() {
    if (state.phase !== 'picking') {
      els.turnName.textContent = '—';
      els.turnProgress.textContent = 'Bekleme';
      els.turnHint.textContent = state.phase === 'revealing' ? 'Sonuçlar açılıyor...' : '';
      els.searchInput.disabled = true;
      return;
    }
    const p = state.players[state.activePlayer];
    els.turnName.textContent = p.name;
    const picksNow = state.picks[state.activePlayer].length + 1;
    const entity = state.category.entity;
    els.turnProgress.textContent = `${picksNow} / ${PICKS_PER_PLAYER} ${entity.progress}`;
    els.turnHint.textContent = `"${entity.hint}"`;
    els.searchInput.placeholder = entity.placeholder;
    els.searchInput.disabled = false;
  }

  function renderTotalsBar() {
    // Picking sırasında toplam gösterilmez.
    if (state.phase === 'picking' || state.phase === 'setup') {
      els.totalA.textContent = '—';
      els.totalB.textContent = '—';
      els.diffA.textContent = '';
      els.diffB.textContent = '';
      els.diffA.classList.remove('win-diff');
      els.diffB.classList.remove('win-diff');
    }
  }

  // ---------------- Search & pick ----------------

  function usedIds() {
    return new Set([...state.picks[0], ...state.picks[1]].map((p) => p.id));
  }

  function findByExactOrPrefix(query) {
    const q = normalizeName(query);
    if (!q) return null;
    const pool = playerPool.filter(isEligibleForCurrentCategory);
    const exact = pool.find((p) => p.normalized === q);
    if (exact) return exact;
    const starts = pool.find((p) => p.normalized.startsWith(q));
    if (starts) return starts;
    return pool.find((p) => p.normalized.includes(q)) ?? null;
  }

  function renderSuggestions() {
    const q = normalizeName(els.searchInput.value);
    if (!q) {
      els.suggestions.innerHTML = '';
      return;
    }
    const used = usedIds();
    const matches = playerPool
      .filter(isEligibleForCurrentCategory)
      .filter((p) => p.normalized.includes(q))
      .slice(0, 12);
    els.suggestions.innerHTML = matches
      .map(
        (p) => `<button type="button" class="ht-suggestion${used.has(p.id) ? ' used' : ''}" data-id="${p.id}"${used.has(p.id) ? ' disabled' : ''}>${p.name}</button>`,
      )
      .join('');
    els.suggestions.querySelectorAll('[data-id]').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('used')) return;
        const id = Number(chip.dataset.id);
        const player = playerPool.find((p) => p.id === id);
        if (player) selectPlayer(player);
      });
    });
  }

  function setSearchStatus(msg, kind) {
    els.searchStatus.className = 'ht-search-status' + (kind ? ` ${kind}` : '');
    els.searchStatus.textContent = msg;
  }

  function submitSearch() {
    if (state.phase !== 'picking') return;
    const raw = els.searchInput.value.trim();
    if (!raw) {
      setSearchStatus('Bir futbolcu adı yaz.', 'info');
      return;
    }
    const found = findByExactOrPrefix(raw);
    if (!found) {
      // Kategori dışı bulunan biri var mı? Farklı bir uyarı verelim.
      const q = normalizeName(raw);
      const outsideCat = playerPool.find((p) => p.normalized.includes(q));
      if (outsideCat && !isEligibleForCurrentCategory(outsideCat)) {
        setSearchStatus(`${outsideCat.name} bu kategoride uygun değil.`, '');
      } else {
        setSearchStatus(`"${raw}" havuzda bulunamadı. Farklı bir yazım dene.`, '');
      }
      return;
    }
    selectPlayer(found);
  }

  function selectPlayer(player) {
    if (state.phase !== 'picking') return;
    if (usedIds().has(player.id)) {
      setSearchStatus(`${player.name} bu turda zaten kullanıldı.`, '');
      return;
    }
    const activePlayer = state.activePlayer;
    // İstatistik gizli — sadece state'te tutulur, DOM'a reveal aşamasında yazılır.
    const pick = {
      id: player.id,
      name: player.name,
      apps: statFor(player),
    };
    state.picks[activePlayer].push(pick);
    state.turnIndex++;
    animateSlotEntry(activePlayer, state.picks[activePlayer].length - 1);
    els.searchInput.value = '';
    els.suggestions.innerHTML = '';
    setSearchStatus(`${activePlayer === 0 ? state.players[0].name : state.players[1].name} → ${player.name} eklendi.`, 'ok');
    els.undoButton.disabled = false;

    if (state.turnIndex >= state.turnOrder.length) {
      // 10 seçim tamam
      state.phase = 'ready-to-reveal';
      state.activePlayer = -1;
      els.searchInput.disabled = true;
      els.revealButton.disabled = false;
      els.turnName.textContent = 'Hazır';
      els.turnProgress.textContent = 'Sonuçları Aç';
      const entityLc = state.category.entity.progress.toLowerCase();
      els.turnHint.textContent = `10 ${entityLc} tamam. Sonuçları aç.`;
      renderHeader();
      return;
    }

    state.activePlayer = state.turnOrder[state.turnIndex];
    renderHeader();
    renderTurnPanel();
    renderSlots();
    els.searchInput.focus();
  }

  function animateSlotEntry(playerIdx, slotIdx) {
    renderSlots();
    const list = playerIdx === 0 ? els.slotListA : els.slotListB;
    const li = list.querySelector(`.ht-slot[data-slot="${slotIdx}"]`);
    if (li) {
      li.classList.add('enter');
      setTimeout(() => li.classList.remove('enter'), 360);
    }
  }

  // ---------------- Undo / Reset ----------------

  function undoLast() {
    if (state.phase !== 'picking' && state.phase !== 'ready-to-reveal') return;
    if (state.turnIndex === 0) return;
    // ready-to-reveal aşamasında da bir geri alma bizi tekrar picking'e döndürür.
    state.turnIndex--;
    const whoWasIt = state.turnOrder[state.turnIndex];
    state.picks[whoWasIt].pop();
    state.activePlayer = whoWasIt;
    state.phase = 'picking';
    els.revealButton.disabled = true;
    els.searchInput.disabled = false;
    els.undoButton.disabled = state.turnIndex === 0;
    setSearchStatus('Son seçim geri alındı.', 'info');
    renderAll();
  }

  function askConfirm(text, onConfirm) {
    els.confirmText.textContent = text;
    state.pendingConfirm = onConfirm;
    els.confirmModal.classList.remove('hidden');
    els.confirmModal.setAttribute('aria-hidden', 'false');
  }
  function closeConfirm() {
    els.confirmModal.classList.add('hidden');
    els.confirmModal.setAttribute('aria-hidden', 'true');
    state.pendingConfirm = null;
  }

  function resetRound() {
    askConfirm('Bu turdaki tüm seçimler silinecek. Devam etmek istiyor musun?', () => {
      // Aynı başlatıcı ile turu yeniden kur — freshGame=false ise starter dönerdi,
      // burada mevcut turu sıfırladığımız için starter'ı korumalıyız. startRound
      // freshGame=true olsaydı starter'ı da sıfırlardı; iki durumu da istemiyoruz.
      const currentStarter = state.starter;
      state.picks = [[], []];
      state.starter = currentStarter;
      state.activePlayer = currentStarter;
      state.turnOrder = buildTurnOrder(currentStarter);
      state.turnIndex = 0;
      state.phase = 'picking';
      hideResult();
      renderAll();
      els.searchInput.disabled = false;
      els.searchInput.value = '';
      els.suggestions.innerHTML = '';
      setSearchStatus('Tur sıfırlandı.', 'info');
      els.revealButton.disabled = true;
      els.undoButton.disabled = true;
    });
  }

  // ---------------- Reveal ----------------

  function reveal() {
    if (state.picks[0].length < PICKS_PER_PLAYER || state.picks[1].length < PICKS_PER_PLAYER) return;
    state.phase = 'revealing';
    els.revealButton.disabled = true;
    els.undoButton.disabled = true;
    els.searchInput.disabled = true;
    els.turnName.textContent = 'Sonuçlar';
    els.turnProgress.textContent = 'Açılıyor';
    els.turnHint.textContent = '';

    // İki oyuncunun 5'er slotunu sırayla animate ediyoruz.
    const sequence = [];
    for (let i = 0; i < PICKS_PER_PLAYER; i++) {
      sequence.push({ player: 0, slot: i });
      sequence.push({ player: 1, slot: i });
    }

    let step = 0;
    const revealDelay = 380;
    function next() {
      if (step >= sequence.length) {
        setTimeout(revealTotals, 240);
        return;
      }
      const { player, slot } = sequence[step];
      revealSlot(player, slot);
      step++;
      setTimeout(next, revealDelay);
    }
    next();
  }

  function revealSlot(playerIdx, slotIdx) {
    const pick = state.picks[playerIdx][slotIdx];
    if (!pick) return;
    const list = playerIdx === 0 ? els.slotListA : els.slotListB;
    const li = list.querySelector(`.ht-slot[data-slot="${slotIdx}"]`);
    if (!li) return;
    const statEl = li.querySelector('.ht-slot-stat');
    if (statEl) {
      statEl.textContent = formatValue(state.category, pick.apps);
    }
    li.classList.add('revealed');
  }

  function revealTotals() {
    const totalA = roundValue(state.picks[0].reduce((s, p) => s + p.apps, 0));
    const totalB = roundValue(state.picks[1].reduce((s, p) => s + p.apps, 0));
    animateCount(els.totalA, totalA, 700);
    animateCount(els.totalB, totalB, 700);
    setTimeout(() => revealResult(totalA, totalB), 780);
  }

  function animateCount(el, target, ms) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(eased * target);
      el.textContent = formatValue(state.category, v);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatValue(state.category, target);
    }
    requestAnimationFrame(tick);
  }

  function revealResult(totalA, totalB) {
    const target = currentTarget();
    const diffA = roundValue(Math.abs(totalA - target));
    const diffB = roundValue(Math.abs(totalB - target));
    const fmt = (v) => formatValue(state.category, v);
    els.diffA.textContent = `${fmt(diffA)} uzak`;
    els.diffB.textContent = `${fmt(diffB)} uzak`;
    els.diffA.classList.remove('win-diff');
    els.diffB.classList.remove('win-diff');
    els.playerColA.classList.remove('turn-active');
    els.playerColB.classList.remove('turn-active');

    els.result.classList.remove('hidden', 'win', 'tie');

    if (diffA === diffB) {
      els.result.classList.add('tie');
      els.resultEyebrow.textContent = 'Tur Sonucu';
      els.resultTitle.textContent = 'Berabere';
      els.resultSub.textContent = `İki oyuncu da hedeften ${fmt(diffA)} uzakta bitirdi. Skor değişmedi.`;
    } else {
      const winnerIdx = diffA < diffB ? 0 : 1;
      const winner = state.players[winnerIdx];
      const loser = state.players[winnerIdx === 0 ? 1 : 0];
      const winnerDiff = winnerIdx === 0 ? diffA : diffB;
      const loserDiff = winnerIdx === 0 ? diffB : diffA;
      winner.score++;
      state.players[winnerIdx] = winner;

      els.result.classList.add('win');
      els.resultEyebrow.textContent = 'Kazanan';
      els.resultTitle.textContent = `🏆 ${winner.name}`;
      els.resultSub.textContent = `${winner.name} ${fmt(winnerDiff)} uzak · ${loser.name} ${fmt(loserDiff)} uzak`;

      const winCol = winnerIdx === 0 ? els.playerColA : els.playerColB;
      const winDiff = winnerIdx === 0 ? els.diffA : els.diffB;
      winCol.classList.add('turn-active'); // vurgulu kalsın
      winDiff.classList.add('win-diff');
    }

    state.phase = 'result';
    renderHeader();
  }

  // ---------------- End of round ----------------

  function nextRound() {
    startRound(false);
    els.searchInput.focus();
  }

  function endGame() {
    // Skorları da sıfırla ve isim/yazı-tura ekranına dön (yeni oyun için yazı-tura + çark yeniden döner).
    state.players[0].score = 0;
    state.players[1].score = 0;
    state.coinStarter = -1;
    state.category = null;
    showCoin();
  }

  // ---------------- Modals ----------------

  function openInfo() {
    els.infoModal.classList.remove('hidden');
    els.infoModal.setAttribute('aria-hidden', 'false');
  }
  function closeInfo() {
    els.infoModal.classList.add('hidden');
    els.infoModal.setAttribute('aria-hidden', 'true');
  }

  // ---------------- Wiring ----------------

  bind(els.startButton, 'click', showCoin);
  bind(els.infoButton, 'click', openInfo);
  bind(els.helpButton, 'click', openInfo);
  bind(els.closeInfoButton, 'click', closeInfo);
  bind(els.infoModal, 'click', (e) => { if (e.target === els.infoModal) closeInfo(); });
  bind(els.player1Input, 'input', updateCoinNamesFromInputs);
  bind(els.player2Input, 'input', updateCoinNamesFromInputs);
  bind(els.coinBackButton, 'click', showHome);
  bind(els.spinCoinButton, 'click', flipCoin);
  bind(els.goToWheelButton, 'click', showWheel);
  bind(els.wheelBackButton, 'click', showCoin);
  bind(els.spinWheelButton, 'click', spinWheel);
  bind(els.goToGameButton, 'click', startGame);

  bind(els.searchInput, 'input', renderSuggestions);
  bind(els.searchInput, 'keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSearch();
    }
  });
  bind(els.searchClear, 'click', () => {
    els.searchInput.value = '';
    els.suggestions.innerHTML = '';
    setSearchStatus('', '');
    els.searchInput.focus();
  });

  bind(els.undoButton, 'click', undoLast);
  bind(els.resetRoundButton, 'click', resetRound);
  bind(els.revealButton, 'click', reveal);
  bind(els.nextRoundButton, 'click', nextRound);
  bind(els.endGameButton, 'click', endGame);

  bind(els.confirmCancel, 'click', closeConfirm);
  bind(els.confirmOk, 'click', () => {
    const cb = state.pendingConfirm;
    closeConfirm();
    cb?.();
  });
  bind(els.confirmModal, 'click', (e) => { if (e.target === els.confirmModal) closeConfirm(); });

  // Klavye kısayolları — moderatör kullanır: Esc modalı kapatır.
  bind(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      if (!els.infoModal.classList.contains('hidden')) closeInfo();
      if (!els.confirmModal.classList.contains('hidden')) closeConfirm();
    }
  });

  showHome();

  cleanup = () => {
    listeners.forEach((fn) => fn());
    listeners.length = 0;
  };
}

export function unmount() {
  cleanup?.();
  cleanup = null;
}
