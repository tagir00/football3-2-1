export function template() {
  return `
    <section class="hero-panel" id="homePanel">
      <div class="home-header-row">
        <p class="eyebrow">Mobil Futbol Partisi</p>
        <button class="icon-button" id="infoButton" type="button" aria-label="Bilgilendirme">
          ?
        </button>
      </div>

      <div class="home-copy-block">
        <h1>Futbol 3-2-1</h1>
        <p class="hero-copy">Hos geldiniz. Hazirsan oyunu baslat ve modu sec.</p>
      </div>

      <button class="primary-button home-start-button" id="openModesButton" type="button">
        Oyunu Baslat
      </button>
    </section>

    <section class="mode-panel hidden" id="modePanel">
      <div class="mode-panel-header">
        <div>
          <p class="eyebrow">Mod Secimi</p>
          <h2>Hangi modda oynayacaksiniz?</h2>
        </div>
        <button class="ghost-button" id="modeBackButton" type="button">Geri Don</button>
      </div>

      <div class="mode-grid" id="modeGrid"></div>
    </section>

    <section class="game-panel hidden" id="gamePanel">
      <header class="game-header">
        <button class="ghost-button" id="backButton" type="button">Modlara Don</button>
        <div>
          <p class="eyebrow" id="modeLabel"></p>
          <h2 id="roundTitle">Yeni Tur</h2>
        </div>
        <div class="header-side">
          <div class="round-badge" id="roundBadge">Tur 0</div>
          <div class="mini-note" id="orientationHint">Sayac hazir</div>
        </div>
      </header>

      <div class="status-strip" id="statusStrip">
        Baslat'a bas, 3-2-1 sayaci baslasin.
      </div>

      <section class="board" id="board">
        <div class="countdown-layer hidden" id="countdownLayer" aria-live="polite">
          <div class="countdown-ring"></div>
          <div class="countdown-value" id="countdownValue">3</div>
        </div>

        <article class="slot-card slot-left" id="leftCard">
          <div class="slot-placeholder">
            <span class="placeholder-icon">3</span>
            <p>Baslat'a bas ve ilk eslesmeyi getir.</p>
          </div>
        </article>

        <article class="slot-card slot-right" id="rightCard">
          <div class="slot-placeholder">
            <span class="placeholder-icon">2</span>
            <p>Burada ikinci takim ya da ulke gorunecek.</p>
          </div>
        </article>
      </section>

      <div class="action-row">
        <button class="primary-button" id="startButton" type="button">Baslat</button>
        <button class="danger-button hidden" id="retryButton" type="button">
          Oyuncu Bulamadik
        </button>
      </div>
    </section>

    <section class="info-modal hidden" id="infoModal" aria-hidden="true">
      <div class="info-card">
        <div class="info-header">
          <div>
            <p class="eyebrow">Bilgilendirme</p>
            <h2>Oyun Kurallari</h2>
          </div>
          <button class="icon-button" id="closeInfoButton" type="button" aria-label="Kapat">
            x
          </button>
        </div>

        <div class="info-list">
          <p>1. Oyuncular ekrandaki ulke veya kulup eslesmesine gore ortak oyuncu ismi soyler.</p>
          <p>2. Uygulama sadece 3-2-1 sayaci ve random eslesme getirir.</p>
          <p>3. Puan takibini oyuncular kendileri yapar.</p>
          <p>4. Ulke-Kulup modunda Oyuncu Bulamadik ayni sag-sol duzenini korur.</p>
          <p>5. Baslat yeni turu acarken ulke-kulup modunda taraflari degistirir.</p>
        </div>
      </div>
    </section>
  `;
}
