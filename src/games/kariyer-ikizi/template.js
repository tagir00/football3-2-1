const HOME_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5"/>
    <path d="M5 10.5V20h4.5v-5.5h5V20H19V10.5"/>
  </svg>
`;

export function template() {
  return `
    <section class="hero-panel ki-hero" id="kiHomePanel">
      <div class="home-header-row">
        <a class="home-button" href="#/" aria-label="Ana Sayfa" title="Ana Sayfa">${HOME_ICON}</a>
        <button class="icon-button" id="kiInfoButton" type="button" aria-label="Nasıl Oynanır?">?</button>
      </div>

      <div class="home-copy-block ki-copy">
        <p class="eyebrow">2 Oyunculu · Bilgi Oyunu</p>
        <h1>Kariyer İkizi</h1>
        <p class="hero-copy">Bir futbolcu gelir, istatistikleri gizlidir. Her kriter için ona en yakın sayıya sahip futbolcuyu söyle; yakın olan puanı alır.</p>
      </div>

      <button class="primary-button home-start-button" id="kiStartButton" type="button">Oyuna Başla</button>
    </section>

    <section class="ki-mode-panel hidden" id="kiCoinPanel">
      <div class="ki-mode-header">
        <div>
          <p class="eyebrow">Oyuncular · Kim Başlıyor?</p>
          <h2>İsim Gir & Yazı-Tura</h2>
        </div>
        <button class="ghost-button" id="kiCoinBackButton" type="button">Geri Dön</button>
      </div>

      <div class="ki-setup-form">
        <label class="ki-setup-label">
          <span>1. Oyuncu</span>
          <input class="ki-setup-input" id="kiPlayer1Input" type="text" placeholder="Enes" maxlength="16" autocomplete="off" />
        </label>
        <label class="ki-setup-label">
          <span>2. Oyuncu</span>
          <input class="ki-setup-input" id="kiPlayer2Input" type="text" placeholder="Bilal" maxlength="16" autocomplete="off" />
        </label>
      </div>

      <p class="ki-status-strip" id="kiCoinStatus">İsimleri gir, sonra Yazı-Tura'ya bas.</p>

      <div class="ki-coin-shell">
        <div class="ki-coin-versus">
          <div class="ki-coin-slot" id="kiCoinName1">?</div>
          <span class="ki-coin-vs">VS</span>
          <div class="ki-coin-slot" id="kiCoinName2">?</div>
        </div>
        <div class="ki-coin-result hidden" id="kiCoinResult">
          <span class="ki-coin-result-label">İlk seçen:</span>
          <strong id="kiCoinWinnerName">-</strong>
        </div>
      </div>

      <div class="ki-action-column">
        <button class="primary-button hidden" id="kiGoToGameButton" type="button">Futbolcuyu Getir</button>
        <button class="primary-button" id="kiSpinCoinButton" type="button">Yazı-Tura At</button>
      </div>
    </section>

    <section class="ki-game hidden" id="kiGamePanel">
      <header class="ki-topbar">
        <a class="home-button" href="#/" aria-label="Ana Sayfa" title="Ana Sayfa">${HOME_ICON}</a>
        <div class="ki-score" aria-label="Skor">
          <div class="ki-score-cell" id="kiScoreCellA">
            <span class="ki-score-name" id="kiScoreNameA">Oyuncu 1</span>
            <span class="ki-score-val" id="kiScoreA">0</span>
          </div>
          <span class="ki-score-sep">·</span>
          <div class="ki-score-cell" id="kiScoreCellB">
            <span class="ki-score-val" id="kiScoreB">0</span>
            <span class="ki-score-name" id="kiScoreNameB">Oyuncu 2</span>
          </div>
        </div>
        <button class="icon-button" id="kiHelpButton" type="button" aria-label="Nasıl Oynanır?">?</button>
      </header>

      <div class="ki-ref-card">
        <p class="ki-ref-eyebrow" id="kiRefEyebrow">1. Futbolcu</p>
        <h2 class="ki-ref-name" id="kiRefName">-</h2>
      </div>

      <div class="ki-board" id="kiBoard"></div>

      <section class="ki-pick-panel" id="kiPickPanel">
        <div class="ki-turn-row">
          <p class="ki-turn" id="kiTurn">Sıra: -</p>
          <p class="ki-turn-crit" id="kiTurnCrit">-</p>
        </div>
        <div class="ki-search-row">
          <input class="ki-search-input" id="kiSearchInput" type="text" placeholder="Futbolcu ara..." autocomplete="off" spellcheck="false" />
          <button class="ki-search-clear" id="kiSearchClear" type="button" aria-label="Aramayı Temizle">×</button>
        </div>
        <div class="ki-suggestions" id="kiSuggestions" role="listbox"></div>
        <p class="ki-search-status" id="kiSearchStatus"></p>
        <div class="ki-pick-actions">
          <button class="ghost-button" id="kiUndoButton" type="button" disabled>Geri Al</button>
          <button class="primary-button" id="kiRevealButton" type="button" disabled>Sonucu Aç</button>
        </div>
      </section>

      <section class="ki-result hidden" id="kiResult">
        <p class="eyebrow" id="kiResultEyebrow">Futbolcu Bitti</p>
        <h2 class="ki-result-title" id="kiResultTitle">-</h2>
        <p class="ki-result-sub" id="kiResultSub"></p>
        <div class="ki-result-actions">
          <button class="ghost-button" id="kiEndGameButton" type="button">Bitir</button>
          <button class="primary-button" id="kiNextRefButton" type="button">Sonraki Futbolcu</button>
        </div>
      </section>
    </section>

    <div class="ki-modal hidden" id="kiInfoModal" role="dialog" aria-modal="true" aria-labelledby="kiInfoTitle" aria-hidden="true">
      <div class="ki-modal-card">
        <div class="ki-modal-header">
          <div>
            <p class="eyebrow">Nasıl Oynanır?</p>
            <h2 id="kiInfoTitle">Kariyer İkizi</h2>
          </div>
          <button class="icon-button" id="kiCloseInfoButton" type="button" aria-label="Kapat">×</button>
        </div>
        <ol class="ki-rules">
          <li>Yazı-tura ile ilk seçecek oyuncu belirlenir.</li>
          <li>Oyun bir futbolcu getirir; onun 5 kriterdeki değerleri gizlidir.</li>
          <li>Her kriter için iki oyuncu sırayla, değeri o futbolcuya en yakın olacağını düşündüğü bir futbolcu söyler.</li>
          <li><strong>Sonucu Aç</strong> ile önce ana futbolcunun, sonra seçilenlerin değeri açılır. Daha yakın olan 1 puan alır; eşitlikte puan yok.</li>
          <li>Aynı futbolcu, bir ana futbolcu boyunca yalnız bir kez seçilebilir. Seçilen futbolcunun o kriterde verisi olmalı (ör. Süper Lig maçı için Süper Lig'de oynamış olmalı).</li>
          <li>5 kriter bitince yeni futbolcuya geçilir; puanlar birikir. En çok puanı toplayan kazanır.</li>
        </ol>
      </div>
    </div>
  `;
}
