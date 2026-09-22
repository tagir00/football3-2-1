export function template() {
  return `
    <section class="hero-panel ht-hero" id="htHomePanel">
      <div class="home-header-row">
        <a class="home-button" href="#/" aria-label="Ana Sayfa" title="Ana Sayfa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 11.5 12 4l9 7.5"/>
            <path d="M5 10.5V20h4.5v-5.5h5V20H19V10.5"/>
          </svg>
        </a>
        <button class="icon-button" id="htInfoButton" type="button" aria-label="Nasıl Oynanır?">?</button>
      </div>

      <div class="home-copy-block ht-copy">
        <p class="eyebrow">2 Oyunculu · Moderatörlü Bilgi Oyunu</p>
        <h1>Hedefi Tuttur</h1>
        <p class="hero-copy">Futbol bilgini kullan, hedefi tuttur. İki oyuncu sırayla toplam 5'er futbolcu seçer; hedef sayıya mutlak uzaklığı en düşük olan kazanır.</p>
      </div>

      <button class="primary-button home-start-button" id="htStartButton" type="button">
        Oyuna Başla
      </button>
    </section>

    <section class="setup-panel ht-setup hidden" id="htSetupPanel">
      <header class="setup-header">
        <div>
          <p class="eyebrow">Ayarlar · Oyuncular & Hedef</p>
          <h2>Oyunu Kur</h2>
        </div>
        <button class="ghost-button" id="htSetupBackButton" type="button">Geri Dön</button>
      </header>

      <div class="setup-form">
        <label class="setup-field">
          <span>1. Oyuncu</span>
          <input class="setup-input" id="htPlayer1Input" type="text" placeholder="Enes" autocomplete="off" />
        </label>
        <label class="setup-field">
          <span>2. Oyuncu</span>
          <input class="setup-input" id="htPlayer2Input" type="text" placeholder="Kerem" autocomplete="off" />
        </label>
      </div>

      <div class="setup-status" id="htSetupStatus">İki oyuncunun da adını yaz, sonra devam et.</div>

      <button class="primary-button" id="htGoToCoinButton" type="button">Yazı-Tura'ya Geç</button>
    </section>

    <section class="ht-coinflip hidden" id="htCoinPanel">
      <header class="setup-header">
        <div>
          <p class="eyebrow">Kim Başlıyor?</p>
          <h2>Yazı-Tura</h2>
        </div>
        <button class="ghost-button" id="htCoinBackButton" type="button">Geri Dön</button>
      </header>

      <p class="setup-status" id="htCoinStatus">Yazı-Tura'yı at ve ilk seçen oyuncuyu belirle.</p>

      <div class="ht-coin-row">
        <div class="ht-coin-side" id="htCoinSideA">
          <span class="ht-coin-name">1</span>
        </div>
        <span class="ht-coin-vs">VS</span>
        <div class="ht-coin-side" id="htCoinSideB">
          <span class="ht-coin-name">2</span>
        </div>
      </div>

      <div class="ht-coin-result hidden" id="htCoinResult">
        <p class="eyebrow">İLK SEÇEN</p>
        <h3 id="htCoinWinnerName">-</h3>
        <p class="ht-coin-note">Turlar arası ilk seçen otomatik olarak değişir.</p>
      </div>

      <div class="ht-coin-actions">
        <button class="primary-button" id="htSpinCoinButton" type="button">Yazı-Tura At</button>
        <button class="primary-button hidden" id="htGoToWheelButton" type="button">Kriter Çarkına Geç</button>
      </div>
    </section>

    <section class="ht-coinflip hidden" id="htWheelPanel">
      <header class="setup-header">
        <div>
          <p class="eyebrow">Kriter Çarkı</p>
          <h2>Hangi Kategori?</h2>
        </div>
        <button class="ghost-button" id="htWheelBackButton" type="button">Geri Dön</button>
      </header>

      <p class="setup-status" id="htWheelStatus">Çark hazır. Çevir ve kategoriyi belirle.</p>

      <div class="ht-wheel-shell">
        <div class="ht-wheel-display" id="htWheelDisplay">
          <p class="eyebrow ht-wheel-eyebrow">Kriter</p>
          <strong class="ht-wheel-title" id="htWheelTitle">?</strong>
          <span class="ht-wheel-sub" id="htWheelSub">Hedefe ulaşacak istatistik</span>
          <div class="ht-wheel-target hidden" id="htWheelTargetBlock">
            <p class="eyebrow">Hedef</p>
            <span class="ht-wheel-target-val" id="htWheelTargetVal">—</span>
          </div>
        </div>
      </div>

      <div class="ht-coin-actions">
        <button class="primary-button" id="htSpinWheelButton" type="button">Kriter Çarkını Çevir</button>
        <button class="primary-button hidden" id="htGoToGameButton" type="button">Oyuna Geç</button>
      </div>
    </section>

    <section class="game-panel ht-game hidden" id="htGamePanel">
      <header class="ht-topbar">
        <a class="home-button" href="#/" aria-label="Ana Sayfa" title="Ana Sayfa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 11.5 12 4l9 7.5"/>
            <path d="M5 10.5V20h4.5v-5.5h5V20H19V10.5"/>
          </svg>
        </a>
        <div class="ht-score" aria-label="Skor Tablosu">
          <div class="ht-score-cell">
            <span class="ht-score-name" id="htScoreNameA">Oyuncu 1</span>
            <span class="ht-score-val" id="htScoreA">0</span>
          </div>
          <span class="ht-score-sep">·</span>
          <div class="ht-score-cell">
            <span class="ht-score-name" id="htScoreNameB">Oyuncu 2</span>
            <span class="ht-score-val" id="htScoreB">0</span>
          </div>
        </div>
        <div class="ht-topbar-actions">
          <button class="icon-button" id="htHelpButton" type="button" aria-label="Nasıl Oynanır?">?</button>
        </div>
      </header>

      <div class="ht-board">
        <section class="ht-player-col" id="htPlayerColA" data-player="0">
          <header class="ht-player-head">
            <p class="eyebrow">Oyuncu 1</p>
            <h3 id="htPlayerNameA">Enes</h3>
            <p class="ht-progress" id="htProgressA">0 / 5</p>
          </header>
          <ol class="ht-slot-list" id="htSlotListA">
            <li class="ht-slot empty" data-slot="0"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
            <li class="ht-slot empty" data-slot="1"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
            <li class="ht-slot empty" data-slot="2"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
            <li class="ht-slot empty" data-slot="3"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
            <li class="ht-slot empty" data-slot="4"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
          </ol>
          <footer class="ht-player-foot">
            <span class="ht-total-label">Toplam</span>
            <span class="ht-total-val" id="htTotalA">—</span>
            <span class="ht-diff" id="htDiffA"></span>
          </footer>
        </section>

        <aside class="ht-target-card">
          <p class="eyebrow" id="htTargetEyebrow">Hedef</p>
          <div class="ht-target-value" id="htTargetValue">750</div>
          <div class="ht-target-cat" id="htTargetCat">SERIE A MAÇI</div>
          <p class="ht-target-hint" id="htTargetHint">Her oyuncu 5 seçim yapar.</p>
        </aside>

        <section class="ht-player-col" id="htPlayerColB" data-player="1">
          <header class="ht-player-head">
            <p class="eyebrow">Oyuncu 2</p>
            <h3 id="htPlayerNameB">Kerem</h3>
            <p class="ht-progress" id="htProgressB">0 / 5</p>
          </header>
          <ol class="ht-slot-list" id="htSlotListB">
            <li class="ht-slot empty" data-slot="0"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
            <li class="ht-slot empty" data-slot="1"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
            <li class="ht-slot empty" data-slot="2"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
            <li class="ht-slot empty" data-slot="3"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
            <li class="ht-slot empty" data-slot="4"><span class="ht-slot-placeholder">+ Futbolcu</span></li>
          </ol>
          <footer class="ht-player-foot">
            <span class="ht-total-label">Toplam</span>
            <span class="ht-total-val" id="htTotalB">—</span>
            <span class="ht-diff" id="htDiffB"></span>
          </footer>
        </section>
      </div>

      <section class="ht-mod-panel" id="htModPanel">
        <div class="ht-turn-block">
          <p class="eyebrow">Sıra</p>
          <div class="ht-turn-row">
            <h2 class="ht-turn-name" id="htTurnName">Enes</h2>
            <span class="ht-turn-progress" id="htTurnProgress">1 / 5 Futbolcu</span>
          </div>
          <p class="ht-turn-hint" id="htTurnHint">"Futbolcunu söyle."</p>
        </div>

        <div class="ht-search-block">
          <div class="ht-search-row">
            <input class="ht-search-input" id="htSearchInput" type="text" placeholder="Futbolcu ara..." autocomplete="off" spellcheck="false" />
            <button class="ht-search-clear" id="htSearchClear" type="button" aria-label="Aramayı Temizle">×</button>
          </div>
          <div class="ht-suggestions" id="htSuggestions" role="listbox"></div>
          <p class="ht-search-status" id="htSearchStatus"></p>
        </div>

        <div class="ht-mod-actions">
          <button class="ghost-button" id="htUndoButton" type="button" disabled>Son Seçimi Geri Al</button>
          <button class="ghost-button" id="htResetRoundButton" type="button">Turu Sıfırla</button>
          <button class="primary-button ht-reveal-button" id="htRevealButton" type="button" disabled>Sonuçları Aç</button>
        </div>
      </section>

      <section class="ht-result hidden" id="htResult">
        <p class="eyebrow" id="htResultEyebrow">Tur Sonucu</p>
        <h2 class="ht-result-title" id="htResultTitle">Kazanan</h2>
        <p class="ht-result-sub" id="htResultSub"></p>
        <div class="ht-result-actions">
          <button class="ghost-button" id="htEndGameButton" type="button">Bitir</button>
          <button class="primary-button" id="htNextRoundButton" type="button">Yeni Tur</button>
        </div>
      </section>
    </section>

    <div class="ht-modal hidden" id="htInfoModal" role="dialog" aria-modal="true" aria-labelledby="htInfoTitle" aria-hidden="true">
      <div class="ht-modal-card">
        <header class="ht-modal-head">
          <h3 id="htInfoTitle">Nasıl Oynanır?</h3>
          <button class="icon-button" id="htCloseInfoButton" type="button" aria-label="Kapat">×</button>
        </header>
        <div class="ht-modal-body">
          <ol class="ht-how-list">
            <li>Oyunun hedef sayısı belirlenir.</li>
            <li>İki oyuncu sırayla futbolcu söyler.</li>
            <li>Her oyuncu toplam 5 futbolcu seçer.</li>
            <li>Futbolcuların istatistikleri seçim sırasında <b>gizlidir</b>.</li>
            <li>10 futbolcu tamamlandığında istatistikler açılır.</li>
            <li>Her oyuncunun 5 futbolcusunun toplamı hesaplanır.</li>
            <li>Hedefe olan mutlak uzaklığı en düşük olan oyuncu kazanır.</li>
          </ol>
          <div class="ht-how-example">
            <p class="eyebrow">Örnek</p>
            <p><b>Hedef:</b> 750</p>
            <p>Oyuncu A: 730 · Uzaklık 20</p>
            <p>Oyuncu B: 790 · Uzaklık 40</p>
            <p><b>Kazanan:</b> Oyuncu A</p>
          </div>
        </div>
      </div>
    </div>

    <div class="ht-modal hidden" id="htConfirmModal" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="ht-modal-card small">
        <header class="ht-modal-head">
          <h3>Emin misin?</h3>
        </header>
        <div class="ht-modal-body">
          <p id="htConfirmText">Bu turdaki tüm seçimler silinecek. Devam etmek istiyor musun?</p>
          <div class="ht-modal-actions">
            <button class="ghost-button" id="htConfirmCancel" type="button">Vazgeç</button>
            <button class="danger-button" id="htConfirmOk" type="button">Evet, Sıfırla</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
