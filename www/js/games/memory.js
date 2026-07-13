/* ================================================================
   Memory Jungle – Khu Rừng Trí Nhớ  (Full Featured v2)
   Features:
   - 3 difficulty modes: 5 / 10 / 15 pairs (10 / 20 / 30 cards)
   - 20 SVG card images (vector, zoom-safe)
   - Timer counting up (MM:SS)
   - In-game score: +10 match, -2 mismatch
   - High score per mode stored in localStorage (best time)
   - Sound: flip / match / mismatch / level complete
   - Celebration screen with confetti on completion
   ================================================================ */

class MemoryJungle {
  constructor(container, app) {
    this.container    = container;
    this.app          = app;

    // ── Game State ──
    this.pairsCount   = 5;
    this.cards        = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.score        = 0;
    this.lockBoard    = false;
    this.active       = false;

    // ── Timer ──
    this.timerInterval  = null;
    this.elapsedSeconds = 0;

    // ── 20 Card Image definitions (SVG emoji – vector, zoom-safe) ──
    this.CARD_IMAGES = [
      { id: 'lion',      emoji: '🦁', bg: '#FFF3CD' },
      { id: 'monkey',    emoji: '🐵', bg: '#F5DEB3' },
      { id: 'panda',     emoji: '🐼', bg: '#F0F0F0' },
      { id: 'rabbit',    emoji: '🐰', bg: '#FFE4E1' },
      { id: 'fox',       emoji: '🦊', bg: '#FFDAB9' },
      { id: 'frog',      emoji: '🐸', bg: '#D4EDDA' },
      { id: 'elephant',  emoji: '🐘', bg: '#E8E8F0' },
      { id: 'penguin',   emoji: '🐧', bg: '#E0EFF7' },
      { id: 'fish',      emoji: '🐠', bg: '#D6EAF8' },
      { id: 'butterfly', emoji: '🦋', bg: '#F3E5F5' },
      { id: 'sunflower', emoji: '🌻', bg: '#FFFDE7' },
      { id: 'icecream',  emoji: '🍦', bg: '#FFF0F5' },
      { id: 'rocket',    emoji: '🚀', bg: '#E8EAF6' },
      { id: 'star',      emoji: '⭐', bg: '#FAFAD2' },
      { id: 'diamond',   emoji: '💎', bg: '#E0FFFF' },
      { id: 'apple',     emoji: '🍎', bg: '#FEE2E2' },
      { id: 'sun',       emoji: '☀️', bg: '#FFFBE7' },
      { id: 'moon',      emoji: '🌙', bg: '#EDE7F6' },
      { id: 'rainbow',   emoji: '🌈', bg: '#F0FFF4' },
      { id: 'tree',      emoji: '🌲', bg: '#E8F5E9' },
    ];
  }

  /* ── SVG Card Face (vector, scales perfectly at any zoom) ── */
  _makeCardFace(emoji, bg) {
    /* Using SVG <text> ensures the emoji is rendered by the browser's
       vector text engine – no pixelation at any zoom level.           */
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
              width="100%" height="100%" role="img">
      <rect width="100" height="100" rx="12" fill="${bg}"/>
      <text x="50" y="60" font-size="54" text-anchor="middle"
            dominant-baseline="central">${emoji}</text>
    </svg>`;
  }

  /* ================================================================
     MAIN FLOW
     ================================================================ */

  /** Entry point – called by AppController */
  start() {
    this._hideHUDTimer();
    this.showModeSelect();
  }

  /* ── Mode Selection Screen ── */
  showModeSelect() {
    this.active = false;
    this.stopTimer();
    this._hideHUDTimer();

    document.getElementById('score-val').textContent = '0';

    this.container.innerHTML = `
      <div id="memory-mode-screen">
        <div class="mem-mode-header">
          <div class="mem-mode-forest-emoji">🌳</div>
          <h2 class="mem-mode-title">Khu Rừng Trí Nhớ</h2>
          <p class="mem-mode-subtitle">Chọn mức độ để bắt đầu!</p>
        </div>
        <div class="mem-mode-options">
          ${this._renderModeBtn(5,  '🌱', 'Dễ',  '5 bộ · 10 mảnh',  'mem-mode-easy')}
          ${this._renderModeBtn(10, '🌿', 'Vừa', '10 bộ · 20 mảnh', 'mem-mode-medium')}
          ${this._renderModeBtn(15, '🌲', 'Khó', '15 bộ · 30 mảnh', 'mem-mode-hard')}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.mem-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playTap();
        this.startGame(parseInt(btn.dataset.pairs, 10));
      });
    });
  }

  _renderModeBtn(pairs, icon, label, countText, cssClass) {
    const hs     = this.getHighScore(pairs);
    const hsText = hs !== null ? `🏆 ${this.formatTime(hs)}` : '🏆 --:--';
    return `
      <button class="mem-mode-btn ${cssClass}" data-pairs="${pairs}">
        <span class="mem-mode-icon">${icon}</span>
        <div class="mem-mode-info">
          <span class="mem-mode-label">${label}</span>
          <span class="mem-mode-count">${countText}</span>
        </div>
        <span class="mem-mode-hs">${hsText}</span>
      </button>
    `;
  }

  /* ================================================================
     GAME SETUP
     ================================================================ */

  startGame(pairsCount) {
    this.pairsCount     = pairsCount;
    this.matchedPairs   = 0;
    this.score          = 0;
    this.lockBoard      = false;
    this.flippedCards   = [];
    this.elapsedSeconds = 0;
    this.active         = true;

    // Determine grid columns: 5→5cols, 10→5cols, 15→6cols
    const cols = pairsCount === 15 ? 6 : 5;

    // Show HUD timer + reset score
    document.getElementById('game-timer').classList.remove('hidden');
    document.getElementById('timer-val').textContent  = '00:00';
    document.getElementById('score-val').textContent  = '0';

    this.container.innerHTML = `
      <div id="memory-container">
        <div id="memory-game-grid" style="--mem-cols:${cols};"></div>
      </div>
    `;

    this.grid = document.getElementById('memory-game-grid');
    this.setupBoard();
    this.startTimer();
  }

  setupBoard() {
    // Select first N images, duplicate & shuffle
    const selected = this.CARD_IMAGES.slice(0, this.pairsCount);
    const deck = [...selected, ...selected].sort(() => Math.random() - 0.5);

    this.cards = [];
    this.grid.innerHTML = '';

    deck.forEach((imgData, idx) => {
      const card = document.createElement('div');
      card.className        = 'mem-card';
      card.dataset.cardId   = imgData.id;
      card.dataset.idx      = idx;
      card.style.animationDelay = `${idx * 0.028}s`;

      card.innerHTML = `
        <div class="mem-card-inner">
          <div class="mem-card-front">
            <div class="mem-card-front-deco"></div>
          </div>
          <div class="mem-card-back">
            ${this._makeCardFace(imgData.emoji, imgData.bg)}
          </div>
        </div>
      `;

      card.addEventListener('click', () => this.flipCard(card));
      this.grid.appendChild(card);
      this.cards.push(card);
    });
  }

  /* ================================================================
     GAMEPLAY
     ================================================================ */

  flipCard(card) {
    if (!this.active)     return;
    if (this.lockBoard)   return;
    if (card.classList.contains('mem-flipped') ||
        card.classList.contains('mem-matched')) return;

    audio.playCardFlip();
    card.classList.add('mem-flipped');
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.lockBoard = true;
      this.checkMatch();
    }
  }

  checkMatch() {
    const [c1, c2] = this.flippedCards;
    if (c1.dataset.cardId === c2.dataset.cardId) {
      this.handleMatch(c1, c2);
    } else {
      this.handleMismatch(c1, c2);
    }
  }

  handleMatch(c1, c2) {
    setTimeout(() => {
      audio.playMatch();
      c1.classList.add('mem-matched');
      c2.classList.add('mem-matched');

      this.score += 10;
      this.matchedPairs++;
      this.updateHUD();

      this.flippedCards = [];
      this.lockBoard    = false;

      if (this.matchedPairs === this.pairsCount) {
        setTimeout(() => this.onGameComplete(), 600);
      }
    }, 300);
  }

  handleMismatch(c1, c2) {
    // Penalty first
    this.score = Math.max(0, this.score - 2);
    this.updateHUD();

    setTimeout(() => {
      audio.playMismatch();
      c1.classList.add('mem-shake');
      c2.classList.add('mem-shake');

      setTimeout(() => {
        c1.classList.remove('mem-flipped', 'mem-shake');
        c2.classList.remove('mem-flipped', 'mem-shake');
        this.flippedCards = [];
        this.lockBoard    = false;
      }, 520);
    }, 700);
  }

  /* ================================================================
     TIMER
     ================================================================ */

  startTimer() {
    this.stopTimer(); // safety clear
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      const el = document.getElementById('timer-val');
      if (el) el.textContent = this.formatTime(this.elapsedSeconds);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ── HUD ── */
  updateHUD() {
    const el = document.getElementById('score-val');
    if (el) el.textContent = this.score;
  }

  _hideHUDTimer() {
    const timerEl = document.getElementById('game-timer');
    if (timerEl) timerEl.classList.add('hidden');
  }

  /* ================================================================
     HIGH SCORE  (localStorage, time-based: lower = better)
     ================================================================ */

  getHighScore(pairs) {
    const v = localStorage.getItem(`mem_hs_${pairs}`);
    return v !== null ? parseInt(v, 10) : null;
  }

  /** Returns true if a new record was set */
  saveHighScore(pairs, seconds) {
    const existing = this.getHighScore(pairs);
    if (existing === null || seconds < existing) {
      localStorage.setItem(`mem_hs_${pairs}`, seconds);
      return true;
    }
    return false;
  }

  /* ================================================================
     COMPLETION
     ================================================================ */

  onGameComplete() {
    this.active = false;
    this.stopTimer();
    audio.playLevelComplete();

    const isNewRecord = this.saveHighScore(this.pairsCount, this.elapsedSeconds);
    const bestTime    = this.getHighScore(this.pairsCount); // always non-null now
    this.showCompletion(isNewRecord, bestTime);
  }

  showCompletion(isNewRecord, bestTime) {
    const timeStr = this.formatTime(this.elapsedSeconds);
    const bestStr = this.formatTime(bestTime);

    const hsHTML = isNewRecord
      ? `<span class="comp-new-record">🌟 Kỷ lục mới! ${bestStr}</span>`
      : `<span class="comp-best">🏆 Kỷ lục tốt nhất: ${bestStr}</span>`;

    this.container.innerHTML = `
      <div id="memory-complete-screen">
        <div class="comp-confetti-layer" id="comp-confetti"></div>
        <div class="comp-card">
          <div class="comp-trophy-icon">${isNewRecord ? '🏆' : '🎉'}</div>
          <h2 class="comp-title">${isNewRecord ? 'Kỷ lục mới!' : 'Xuất sắc!'}</h2>
          <p class="comp-subtitle">Bé đã khám phá xong khu rừng!</p>

          <div class="comp-stats">
            <div class="comp-stat">
              <span class="comp-stat-icon">⏱️</span>
              <div class="comp-stat-body">
                <div class="comp-stat-label">Thời gian</div>
                <div class="comp-stat-value">${timeStr}</div>
              </div>
            </div>
            <div class="comp-stat">
              <span class="comp-stat-icon">🌟</span>
              <div class="comp-stat-body">
                <div class="comp-stat-label">Điểm</div>
                <div class="comp-stat-value">${this.score}</div>
              </div>
            </div>
            <div class="comp-stat">
              <span class="comp-stat-icon">📊</span>
              <div class="comp-stat-body">
                <div class="comp-stat-label">Mức độ</div>
                <div class="comp-stat-value">${this.pairsCount} bộ</div>
              </div>
            </div>
          </div>

          <div class="comp-hs-row">${hsHTML}</div>

          <div class="comp-actions">
            <button id="comp-btn-replay" class="btn-primary">🔄 Chơi Lại</button>
            <button id="comp-btn-menu"   class="btn-secondary">📋 Đổi Mức Độ</button>
          </div>
        </div>
      </div>
    `;

    this._spawnConfetti();

    document.getElementById('comp-btn-replay').addEventListener('click', () => {
      audio.playTap();
      this.startGame(this.pairsCount);
    });
    document.getElementById('comp-btn-menu').addEventListener('click', () => {
      audio.playTap();
      this.showModeSelect();
    });
  }

  _spawnConfetti() {
    const layer = document.getElementById('comp-confetti');
    if (!layer) return;
    const colors = [
      '#ff6b8b','#4ecdc4','#ffbe0b','#a1c4fd',
      '#ff9f43','#a29bfe','#fd79a8','#00cec9',
    ];
    for (let i = 0; i < 70; i++) {
      const el = document.createElement('div');
      el.className = 'comp-confetti-piece';
      const size   = 6 + Math.random() * 9;
      const isCirc = Math.random() > 0.45;
      el.style.cssText = `
        left:${Math.random() * 100}%;
        animation-delay:${Math.random() * 2.5}s;
        animation-duration:${2.5 + Math.random() * 2}s;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        width:${size}px;
        height:${size}px;
        border-radius:${isCirc ? '50%' : '2px'};
      `;
      layer.appendChild(el);
    }
  }

  /* ── Cleanup ── */
  destroy() {
    this.active = false;
    this.stopTimer();
    this.cards        = [];
    this.flippedCards = [];
    this.container.innerHTML = '';
    this._hideHUDTimer();
  }

  /* Language hook (placeholder) */
  updateLanguage() {}
}
