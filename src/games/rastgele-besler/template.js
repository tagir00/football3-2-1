export function template() {
  return `
    <section class="hero-panel" id="rHomePanel">
      <div class="home-header-row">
        <a class="home-button" href="#/" aria-label="Ana Sayfa" title="Ana Sayfa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 11.5 12 4l9 7.5"/>
            <path d="M5 10.5V20h4.5v-5.5h5V20H19V10.5"/>
          </svg>
        </a>
        <button class="icon-button" id="rInfoButton" type="button" aria-label="Bilgilendirme">?</button>
      </div>

      <div class="home-copy-block">
        <h1>Rastgele Beşler</h1>
        <p class="hero-copy">Her tur 5 rastgele kulüp çıkar. İki oyuncu sırayla bu kulüplerin ortak oyuncularını bulmaya çalışır — yazdığın futbolcu 5 kulüpten kaçında oynadıysa o kadar puan alırsın. 5 tur sonunda en çok puanı toplayan kazanır.</p>
      </div>

      <button class="primary-button home-start-button" id="rStartButton" type="button">
        Oyunu Başlat
      </button>
    </section>

    <section class="setup-panel hidden" id="rSetupPanel">
      <header class="setup-header">
        <div>
          <p class="eyebrow">Oyuncular · Kim Başlıyor?</p>
          <h2>İsim Gir & Yazı-Tura</h2>
        </div>
        <button class="ghost-button" id="rSetupBackButton" type="button">Geri Dön</button>
      </header>

      <div class="setup-form">
        <label class="setup-field">
          <span>1. Oyuncu</span>
          <input class="setup-input" id="rPlayer1Input" type="text" placeholder="Beraat" autocomplete="off" />
        </label>
        <label class="setup-field">
          <span>2. Oyuncu</span>
          <input class="setup-input" id="rPlayer2Input" type="text" placeholder="Mehmet" autocomplete="off" />
        </label>
      </div>

      <div class="setup-status" id="rSetupStatus">İki oyuncunun da adını yaz, sonra yazı-turayı at.</div>

      <div class="coin-flip-row">
        <div class="coin-side" id="rCoinSideA">
          <span class="coin-name">1</span>
        </div>
        <span class="coin-vs">VS</span>
        <div class="coin-side" id="rCoinSideB">
          <span class="coin-name">2</span>
        </div>
      </div>

      <div class="coin-result hidden" id="rCoinResult">
        <p class="eyebrow">İLK SEÇEN:</p>
        <h3 id="rCoinWinnerLabel">-</h3>
      </div>

      <div class="setup-actions">
        <button class="primary-button hidden" id="rGoToGameButton" type="button">Oyuna Başla</button>
        <button class="primary-button" id="rSpinCoinButton" type="button">Yazı-Tura At</button>
      </div>
    </section>

    <section class="game-panel hidden" id="rGamePanel">
      <header class="game-header">
        <p class="eyebrow" id="rRoundEyebrow">TUR 1 / 5</p>
        <button class="ghost-button" id="rGameBackButton" type="button">Geri Dön</button>
      </header>

      <div class="rb-clubs" id="rClubsStrip">
        <div class="rb-club-slot" data-idx="0"><div class="rb-club-inner"><div class="rb-club-logo"></div><div class="rb-club-name">-</div></div></div>
        <div class="rb-club-slot" data-idx="1"><div class="rb-club-inner"><div class="rb-club-logo"></div><div class="rb-club-name">-</div></div></div>
        <div class="rb-club-slot" data-idx="2"><div class="rb-club-inner"><div class="rb-club-logo"></div><div class="rb-club-name">-</div></div></div>
        <div class="rb-club-slot" data-idx="3"><div class="rb-club-inner"><div class="rb-club-logo"></div><div class="rb-club-name">-</div></div></div>
        <div class="rb-club-slot" data-idx="4"><div class="rb-club-inner"><div class="rb-club-logo"></div><div class="rb-club-name">-</div></div></div>
      </div>

      <button class="primary-button rb-spin-button" id="rSpinButton" type="button">Takımları Getir</button>

      <div class="rb-board" id="rBoard">
        <div class="rb-column" data-player="0">
          <div class="rb-col-head" id="rNameA">Oyuncu 1</div>
          <ol class="rb-picks" id="rPicksA">
            <li class="rb-pick empty"></li>
            <li class="rb-pick empty"></li>
            <li class="rb-pick empty"></li>
            <li class="rb-pick empty"></li>
            <li class="rb-pick empty"></li>
          </ol>
        </div>
        <div class="rb-column" data-player="1">
          <div class="rb-col-head" id="rNameB">Oyuncu 2</div>
          <ol class="rb-picks" id="rPicksB">
            <li class="rb-pick empty"></li>
            <li class="rb-pick empty"></li>
            <li class="rb-pick empty"></li>
            <li class="rb-pick empty"></li>
            <li class="rb-pick empty"></li>
          </ol>
        </div>
      </div>

      <div class="rb-scoreboard">
        <div class="rb-score" data-player="0"><span class="rb-score-label" id="rTotalNameA">Oyuncu 1</span><span class="rb-score-value" id="rTotalA">0</span></div>
        <div class="rb-vs">·</div>
        <div class="rb-score" data-player="1"><span class="rb-score-value" id="rTotalB">0</span><span class="rb-score-label" id="rTotalNameB">Oyuncu 2</span></div>
      </div>

      <div class="rb-turn hidden" id="rTurnPanel">
        <p class="eyebrow"><span id="rTurnLabel">-</span> · Sıra Sende</p>
        <div class="rb-input-row">
          <input class="setup-input" id="rGuessInput" type="text" placeholder="Futbolcu ismi" autocomplete="off" />
          <button class="primary-button" id="rGuessButton" type="button">Onayla</button>
        </div>
        <div class="rb-suggestions" id="rSuggestions"></div>
        <div class="rb-status" id="rGameStatus"></div>
      </div>

      <div class="rb-round-done hidden" id="rRoundDone">
        <p class="eyebrow" id="rRoundDoneEyebrow">Tur Bitti</p>
        <p class="rb-round-summary" id="rRoundSummary">-</p>
        <button class="primary-button" id="rNextRoundButton" type="button">Sonraki Tur</button>
      </div>

      <div class="rb-result hidden" id="rResult">
        <p class="eyebrow" id="rResultEyebrow">Sonuç</p>
        <h3 id="rResultTitle">-</h3>
        <p class="rb-result-sub" id="rResultSub">-</p>
        <button class="primary-button" id="rPlayAgainButton" type="button">Yeni Oyun</button>
      </div>
    </section>

    <section class="info-modal hidden" id="rInfoModal" aria-hidden="true">
      <div class="info-card">
        <div class="info-header">
          <div>
            <p class="eyebrow">Nasıl Oynanır</p>
            <h2>Rastgele Beşler Kuralları</h2>
          </div>
          <button class="icon-button" id="rCloseInfoButton" type="button" aria-label="Kapat">x</button>
        </div>
        <div class="info-list">
          <p>1. İki oyuncu adını girer. Yazı-tura ilk seçeni belirler.</p>
          <p>2. "Takımları Getir" butonu her turda 5 rastgele kulüp getirir. Slot slot dönüp durur.</p>
          <p>3. Sıradaki oyuncu bir futbolcu ismi yazar. Yazdığı futbolcu 5 kulüpten kaçında oynadıysa o kadar puan kazanır.</p>
          <p>4. Aynı futbolcu bir oyunda sadece bir kez seçilebilir.</p>
          <p>5. 5 tur sonunda en çok puanı toplayan oyuncu kazanır. Eşitlikte ekstra tur oynanır.</p>
        </div>
      </div>
    </section>
  `;
}
