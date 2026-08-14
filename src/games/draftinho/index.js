import { template } from './template.js';
import { criteria, getFormation, formatValue, formatTotal } from './criteria.js';
import {
  loadClubs,
  loadNationals,
  pickTeamPool,
  findPlayerInTeam,
  suggestPlayers,
  normalizeName,
} from './teams.js';

const STYLE_HREF = new URL('./game.css', import.meta.url).href;

function ensureStylesheet() {
  if (document.querySelector('link[data-game-style="draftinho"]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.gameStyle = 'draftinho';
  document.head.append(link);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

let cleanup = null;

export async function mount(container) {
  ensureStylesheet();
  container.innerHTML = template();

  const [clubs, nationals] = await Promise.all([loadClubs(), loadNationals()]);

  const els = {
    homePanel: container.querySelector('#dHomePanel'),
    coinFlipPanel: container.querySelector('#dCoinFlipPanel'),
    criterionPanel: container.querySelector('#dCriterionPanel'),
    gamePanel: container.querySelector('#dGamePanel'),
    infoModal: container.querySelector('#dInfoModal'),
    infoButton: container.querySelector('#dInfoButton'),
    closeInfoButton: container.querySelector('#dCloseInfoButton'),
    openSetupButton: container.querySelector('#dOpenSetupButton'),
    player1Input: container.querySelector('#dPlayer1Input'),
    player2Input: container.querySelector('#dPlayer2Input'),
    coinFlipBackButton: container.querySelector('#dCoinFlipBackButton'),
    coinFlipStatus: container.querySelector('#dCoinFlipStatus'),
    coinName1: container.querySelector('#dCoinName1'),
    coinName2: container.querySelector('#dCoinName2'),
    coinResult: container.querySelector('#dCoinResult'),
    coinResultName: container.querySelector('#dCoinResultName'),
    spinCoinButton: container.querySelector('#dSpinCoinButton'),
    goCriterionButton: container.querySelector('#dGoCriterionButton'),
    criterionBackButton: container.querySelector('#dCriterionBackButton'),
    criterionTitle: container.querySelector('#dCriterionTitle'),
    criterionSub: container.querySelector('#dCriterionSub'),
    criterionDisplay: container.querySelector('#dCriterionDisplay'),
    criterionStatus: container.querySelector('#dCriterionStatus'),
    spinCriterionButton: container.querySelector('#dSpinCriterionButton'),
    confirmCriterionButton: container.querySelector('#dConfirmCriterionButton'),
    gameBackButton: container.querySelector('#dGameBackButton'),
    gameCriterionLabel: container.querySelector('#dGameCriterionLabel'),
    gameTitle: container.querySelector('#dGameTitle'),
    gameStatus: container.querySelector('#dGameStatus'),
    roundBadge: container.querySelector('#dRoundBadge'),
    turnHint: container.querySelector('#dTurnHint'),
    teamSpinShell: container.querySelector('#dTeamSpinShell'),
    teamTitle: container.querySelector('#dTeamTitle'),
    teamSub: container.querySelector('#dTeamSub'),
    scoreCard1: container.querySelector('#dScoreCard1'),
    scoreCard2: container.querySelector('#dScoreCard2'),
    scoreName1: container.querySelector('#dScoreName1'),
    scoreName2: container.querySelector('#dScoreName2'),
    scoreValue1: container.querySelector('#dScoreValue1'),
    scoreValue2: container.querySelector('#dScoreValue2'),
    scorePicks1: container.querySelector('#dScorePicks1'),
    scorePicks2: container.querySelector('#dScorePicks2'),
    formation1: container.querySelector('#dFormation1'),
    formation2: container.querySelector('#dFormation2'),
    pickPanel: container.querySelector('#dPickPanel'),
    pickEyebrow: container.querySelector('#dPickEyebrow'),
    pickTitle: container.querySelector('#dPickTitle'),
    positionButtons: container.querySelector('#dPositionButtons'),
    playerInputWrap: container.querySelector('#dPlayerInputWrap'),
    playerInputLabel: container.querySelector('#dPlayerInputLabel'),
    playerNameInput: container.querySelector('#dPlayerNameInput'),
    suggestions: container.querySelector('#dSuggestions'),
    cancelPickButton: container.querySelector('#dCancelPickButton'),
    confirmPickButton: container.querySelector('#dConfirmPickButton'),
    spinTeamButton: container.querySelector('#dSpinTeamButton'),
    nextRoundButton: container.querySelector('#dNextRoundButton'),
    roundResult: container.querySelector('#dRoundResult'),
    roundResultTitle: container.querySelector('#dRoundResultTitle'),
    roundResultSub: container.querySelector('#dRoundResultSub'),
  };

  const state = {
    players: [
      { name: 'Oyuncu 1', total: 0, slots: [], picks: 0 },
      { name: 'Oyuncu 2', total: 0, slots: [], picks: 0 },
    ],
    criterion: null,
    currentTeam: null,
    round: 0,
    totalRounds: 6,
    picksThisSpin: 0,
    activePlayerIndex: 0,
    startingPlayerIndex: 0,
    coinStartingIndex: 0,
    pendingSlot: null,
    isSpinning: false,
    isFinished: false,
    usedInSpin: new Set(),
    usedTeamIds: new Set(),
  };

  const boundListeners = [];
  function bind(el, type, handler, options) {
    el.addEventListener(type, handler, options);
    boundListeners.push(() => el.removeEventListener(type, handler, options));
  }

  const timers = new Set();
  function later(fn, delay) {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, delay);
    timers.add(id);
    return id;
  }

  function showHome() {
    els.homePanel.classList.remove('hidden');
    els.coinFlipPanel.classList.add('hidden');
    els.criterionPanel.classList.add('hidden');
    els.gamePanel.classList.add('hidden');
  }

  function showCoinFlipPanel() {
    els.homePanel.classList.add('hidden');
    els.coinFlipPanel.classList.remove('hidden');
    els.criterionPanel.classList.add('hidden');
    els.gamePanel.classList.add('hidden');
    // Prefill previously entered names on repeat visits
    if (state.players[0].name && state.players[0].name !== 'Oyuncu 1') {
      els.player1Input.value = state.players[0].name;
    }
    if (state.players[1].name && state.players[1].name !== 'Oyuncu 2') {
      els.player2Input.value = state.players[1].name;
    }
    updateCoinNamesFromInputs();
    els.coinName1.classList.remove('highlight', 'dim');
    els.coinName2.classList.remove('highlight', 'dim');
    els.coinResult.classList.add('hidden');
    els.goCriterionButton.classList.add('hidden');
    els.spinCoinButton.classList.remove('hidden');
    els.spinCoinButton.classList.remove('secondary');
    els.spinCoinButton.textContent = 'Yazı-Tura At';
    els.spinCoinButton.disabled = false;
    els.coinFlipStatus.textContent = "İsimleri gir, sonra Yazı-Tura'ya bas.";
    els.player1Input.focus();
  }

  function updateCoinNamesFromInputs() {
    const p1 = els.player1Input.value.trim() || els.player1Input.placeholder || 'Oyuncu 1';
    const p2 = els.player2Input.value.trim() || els.player2Input.placeholder || 'Oyuncu 2';
    els.coinName1.textContent = p1;
    els.coinName2.textContent = p2;
  }

  function showCriterionPanel() {
    els.homePanel.classList.add('hidden');
    els.coinFlipPanel.classList.add('hidden');
    els.criterionPanel.classList.remove('hidden');
    els.gamePanel.classList.add('hidden');
    resetCriterionScreen();
  }

  function resetCriterionScreen() {
    state.criterion = null;
    els.criterionTitle.textContent = '?';
    els.criterionSub.textContent = 'Çark dönmeye hazır';
    els.criterionStatus.textContent = 'Çark hazır. Başlat ve kriterinizi belirleyin.';
    els.confirmCriterionButton.classList.add('hidden');
    els.spinCriterionButton.textContent = 'Kriter Çarkını Çevir';
    els.spinCriterionButton.classList.remove('secondary');
    els.spinCriterionButton.disabled = false;
  }

  function showGamePanel() {
    els.homePanel.classList.add('hidden');
    els.coinFlipPanel.classList.add('hidden');
    els.criterionPanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');
  }

  function flipCoin() {
    if (state.isSpinning) return;
    // Commit current input values to state before spinning
    initPlayers();
    updateCoinNamesFromInputs();
    state.isSpinning = true;
    els.spinCoinButton.disabled = true;
    els.coinResult.classList.add('hidden');
    els.coinFlipStatus.textContent = 'Yazı-tura dönüyor...';

    const finalIndex = Math.random() < 0.5 ? 0 : 1;
    let ticks = 0;
    const maxTicks = 14 + Math.floor(Math.random() * 6);
    const interval = window.setInterval(() => {
      const cur = ticks % 2;
      els.coinName1.classList.toggle('highlight', cur === 0);
      els.coinName2.classList.toggle('highlight', cur === 1);
      els.coinName1.classList.toggle('dim', cur !== 0);
      els.coinName2.classList.toggle('dim', cur !== 1);
      ticks += 1;
      if (ticks >= maxTicks) {
        window.clearInterval(interval);
        els.coinName1.classList.toggle('highlight', finalIndex === 0);
        els.coinName2.classList.toggle('highlight', finalIndex === 1);
        els.coinName1.classList.toggle('dim', finalIndex !== 0);
        els.coinName2.classList.toggle('dim', finalIndex !== 1);
        state.coinStartingIndex = finalIndex;
        els.coinResult.classList.remove('hidden');
        els.coinResultName.textContent = state.players[finalIndex].name;
        els.coinFlipStatus.textContent = 'Sonuç geldi. Oyun boyunca ilk seçen bu oyuncu olur (turlar arası sıra değişir).';
        els.goCriterionButton.classList.remove('hidden');
        els.spinCoinButton.textContent = 'Tekrar At';
        els.spinCoinButton.classList.add('secondary');
        els.spinCoinButton.disabled = false;
        state.isSpinning = false;
      }
    }, 90);
    timers.add(interval);
  }

  function toggleInfoModal(open) {
    const shouldOpen = typeof open === 'boolean' ? open : els.infoModal.classList.contains('hidden');
    els.infoModal.classList.toggle('hidden', !shouldOpen);
    els.infoModal.setAttribute('aria-hidden', String(!shouldOpen));
  }

  function initPlayers() {
    const p1 = els.player1Input.value.trim() || els.player1Input.placeholder || 'Oyuncu 1';
    const p2 = els.player2Input.value.trim() || els.player2Input.placeholder || 'Oyuncu 2';
    state.players[0].name = p1;
    state.players[1].name = p2;
    els.scoreName1.textContent = p1;
    els.scoreName2.textContent = p2;
  }

  function resetPlayersForCriterion() {
    const formation = getFormation(state.criterion);
    state.players.forEach((player) => {
      player.total = 0;
      player.picks = 0;
      player.slots = formation.map((slot) => ({ ...slot, filled: null, value: 0 }));
    });
    state.round = 0;
    state.totalRounds = formation.length;
    state.picksThisSpin = 0;
    state.startingPlayerIndex = state.coinStartingIndex;
    state.activePlayerIndex = state.coinStartingIndex;
    state.currentTeam = null;
    state.pendingSlot = null;
    state.usedInSpin.clear();
    state.usedTeamIds.clear();
    state.isFinished = false;
    updateScoreboard();
    renderFormations();
  }

  function spinCriterion() {
    if (state.isSpinning) return;
    state.isSpinning = true;
    els.spinCriterionButton.disabled = true;
    els.criterionStatus.textContent = 'Çark dönüyor...';
    els.confirmCriterionButton.classList.add('hidden');

    const finalCriterion = pick(criteria);
    let ticks = 0;
    const maxTicks = 18 + Math.floor(Math.random() * 6);
    const interval = window.setInterval(() => {
      const tempCrit = criteria[ticks % criteria.length];
      els.criterionTitle.textContent = tempCrit.title;
      els.criterionSub.textContent = tempCrit.subtitle;
      els.criterionDisplay.classList.add('spinning');
      ticks += 1;
      if (ticks >= maxTicks) {
        window.clearInterval(interval);
        els.criterionTitle.textContent = finalCriterion.title;
        els.criterionSub.textContent = finalCriterion.subtitle;
        els.criterionDisplay.classList.remove('spinning');
        els.criterionDisplay.classList.add('landed');
        state.criterion = finalCriterion;
        state.isSpinning = false;
        els.spinCriterionButton.textContent = 'Tekrar Çevir';
        els.spinCriterionButton.classList.add('secondary');
        els.spinCriterionButton.disabled = false;
        els.confirmCriterionButton.classList.remove('hidden');
        els.criterionStatus.textContent = 'Kriter belirlendi. Oyuna başla ya da tekrar çevir.';
        later(() => els.criterionDisplay.classList.remove('landed'), 620);
      }
    }, 90);
    timers.add(interval);
  }

  function confirmCriterion() {
    if (!state.criterion) return;
    initPlayers();
    resetPlayersForCriterion();
    els.gameCriterionLabel.textContent = state.criterion.title;
    els.gameTitle.textContent = 'Yeni Tur';
    els.roundBadge.textContent = `Tur 0/${state.totalRounds}`;
    els.gameStatus.textContent = 'Takım çarkını çevir ve tur başlasın.';
    els.spinTeamButton.classList.remove('hidden');
    els.spinTeamButton.textContent = 'Takım Çarkını Çevir';
    els.nextRoundButton.classList.add('hidden');
    els.pickPanel.classList.add('hidden');
    els.roundResult.classList.add('hidden');
    els.teamSpinShell.classList.add('hidden');
    els.turnHint.textContent = 'Önce takım çarkı';
    showGamePanel();
  }

  function updateScoreboard() {
    els.scoreValue1.textContent = formatTotal(state.players[0].total, state.criterion ?? { format: null });
    els.scoreValue2.textContent = formatTotal(state.players[1].total, state.criterion ?? { format: null });
    const cap = state.players[0].slots.length || 6;
    els.scorePicks1.textContent = `${state.players[0].picks}/${cap}`;
    els.scorePicks2.textContent = `${state.players[1].picks}/${cap}`;
    els.scoreCard1.classList.toggle('active', state.activePlayerIndex === 0 && !state.isFinished);
    els.scoreCard2.classList.toggle('active', state.activePlayerIndex === 1 && !state.isFinished);
  }

  function renderFormations() {
    state.players.forEach((player, index) => {
      const column = index === 0 ? els.formation1 : els.formation2;
      const slotsHtml = player.slots
        .map((slot) => {
          if (slot.filled) {
            return `
              <div class="slot filled" data-slot="${slot.id}">
                <span class="slot-pos">${slot.label}</span>
                <span class="slot-name">${slot.filled.name}</span>
                <span class="slot-value">${formatValue(slot.value, state.criterion)}</span>
              </div>
            `;
          }
          return `
            <div class="slot empty" data-slot="${slot.id}">
              <span class="slot-pos">${slot.label}</span>
              <span class="slot-name">-</span>
            </div>
          `;
        })
        .join('');
      column.innerHTML = `
        <div class="formation-name">${player.name}</div>
        <div class="slot-grid">${slotsHtml}</div>
      `;
    });
  }

  function spinTeam() {
    if (state.isSpinning) return;
    if (state.round >= state.totalRounds) return;
    state.isSpinning = true;
    els.spinTeamButton.disabled = true;
    els.teamSpinShell.classList.remove('hidden');
    els.roundResult.classList.add('hidden');
    els.gameStatus.textContent = 'Takım çarkı dönüyor...';

    // Choose the team pool based on the active criterion
    const teamPool = pickTeamPool(clubs, nationals, state.criterion);

    // Pick a team not used yet in this game (each team appears once)
    const available = teamPool.filter((t) => !state.usedTeamIds.has(t.id));
    const pool = available.length > 0 ? available : teamPool;
    const finalTeam = pick(pool);

    let ticks = 0;
    const maxTicks = 16 + Math.floor(Math.random() * 6);
    const interval = window.setInterval(() => {
      const tempTeam = teamPool[ticks % teamPool.length];
      els.teamTitle.textContent = tempTeam.displayName;
      els.teamSub.textContent = `Kriter: ${state.criterion.title}`;
      els.teamSpinShell.classList.add('spinning');
      ticks += 1;
      if (ticks >= maxTicks) {
        window.clearInterval(interval);
        els.teamTitle.textContent = finalTeam.displayName;
        els.teamSub.textContent = `Kriter: ${state.criterion.title}`;
        els.teamSpinShell.classList.remove('spinning');
        els.teamSpinShell.classList.add('landed');
        state.currentTeam = finalTeam;
        state.usedTeamIds.add(finalTeam.id);
        state.isSpinning = false;
        els.spinTeamButton.classList.add('hidden');
        els.spinTeamButton.disabled = false;
        beginRound();
        later(() => els.teamSpinShell.classList.remove('landed'), 620);
      }
    }, 85);
    timers.add(interval);
  }

  function beginRound() {
    state.round += 1;
    state.picksThisSpin = 0;
    state.usedInSpin.clear();
    state.activePlayerIndex = state.startingPlayerIndex;
    els.roundBadge.textContent = `Tur ${state.round}/${state.totalRounds}`;
    els.gameTitle.textContent = `${state.currentTeam.displayName} · ${state.criterion.title}`;
    els.gameStatus.textContent = 'İki oyuncu sıra ile bu takımdan birer oyuncu seçer.';
    updateScoreboard();
    renderFormations();
    openPickPanel();
  }

  function availablePositions(player) {
    const remaining = new Map();
    player.slots
      .filter((slot) => !slot.filled)
      .forEach((slot) => {
        remaining.set(slot.position, (remaining.get(slot.position) ?? 0) + 1);
      });
    return remaining;
  }

  function openPickPanel() {
    const player = state.players[state.activePlayerIndex];
    if (player.picks >= player.slots.length) {
      advanceTurn();
      return;
    }
    els.pickPanel.classList.remove('hidden');
    els.pickEyebrow.textContent = `Sıra: ${player.name}`;
    els.pickTitle.textContent = 'Pozisyon seç';
    els.playerInputWrap.classList.add('hidden');
    els.playerNameInput.value = '';
    els.suggestions.innerHTML = '';
    els.turnHint.textContent = `Sıra: ${player.name}`;

    const remaining = availablePositions(player);
    const positionMeta = [
      { position: 'GK', label: 'Kaleci' },
      { position: 'DEF', label: 'Defans' },
      { position: 'MID', label: 'Orta Saha' },
      { position: 'FW', label: 'Forvet' },
    ];

    els.positionButtons.innerHTML = positionMeta
      .filter((meta) => remaining.get(meta.position))
      .map(
        (meta) => `
          <button class="position-button" data-position="${meta.position}" type="button">
            <strong>${meta.label}</strong>
            <span>${remaining.get(meta.position)} boş</span>
          </button>
        `,
      )
      .join('');

    els.positionButtons.querySelectorAll('[data-position]').forEach((button) => {
      bind(button, 'click', () => onPositionSelected(button.dataset.position));
    });
    updateScoreboard();
  }

  function onPositionSelected(position) {
    const player = state.players[state.activePlayerIndex];
    const slot = player.slots.find((s) => !s.filled && s.position === position);
    if (!slot) return;
    state.pendingSlot = slot;
    els.pickTitle.textContent = `${slot.label} için oyuncu yaz`;
    els.playerInputLabel.textContent = `${state.currentTeam.displayName} · ${slot.label}`;
    els.playerInputWrap.classList.remove('hidden');
    els.playerNameInput.focus();
    renderSuggestions('');
  }

  function renderSuggestions(query) {
    if (!state.pendingSlot) {
      els.suggestions.innerHTML = '';
      return;
    }
    const list = suggestPlayers(state.currentTeam, state.pendingSlot.position, query, 6).filter(
      (player) => !isPlayerUsed(player),
    );
    if (list.length === 0) {
      els.suggestions.innerHTML = `<p class="suggestion-empty">Uygun oyuncu bulunamadı.</p>`;
      return;
    }
    els.suggestions.innerHTML = list
      .map(
        (player) => `
          <button class="suggestion" data-name="${player.name}" type="button">
            <span>${player.name}</span>
          </button>
        `,
      )
      .join('');
    els.suggestions.querySelectorAll('[data-name]').forEach((button) => {
      bind(button, 'click', () => {
        els.playerNameInput.value = button.dataset.name;
        confirmPick();
      });
    });
  }

  function isPlayerUsed(player) {
    if (!state.currentTeam) return false;
    return state.usedInSpin.has(normalizeName(player.name));
  }

  function confirmPick() {
    if (!state.pendingSlot) return;
    const query = els.playerNameInput.value.trim();
    if (!query) {
      els.gameStatus.textContent = 'Oyuncu adı boş olamaz.';
      return;
    }
    const player = findPlayerInTeam(state.currentTeam, state.pendingSlot.position, query);
    if (!player) {
      els.gameStatus.textContent = `${state.currentTeam.displayName} için bu pozisyonda "${query}" adlı oyuncu bulunamadı.`;
      return;
    }
    if (isPlayerUsed(player)) {
      els.gameStatus.textContent = `${player.name} bu turda zaten seçildi. Başka bir oyuncu seç.`;
      return;
    }
    const value = Number(player[state.criterion.field] ?? 0);
    state.pendingSlot.filled = player;
    state.pendingSlot.value = value;
    state.usedInSpin.add(normalizeName(player.name));
    const activePlayer = state.players[state.activePlayerIndex];
    activePlayer.total += value;
    activePlayer.picks += 1;
    state.pendingSlot = null;
    state.picksThisSpin += 1;
    els.playerNameInput.value = '';
    els.gameStatus.textContent = `${activePlayer.name}: ${player.name} eklendi (${formatValue(value, state.criterion)}).`;
    updateScoreboard();
    renderFormations();
    advanceTurn();
  }

  function advanceTurn() {
    // Both picked in this spin — round complete
    if (state.picksThisSpin >= 2) {
      state.startingPlayerIndex = state.startingPlayerIndex === 0 ? 1 : 0;
      state.pendingSlot = null;
      els.pickPanel.classList.add('hidden');
      if (state.round >= state.totalRounds) {
        finishGame();
        return;
      }
      // Show spin button for next round
      els.spinTeamButton.classList.remove('hidden');
      els.spinTeamButton.textContent = `Tur ${state.round + 1}: Takım Çarkını Çevir`;
      els.gameStatus.textContent = `Tur ${state.round}/${state.totalRounds} tamam. Yeni takım için çarkı çevir.`;
      els.turnHint.textContent = `Sonraki turda ilk: ${state.players[state.startingPlayerIndex].name}`;
      return;
    }
    // Switch to the other player for their pick in the same spin
    state.activePlayerIndex = state.activePlayerIndex === 0 ? 1 : 0;
    openPickPanel();
  }

  function finishGame() {
    state.isFinished = true;
    els.pickPanel.classList.add('hidden');
    els.spinTeamButton.classList.add('hidden');
    updateScoreboard();
    const [p1, p2] = state.players;
    let resultTitle;
    let resultSub;
    if (p1.total === p2.total) {
      resultTitle = 'Berabere';
      resultSub = `İki oyuncu da ${formatTotal(p1.total, state.criterion)} topladı.`;
    } else {
      const higher = state.criterion.higherIsBetter !== false;
      const winner = higher ? (p1.total > p2.total ? p1 : p2) : (p1.total < p2.total ? p1 : p2);
      resultTitle = `${winner.name} kazandı`;
      resultSub = `${p1.name}: ${formatTotal(p1.total, state.criterion)} · ${p2.name}: ${formatTotal(p2.total, state.criterion)}`;
    }
    els.roundResult.classList.remove('hidden');
    els.roundResultTitle.textContent = resultTitle;
    els.roundResultSub.textContent = resultSub;
    els.nextRoundButton.classList.remove('hidden');
    els.nextRoundButton.textContent = 'Yeni Oyun';
    els.gameStatus.textContent = 'Oyun bitti. Yeni oyun için butona bas.';
    els.turnHint.textContent = 'Oyun bitti';
  }

  function newGame() {
    els.nextRoundButton.classList.add('hidden');
    els.roundResult.classList.add('hidden');
    els.teamSpinShell.classList.add('hidden');
    els.spinTeamButton.classList.remove('hidden');
    els.spinTeamButton.textContent = 'Takım Çarkını Çevir';
    resetPlayersForCriterion();
    els.roundBadge.textContent = `Tur 0/${state.totalRounds}`;
    els.gameTitle.textContent = 'Yeni Tur';
    els.gameStatus.textContent = 'Takım çarkını çevir ve tur başlasın.';
    els.turnHint.textContent = 'Önce takım çarkı';
  }

  function goBackFromGame() {
    resetCriterionScreen();
    showCriterionPanel();
  }

  function cancelPick() {
    state.pendingSlot = null;
    els.playerInputWrap.classList.add('hidden');
    els.playerNameInput.value = '';
    els.pickTitle.textContent = 'Pozisyon seç';
    els.gameStatus.textContent = 'Pozisyon seçmeye devam et.';
  }

  bind(els.openSetupButton, 'click', () => {
    // Reset coin state so user must flip again for a new game
    state.coinStartingIndex = 0;
    showCoinFlipPanel();
  });
  bind(els.coinFlipBackButton, 'click', showHome);
  bind(els.spinCoinButton, 'click', flipCoin);
  bind(els.player1Input, 'input', updateCoinNamesFromInputs);
  bind(els.player2Input, 'input', updateCoinNamesFromInputs);
  bind(els.goCriterionButton, 'click', () => {
    showCriterionPanel();
  });
  bind(els.criterionBackButton, 'click', showCoinFlipPanel);
  bind(els.spinCriterionButton, 'click', spinCriterion);
  bind(els.confirmCriterionButton, 'click', confirmCriterion);
  bind(els.gameBackButton, 'click', goBackFromGame);
  bind(els.spinTeamButton, 'click', spinTeam);
  bind(els.nextRoundButton, 'click', () => {
    // Reset coin state so player order can be re-rolled
    state.coinStartingIndex = 0;
    showCoinFlipPanel();
  });
  bind(els.confirmPickButton, 'click', confirmPick);
  bind(els.cancelPickButton, 'click', cancelPick);
  bind(els.playerNameInput, 'input', (event) => {
    renderSuggestions(event.target.value);
  });
  bind(els.playerNameInput, 'keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmPick();
    }
  });
  bind(els.infoButton, 'click', () => toggleInfoModal(true));
  bind(els.closeInfoButton, 'click', () => toggleInfoModal(false));
  bind(els.infoModal, 'click', (event) => {
    if (event.target === els.infoModal) {
      toggleInfoModal(false);
    }
  });

  showHome();

  cleanup = () => {
    boundListeners.forEach((off) => off());
    boundListeners.length = 0;
    timers.forEach((id) => window.clearTimeout(id) || window.clearInterval(id));
    timers.clear();
  };
}

export function unmount() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}
