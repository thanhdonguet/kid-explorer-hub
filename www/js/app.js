/* ================================================================
   Central Application Router & State Manager
   – Dashboard: Đảo Khám Phá (4 islands, only Memory is active)
   – Language toggle: VI ↔ EN
   ================================================================ */

class AppController {
  constructor() {
    // ── UI Cache ──
    this.screens = {
      dashboard: document.getElementById('dashboard-screen'),
      game:      document.getElementById('game-screen'),
    };
    this.hud = {
      backBtn:      document.getElementById('btn-back'),
      soundBtn:     document.getElementById('btn-sound'),
      soundOnIcon:  document.getElementById('sound-on-icon'),
      soundOffIcon: document.getElementById('sound-off-icon'),
      starCount:    document.getElementById('star-count'),
      title:        document.getElementById('app-title-hud'),
      langBtn:      document.getElementById('btn-lang'),
    };

    // ── State ──
    this.activeGame   = null;
    this.activeGameId = '';
    this.lang         = 'vi';
    this.stars        = parseInt(localStorage.getItem('kid_explorer_stars') || '0', 10);

    // ── i18n Translations ──
    this.T = {
      vi: {
        appTitle:     'Đảo Khám Phá',
        memoryName:   'Khu Rừng Trí Nhớ',
        memoryDesc:   'Lật thẻ tìm cặp đôi',
        mathName:     'Chợ Trái Cây',
        mathDesc:     'Đếm và học số',
        alphabetPopName: 'Bong Bóng Chữ Cái',
        alphabetPopDesc: 'Học chữ vui nhộn',
        drawingName:  'Khủng Long Sắc Màu',
        drawingDesc:  'Khủng long đổi màu vui nhộn',
        colorName:    'Phòng Thí Nghiệm Màu',
        colorDesc:    'Pha màu kỳ diệu',
        comingSoon:   '🔒 Sắp Ra Mắt',
        scoreLabel:   'Điểm',
        backTo:       'Đảo Khám Phá',
        score_drawing: 'Điểm vẽ',
        draw_color: 'Màu',
        draw_size: 'Nét vẽ',
        draw_stamp: 'Con dấu',
        draw_rainbow: 'Cầu vồng',
        draw_clear: 'Xóa',
        draw_submit: 'Hoàn thành',
      },
      en: {
        appTitle:     'Explorer Island',
        memoryName:   'Memory Jungle',
        memoryDesc:   'Flip cards, find pairs!',
        mathName:     'Fruit Market',
        mathDesc:     'Count & learn numbers',
        alphabetPopName: 'Alphabet Pop',
        alphabetPopDesc: 'Fun letters learning',
        drawingName:  'Colorful Dinosaur',
        drawingDesc:  'Watch dino change colors!',
        colorName:    'Color Mix Lab',
        colorDesc:    'Mix magical colors',
        comingSoon:   '🔒 Coming Soon',
        scoreLabel:   'Score',
        backTo:       'Explorer Island',
        score_drawing: 'Drawing Score',
        draw_color: 'Color',
        draw_size: 'Brush size',
        draw_stamp: 'Stamp',
        draw_rainbow: 'Rainbow',
        draw_clear: 'Clear',
        draw_submit: 'Submit',
      },
    };
  }

  /* ================================================================
     INIT
     ================================================================ */
  init() {
    // 1. Init HUD values
    this.hud.starCount.textContent = this.stars;
    this.applyLang();

    // 2. Island click listeners
    document.querySelectorAll('.island-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game');
        audio.playTap();

        if (card.classList.contains('island-locked')) {
          this._showToast(this.T[this.lang].comingSoon);
          return;
        }
        this.launchGame(gameId);
      });
    });

    // 3. Back button
    this.hud.backBtn.addEventListener('click', () => {
      audio.playTap();
      this.closeActiveGame();
    });

    // 4. Sound toggle
    this.hud.soundBtn.addEventListener('click', () => {
      audio.playTap(); // Play sound before muting
      const isMuted = audio.toggleMute();
      this.hud.soundOnIcon.classList.toggle('hidden', isMuted);
      this.hud.soundOffIcon.classList.toggle('hidden', !isMuted);
    });

    // 5. Language toggle
    this.hud.langBtn.addEventListener('click', () => {
      audio.playTap();
      this.lang = this.lang === 'vi' ? 'en' : 'vi';
      this.hud.langBtn.textContent = this.lang.toUpperCase();
      document.documentElement.setAttribute('data-lang', this.lang);
      this.applyLang();
      // Pass lang to active game if it supports it
      if (this.activeGame && typeof this.activeGame.updateLanguage === 'function') {
        this.activeGame.updateLanguage(this.lang, this.T[this.lang]);
      }
    });

    // 6. PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg  => console.log('SW registered:', reg.scope))
          .catch(err => console.warn('SW failed:', err));
      });
    }

    // 7. Unlock Web Audio on first interaction
    document.body.addEventListener('click', () => audio.resume(), { once: true });
  }

  /* ================================================================
     LANGUAGE
     ================================================================ */
  applyLang() {
    const t = this.T[this.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });
    // Sync HUD title with current screen
    const gameTitles = {
      'memory': t.memoryName,
      'color': t.colorName,
      'alphabet-pop': t.alphabetPopName,
      'drawing': t.drawingName,
      'math': t.mathName
    };

    if (!this.activeGameId) {
      this.hud.title.textContent = t.appTitle;
    } else if (gameTitles[this.activeGameId]) {
      this.hud.title.textContent = gameTitles[this.activeGameId];
    }
  }

  /* ── Toast notification for locked islands ── */
  _showToast(msg) {
    // Remove any existing toast
    const old = document.getElementById('app-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    // Trigger animation via rAF
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 400);
    }, 2000);
  }

  /* ================================================================
     NAVIGATION
     ================================================================ */
  showScreen(name) {
    Object.keys(this.screens).forEach(key => {
      this.screens[key].classList.toggle('active', key === name);
    });

    const t = this.T[this.lang];
    if (name === 'game') {
      this.hud.backBtn.classList.remove('hidden');
    } else {
      this.hud.backBtn.classList.add('hidden');
      this.hud.title.textContent = t.appTitle;
    }
  }

  /* ── Launch a game ── */
  launchGame(gameId) {
    this.activeGameId = gameId;
    this.showScreen('game');

    const stage = document.getElementById('game-stage');
    stage.innerHTML = '';
    
    const dashboard = document.getElementById('game-dashboard');
    if (dashboard) dashboard.style.display = 'flex';

    const t = this.T[this.lang];

    switch (gameId) {
      case 'memory':
        this.hud.title.textContent = t.memoryName;
        this.activeGame = new MemoryJungle(stage, this);
        break;
      case 'color':
        this.hud.title.textContent = t.colorName;
        if (dashboard) dashboard.style.display = 'none';
        this.activeGame = new ColorMixLab(stage, this);
        break;
      case 'alphabet-pop':
        this.hud.title.textContent = t.alphabetPopName;
        this.activeGame = new AlphabetPop(stage, this);
        break;
      case 'drawing':
        this.hud.title.textContent = t.drawingName;
        this.activeGame = new DinosaurColors(stage, this);
        break;
      case 'math':
        this.hud.title.textContent = t.mathName;
        this.activeGame = new FruitMarket(stage, this);
        break;
      default:
        // Unknown / unimplemented game – go back to dashboard
        console.warn('Game not implemented:', gameId);
        this.showScreen('dashboard');
        return;
    }

    this.activeGame.start();
  }

  /* ── Close active game ── */
  closeActiveGame() {
    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }
    this.activeGameId = '';
    this.showScreen('dashboard');
  }

  /* ── (Legacy) Star reward – kept for future games ── */
  addStars(count) {
    this.stars += count;
    localStorage.setItem('kid_explorer_stars', this.stars);
    this.hud.starCount.textContent = this.stars;
  }

  /* ── Win Game helper ── */
  winGame(starsToAdd) {
    this.addStars(starsToAdd);
    if (typeof audio !== 'undefined' && audio.playCheer) {
      audio.playCheer();
    }
    const msg = this.lang === 'vi' ? 'Hoan hô! Bạn đã hoàn thành xuất sắc!' : 'Hurray! You did a great job!';
    this._showToast(msg);
  }
}

/* ── Bootstrap ── */
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new AppController();
  app.init();
});
