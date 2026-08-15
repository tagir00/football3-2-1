export function template() {
  return `
    <section class="hero-panel" id="wHomePanel">
      <div class="home-header-row">
        <a class="home-button" href="#/" aria-label="Ana Sayfa" title="Ana Sayfa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 11.5 12 4l9 7.5"/>
            <path d="M5 10.5V20h4.5v-5.5h5V20H19V10.5"/>
          </svg>
        </a>
        <button class="icon-button" id="wInfoButton" type="button" aria-label="Bilgilendirme">?</button>
      </div>

      <div class="home-copy-block">
        <h1>Ben Kimim?</h1>
        <p class="hero-copy">Gizli oyuncuyu 8 tahminde bul. Her tahminde milliyet, lig, takım, mevki, yaş ve forma numarası ipuçları gelir.</p>
      </div>

      <button class="primary-button home-start-button" id="wStartButton" type="button">
        Oyunu Başlat
      </button>
    </section>

    <section class="game-panel hidden" id="wGamePanel">
      <header class="game-header">
        <button class="ghost-button" id="wBackButton" type="button">Geri Dön</button>
        <div>
          <p class="eyebrow">Gizli Oyuncu</p>
          <h2 id="wTitle">?</h2>
        </div>
        <div class="header-side">
          <div class="round-badge" id="wGuessBadge">0 / 8</div>
        </div>
      </header>

      <div class="status-strip" id="wStatus"></div>

      <div class="wy-input-row">
        <input class="setup-input" id="wGuessInput" type="text" placeholder="Oyuncu ismi" autocomplete="off" />
        <button class="primary-button" id="wGuessButton" type="button">Tahmin Et</button>
      </div>
      <div class="suggestions" id="wSuggestions"></div>

      <div class="wy-grid-head">
        <span>Oyuncu</span>
        <span>Milliyet</span>
        <span>Lig</span>
        <span>Takım</span>
        <span>Mevki</span>
        <span>Yaş</span>
        <span>Forma</span>
      </div>
      <div class="wy-guess-list" id="wGuessList"></div>

      <div class="round-result hidden" id="wResult">
        <p class="eyebrow" id="wResultEyebrow">Sonuç</p>
        <h3 id="wResultTitle">-</h3>
        <p class="round-result-sub" id="wResultSub">-</p>
        <button class="primary-button result-cta" id="wPlayAgainButton" type="button">Yeni Oyun</button>
      </div>
    </section>

    <section class="info-modal hidden" id="wInfoModal" aria-hidden="true">
      <div class="info-card">
        <div class="info-header">
          <div>
            <p class="eyebrow">Nasıl Oynanır</p>
            <h2>Ben Kimim? Kuralları</h2>
          </div>
          <button class="icon-button" id="wCloseInfoButton" type="button" aria-label="Kapat">x</button>
        </div>

        <div class="info-list">
          <p>1. Sistem gizli bir oyuncu seçer (Big 5 lig + Süper Lig, tanınmış oyuncular).</p>
          <p>2. Oyuncu ismi yazıp 8 tahmin hakkınla gizli oyuncuyu bulmaya çalış.</p>
          <p>3. Her tahminden sonra 6 kategori için ipucu gelir: yeşil = aynı, kırmızı = farklı.</p>
          <p>4. Yaş ve forma numarasında ok işareti çıkar: ↑ hedef daha büyük, ↓ hedef daha küçük.</p>
          <p>5. 8 tahminde bulursan kazanırsın; bulamazsan gizli oyuncu açıklanır.</p>
        </div>
      </div>
    </section>
  `;
}
