export function template() {
  return `
    <section class="hero-panel" id="dHomePanel">
      <div class="home-header-row">
        <p class="eyebrow">Kadro Kurma Düellosu</p>
        <button class="icon-button" id="dInfoButton" type="button" aria-label="Bilgilendirme">?</button>
      </div>

      <div class="home-copy-block">
        <h1>Draftinho</h1>
        <p class="hero-copy">İki oyuncu, aynı kritere göre farklı takımlardan 6 kişilik kadro kurar. Toplamı önde olan oyunu kazanır.</p>
      </div>

      <button class="primary-button home-start-button" id="dOpenSetupButton" type="button">
        Oyunu Başlat
      </button>
    </section>

    <section class="mode-panel hidden" id="dCoinFlipPanel">
      <div class="mode-panel-header">
        <div>
          <p class="eyebrow">Oyuncular · Kim Başlıyor?</p>
          <h2>İsim Gir & Yazı-Tura</h2>
        </div>
        <button class="ghost-button" id="dCoinFlipBackButton" type="button">Geri Dön</button>
      </div>

      <div class="setup-form">
        <label class="setup-label">
          <span>1. Oyuncu</span>
          <input class="setup-input" id="dPlayer1Input" type="text" placeholder="Mehmet" maxlength="16" />
        </label>
        <label class="setup-label">
          <span>2. Oyuncu</span>
          <input class="setup-input" id="dPlayer2Input" type="text" placeholder="Beraat" maxlength="16" />
        </label>
      </div>

      <p class="status-strip" id="dCoinFlipStatus">İsimleri gir, sonra Yazı-Tura'ya bas.</p>

      <div class="coin-shell">
        <div class="coin-versus">
          <div class="coin-name-slot" id="dCoinName1">?</div>
          <span class="coin-vs">VS</span>
          <div class="coin-name-slot" id="dCoinName2">?</div>
        </div>
        <div class="coin-result hidden" id="dCoinResult">
          <span class="coin-result-label">İlk seçen:</span>
          <strong id="dCoinResultName">-</strong>
        </div>
      </div>

      <div class="action-column">
        <button class="primary-button hidden" id="dGoCriterionButton" type="button">Kriter Çarkına Geç</button>
        <button class="primary-button" id="dSpinCoinButton" type="button">Yazı-Tura At</button>
      </div>
    </section>

    <section class="mode-panel hidden" id="dCriterionPanel">
      <div class="mode-panel-header">
        <div>
          <p class="eyebrow">1. Adım</p>
          <h2>Kriter Çarkı</h2>
        </div>
        <button class="ghost-button" id="dCriterionBackButton" type="button">Geri Dön</button>
      </div>

      <p class="status-strip" id="dCriterionStatus">Çark hazır. Başlat ve kriterinizi belirleyin.</p>

      <div class="wheel-shell">
        <div class="wheel-display" id="dCriterionDisplay">
          <span class="wheel-eyebrow">Kriter</span>
          <strong class="wheel-title" id="dCriterionTitle">?</strong>
          <span class="wheel-sub" id="dCriterionSub">Çark dönmeye hazır</span>
        </div>
      </div>

      <div class="action-column">
        <button class="primary-button hidden" id="dConfirmCriterionButton" type="button">Oyuna Başla</button>
        <button class="primary-button" id="dSpinCriterionButton" type="button">Kriter Çarkını Çevir</button>
      </div>
    </section>

    <section class="game-panel hidden" id="dGamePanel">
      <header class="game-header">
        <button class="ghost-button" id="dGameBackButton" type="button">Geri Dön</button>
        <div>
          <p class="eyebrow" id="dGameCriterionLabel">Kriter</p>
          <h2 id="dGameTitle">Tur Hazır</h2>
        </div>
        <div class="header-side">
          <div class="round-badge" id="dRoundBadge">Tur 0/6</div>
          <div class="mini-note" id="dTurnHint">Sıra: -</div>
        </div>
      </header>

      <div class="status-strip" id="dGameStatus">Yeni tur için takım çarkını çevir.</div>

      <div class="team-spin-shell hidden" id="dTeamSpinShell">
        <div class="wheel-display">
          <span class="wheel-eyebrow">Bu Turun Takımı</span>
          <strong class="wheel-title" id="dTeamTitle">?</strong>
          <span class="wheel-sub" id="dTeamSub">-</span>
        </div>
      </div>

      <div class="scoreboard">
        <div class="score-card" id="dScoreCard1">
          <span class="score-name" id="dScoreName1">Oyuncu 1</span>
          <strong class="score-value" id="dScoreValue1">0</strong>
          <span class="score-picks" id="dScorePicks1">0/6</span>
        </div>
        <div class="score-card" id="dScoreCard2">
          <span class="score-name" id="dScoreName2">Oyuncu 2</span>
          <strong class="score-value" id="dScoreValue2">0</strong>
          <span class="score-picks" id="dScorePicks2">0/6</span>
        </div>
      </div>

      <div class="formations">
        <div class="formation-column" id="dFormation1"></div>
        <div class="formation-column" id="dFormation2"></div>
      </div>

      <div class="pick-panel hidden" id="dPickPanel">
        <p class="pick-eyebrow" id="dPickEyebrow">Sıra sende</p>
        <p class="pick-title" id="dPickTitle">Pozisyon seç</p>
        <div class="position-buttons" id="dPositionButtons"></div>

        <div class="player-input hidden" id="dPlayerInputWrap">
          <label class="setup-label">
            <span id="dPlayerInputLabel">Oyuncu adını yaz</span>
            <input class="setup-input" id="dPlayerNameInput" type="text" placeholder="Oyuncu ismi" autocomplete="off" />
          </label>
          <div class="suggestions" id="dSuggestions"></div>
          <div class="pick-actions">
            <button class="ghost-button" id="dCancelPickButton" type="button">Pozisyonu Değiştir</button>
            <button class="primary-button" id="dConfirmPickButton" type="button">Onayla</button>
          </div>
        </div>
      </div>

      <div class="action-row" id="dGameActionRow">
        <button class="primary-button" id="dSpinTeamButton" type="button">Takım Çarkını Çevir</button>
      </div>

      <div class="round-result hidden" id="dRoundResult">
        <p class="eyebrow">Sonuç</p>
        <h3 id="dRoundResultTitle">-</h3>
        <p class="round-result-sub" id="dRoundResultSub">-</p>
        <button class="primary-button result-cta hidden" id="dNextRoundButton" type="button">Yeni Oyun</button>
      </div>
    </section>

    <section class="info-modal hidden" id="dInfoModal" aria-hidden="true">
      <div class="info-card">
        <div class="info-header">
          <div>
            <p class="eyebrow">Nasıl Oynanır</p>
            <h2>Draftinho Kuralları</h2>
          </div>
          <button class="icon-button" id="dCloseInfoButton" type="button" aria-label="Kapat">x</button>
        </div>

        <div class="info-list">
          <p>1. İki oyuncunun adı girilir.</p>
          <p>2. Yazı-tura ile ilk seçen oyuncu belirlenir. Turlar arası sıra otomatik değişir.</p>
          <p>3. Kriter çarkı bir kere döner (örneğin En Uzun Kadro) ve oyun boyu aynı kalır.</p>
          <p>4. Her turun başında takım çarkı döner (örneğin Chelsea).</p>
          <p>5. Sıradaki oyuncu bir pozisyon seçip o takımın oyuncularından birini yazar.</p>
          <p>6. Rakip de aynı takımdan bir oyuncu seçer.</p>
          <p>7. 6 tur boyunca 6 farklı takımdan seçim yapılır. Toplamı önde olan oyunu kazanır.</p>
        </div>
      </div>
    </section>
  `;
}
