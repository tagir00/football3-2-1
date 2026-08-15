export function template() {
  return `
    <section class="hero-panel" id="homePanel">
      <div class="home-header-row">
        <a class="home-button" href="#/" aria-label="Ana Sayfa" title="Ana Sayfa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 11.5 12 4l9 7.5"/>
            <path d="M5 10.5V20h4.5v-5.5h5V20H19V10.5"/>
          </svg>
        </a>
        <button class="icon-button" id="infoButton" type="button" aria-label="Bilgilendirme">
          ?
        </button>
      </div>

      <div class="home-copy-block">
        <h1>3-2-1 GO!</h1>
        <p class="hero-copy">Hoş geldiniz. Hazırsan oyunu başlat ve modu seç.</p>
      </div>

      <button class="primary-button home-start-button" id="openModesButton" type="button">
        Oyunu Başlat
      </button>
    </section>

    <section class="mode-panel hidden" id="modePanel">
      <div class="mode-panel-header">
        <div>
          <p class="eyebrow">Mod Seçimi</p>
          <h2>Hangi modda oynayacaksınız?</h2>
        </div>
        <button class="ghost-button" id="modeBackButton" type="button">Geri Dön</button>
      </div>

      <div class="mode-grid" id="modeGrid"></div>
    </section>

    <section class="game-panel hidden" id="gamePanel">
      <header class="game-header">
        <button class="ghost-button" id="backButton" type="button">Modlara Dön</button>
        <div>
          <p class="eyebrow" id="modeLabel"></p>
          <h2 id="roundTitle">Yeni Tur</h2>
        </div>
        <div class="header-side">
          <div class="round-badge" id="roundBadge">Tur 0</div>
        </div>
      </header>

      <div class="status-strip" id="statusStrip"></div>

      <section class="board" id="board">
        <div class="countdown-layer hidden" id="countdownLayer" aria-live="polite">
          <div class="countdown-ring"></div>
          <div class="countdown-value" id="countdownValue">3</div>
        </div>

        <article class="slot-card slot-left" id="leftCard">
          <div class="slot-placeholder">
            <span class="placeholder-icon">3</span>
            <p>Başlat'a bas ve ilk eşleşmeyi getir.</p>
          </div>
        </article>

        <article class="slot-card slot-right" id="rightCard">
          <div class="slot-placeholder">
            <span class="placeholder-icon">2</span>
            <p>Burada ikinci takım ya da ülke görünecek.</p>
          </div>
        </article>
      </section>

      <div class="action-row">
        <button class="primary-button" id="startButton" type="button">Başlat</button>
        <button class="danger-button hidden" id="retryButton" type="button">
          Oyuncu Bulamadık
        </button>
      </div>
    </section>

    <section class="info-modal hidden" id="infoModal" aria-hidden="true">
      <div class="info-card">
        <div class="info-header">
          <div>
            <p class="eyebrow">Bilgilendirme</p>
            <h2>Oyun Kuralları</h2>
          </div>
          <button class="icon-button" id="closeInfoButton" type="button" aria-label="Kapat">
            x
          </button>
        </div>

        <div class="info-list">
          <p>1. Oyuncular ekrandaki ülke veya kulüp eşleşmesine göre ortak oyuncu ismi söyler.</p>
          <p>2. Uygulama sadece 3-2-1 sayacı ve random eşleşme getirir.</p>
          <p>3. Puan takibini oyuncular kendileri yapar.</p>
          <p>4. Ülke-Kulüp modunda Oyuncu Bulamadık aynı sağ-sol düzenini korur.</p>
          <p>5. Başlat yeni turu açarken ülke-kulüp modunda tarafları değiştirir.</p>
        </div>
      </div>
    </section>
  `;
}
