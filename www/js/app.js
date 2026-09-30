/* ================================================================
   Central Application Router & State Manager
   – Dashboard: Đảo Khám Phá (nine playable activities)
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
      musicBtn:     document.getElementById('btn-music'),
      starCount:    document.getElementById('star-count'),
      title:        document.getElementById('app-title-hud'),
      langBtn:      document.getElementById('btn-lang'),
    };

    // ── State ──
    this.activeGame   = null;
    this.activeGameId = '';
    this.lang         = localStorage.getItem('kid_explorer_lang') === 'en' ? 'en' : 'vi';
    this.stars        = Math.max(0, parseInt(localStorage.getItem('kid_explorer_stars') || '0', 10) || 0);

    // ── i18n Translations ──
    this.T = {
      vi: {
        appTitle:     'Đảo Khám Phá',
        memoryName:   'Khu Rừng Trí Nhớ',
        memoryDesc:   'Lật thẻ tìm những người bạn',
        mathName:     'Bé Học Cộng',
        mathDesc:     'Cộng hai số, vui mỗi ngày',
        alphabetPopName: 'Bong Bóng Chữ Cái',
        alphabetPopDesc: 'Bắt chữ xinh, học từ mới',
        dinosaurColorsName: 'Khủng Long Sắc Màu',
        dinosaurColorsDesc: 'Cho Dino ăn, xem màu biến hóa',
        colorName:    'Xưởng Pha Màu',
        colorDesc:    'Một chút màu, một chút phép màu',
        vehicleParkingName: 'Bến Xe Thành Phố',
        vehicleParkingDesc: 'Tìm đúng bến cho từng chiếc xe',
        shapeWorkshopName: 'Xưởng Lắp Ghép', shapeWorkshopDesc: 'Ghép hình nhỏ, tạo đồ chơi xinh', shapeWorkshopSkill: 'HÌNH KHỐI',
        patternTrainName: 'Đoàn Tàu Quy Luật', patternTrainDesc: 'Tìm món còn thiếu, đưa tàu về ga', patternTrainSkill: 'LOGIC',
        storyGardenName: 'Khu Vườn Diệu Kỳ', storyGardenDesc: 'Xếp chuyện nhỏ, nuôi vườn xanh', storyGardenSkill: 'TRÌNH TỰ',
        brandTagline: 'HỌC MÀ CHƠI, CHƠI MÀ HỌC', starsLabel: 'sao',
        welcome: 'CHÀO NHÀ THÁM HIỂM NHÍ!', heroLine1: 'Một thế giới nhỏ.', heroLine2: 'Ngàn điều hay.',
        heroDesc: 'Chạm vào điều kỳ diệu, chơi cùng trí tưởng tượng. Mỗi hòn đảo là một khám phá mới của bé!',
        explore: 'Cùng khám phá', heroNote: '9 trò chơi · Vô vàn niềm vui', islandNote: 'Cuộc phiêu lưu bắt đầu!',
        musicOff: 'Nhạc nền: Tắt', musicOn: 'Nhạc nền: Bật',
        pickIsland: 'CHƠI MỘT CHÚT, LỚN THÊM MỘT CHÚT', islandsTitle: 'Hôm nay, bé muốn khám phá gì?', islandsCount: '9 hòn đảo đang chờ bé',
        memorySkill: 'TRÍ NHỚ', colorSkill: 'SÁNG TẠO', mathSkill: 'PHÉP CỘNG', alphabetPopSkill: 'TIẾNG ANH', dinosaurColorsSkill: 'MÀU SẮC', vehicleParkingSkill: 'TƯ DUY',
        footerMessage: 'Mỗi ngày một khám phá. Mỗi bước một niềm vui.', credits: 'Góc phụ huynh & nguồn tài nguyên',
        memoryHint: 'Lật hai thẻ để tìm những người bạn giống nhau.', colorHint: 'Kéo bình màu vào bát, hoặc chọn màu rồi nhấn Enter.',
        mathHint: 'Cộng hai số rồi chọn đáp án. Chạm bóng đèn để xem gợi ý.', alphabetHint: 'Chọn một chữ cái, rồi tìm chữ ấy trong những món đồ chơi.',
        dinosaurColorsHint: 'Chạm vào trái cây và xem Dino đổi màu nhé!', vehicleHint: 'Kéo xe về đúng bến, hoặc chạm vào bến để chọn.',
        shapeWorkshopHint: 'Chọn mảnh rồi chọn chỗ đặt, hoặc kéo mảnh vào hình mẫu.',
        patternTrainHint: 'Quan sát các toa tàu và tìm món đồ còn thiếu trong quy luật.',
        storyGardenHint: 'Chọn thẻ rồi chọn vị trí, hoặc kéo thả để xếp câu chuyện theo thứ tự.',
        comingSoon:   '🔒 Sắp Ra Mắt',
        scoreLabel:   'Điểm',
        backTo:       'Đảo Khám Phá',
      },
      en: {
        appTitle:     'Explorer Island',
        memoryName:   'Memory Jungle',
        memoryDesc:   'Flip cards, find pairs!',
        mathName:     'Addition Adventure',
        mathDesc:     'Add two numbers, grow your skills',
        alphabetPopName: 'Alphabet Pop',
        alphabetPopDesc: 'Fun letters learning',
        dinosaurColorsName: 'Colorful Dinosaur',
        dinosaurColorsDesc: 'Watch Dino change colors!',
        colorName:    'Color Mix Lab',
        colorDesc:    'Mix magical colors',
        vehicleParkingName: 'City Parking',
        vehicleParkingDesc: 'Park each vehicle!',
        shapeWorkshopName: 'Shape Workshop', shapeWorkshopDesc: 'Little shapes, wonderful toys', shapeWorkshopSkill: 'SHAPES',
        patternTrainName: 'Pattern Train', patternTrainDesc: 'Find the pattern, send the train home', patternTrainSkill: 'LOGIC',
        storyGardenName: 'Story Garden', storyGardenDesc: 'Put stories in order, grow a garden', storyGardenSkill: 'SEQUENCING',
        brandTagline: 'LITTLE PLAY, BIG DISCOVERIES', starsLabel: 'stars',
        welcome: 'HELLO, LITTLE EXPLORER!', heroLine1: 'A little world.', heroLine2: 'A lot to discover.',
        heroDesc: 'A spark of wonder. A little imagination. Every island brings a brand new discovery!',
        explore: 'Let’s explore', heroNote: '9 games · Endless little adventures', islandNote: 'Adventure starts here!',
        musicOff: 'Music: Off', musicOn: 'Music: On',
        pickIsland: 'A LITTLE PLAY, A LITTLE GROWTH', islandsTitle: 'Where shall we explore today?', islandsCount: '9 islands waiting for you',
        memorySkill: 'MEMORY', colorSkill: 'CREATIVITY', mathSkill: 'ADDITION', alphabetPopSkill: 'ENGLISH', dinosaurColorsSkill: 'COLORS', vehicleParkingSkill: 'THINKING',
        footerMessage: 'A new discovery every day. A little joy every step.', credits: 'For parents & asset credits',
        memoryHint: 'Flip two cards to find matching friends.', colorHint: 'Drag a bottle into the bowl, or focus a color and press Enter.',
        mathHint: 'Add the two numbers and choose the answer. Tap the bulb for a picture hint.', alphabetHint: 'Choose a letter, then find it among the toys.',
        dinosaurColorsHint: 'Tap a fruit and watch Dino change color!', vehicleHint: 'Drag the vehicle to its station, or tap a station to choose.',
        shapeWorkshopHint: 'Choose a piece and a space, or drag the piece onto the outline.',
        patternTrainHint: 'Look at the train and find the missing item in the pattern.',
        storyGardenHint: 'Choose a card and a space, or drag cards to put the story in order.',
        comingSoon:   '🔒 Coming Soon',
        scoreLabel:   'Score',
        backTo:       'Explorer Island',
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
    this.hud.langBtn.textContent = this.lang.toUpperCase();
    document.getElementById('btn-explore').addEventListener('click', () => {
      document.getElementById('explore-section').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      document.querySelector('.island-card').focus({ preventScroll: true });
    });
    document.getElementById('brand-home').addEventListener('click', e => { e.preventDefault(); this.closeActiveGame(); });

    // 2. Island click listeners
    document.querySelectorAll('.island-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game');
        audio.playTap();
        if (window.TTS) window.TTS.primeIfNeeded();

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
      this.hud.soundBtn.setAttribute('aria-pressed', String(isMuted));
      this.hud.soundBtn.setAttribute('aria-label', this.lang === 'vi' ? (isMuted ? 'Bật âm thanh' : 'Tắt âm thanh') : (isMuted ? 'Enable sound' : 'Mute sound'));
      if (isMuted) { window.TTS?.cancel(); this.activeGame?.currentAudio?.pause(); }
    });
    this.hud.musicBtn.addEventListener('click', () => {
      audio.playTap();
      const enabled = audio.setMusicEnabled(!audio.musicEnabled);
      this.hud.musicBtn.setAttribute('aria-pressed', String(enabled));
      this.hud.musicBtn.querySelector('[data-i18n]').dataset.i18n = enabled ? 'musicOn' : 'musicOff';
      this.hud.musicBtn.querySelector('[data-i18n]').textContent = this.T[this.lang][enabled ? 'musicOn' : 'musicOff'];
    });

    // 5. Language toggle
    this.hud.langBtn.addEventListener('click', () => {
      audio.playTap();
      this.lang = this.lang === 'vi' ? 'en' : 'vi';
      localStorage.setItem('kid_explorer_lang', this.lang);
      this.hud.langBtn.textContent = this.lang.toUpperCase();
      document.documentElement.setAttribute('data-lang', this.lang);
      this.applyLang();
      // Pass lang to active game if it supports it
      if (this.activeGame && typeof this.activeGame.updateLanguage === 'function') {
        this.activeGame.updateLanguage(this.lang, this.T[this.lang]);
      }
    });

    // 6. PWA Service Worker
    this._initServiceWorker();

    // 7. Unlock Web Audio on first interaction
    document.body.addEventListener('click', () => audio.resume(), { once: true });
  }

  /* ================================================================
     SERVICE WORKER
     – The worker itself uses network-first for code, but the *page* still
       has to get off the previous worker. Whoever is controlling the tab
       when it loads has already served the old HTML/JS, so a new worker
       taking over mid-load means the visible code is one build behind.
       Adopt updates at the dashboard so a deployment cannot interrupt a game.
     ================================================================ */
  _initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    // If nothing controls the tab yet this is a first install – there is no
    // stale build on screen, so the claim below must NOT trigger a reload.
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloading) return;
      reloading = true;
      if (this.activeGameId) { this.pendingAppUpdate = true; return; }
      window.location.reload();
    });

    window.addEventListener('load', () => {
      // updateViaCache:'none' keeps sw.js itself out of the HTTP cache,
      // otherwise the phone can hand back the old worker for up to a day.
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
        .then(reg => {
          console.log('SW registered:', reg.scope);
          return reg.update(); // force an update check on every load
        })
        .catch(err => console.warn('SW failed:', err));
    });
  }

  /* ================================================================
     LANGUAGE
     ================================================================ */
  applyLang() {
    document.documentElement.lang = this.lang;
    document.documentElement.dataset.lang = this.lang;
    this.hud.soundBtn.setAttribute('aria-label', this.lang === 'vi' ? (audio.muted ? 'Bật âm thanh' : 'Tắt âm thanh') : (audio.muted ? 'Enable sound' : 'Mute sound'));
    const musicLabel = this.hud.musicBtn?.querySelector('[data-i18n]');
    if (musicLabel) musicLabel.dataset.i18n = audio.musicEnabled ? 'musicOn' : 'musicOff';
    const t = this.T[this.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
      const label = t[el.dataset.i18nLabel];
      if (label !== undefined) el.setAttribute('aria-label', label);
    });
    // Sync HUD title with current screen
    const gameTitles = {
      'memory': t.memoryName,
      'color': t.colorName,
      'alphabet-pop': t.alphabetPopName,
      'dinosaur-colors': t.dinosaurColorsName,
      'math': t.mathName,
      'vehicle-parking': t.vehicleParkingName,
      'shape-workshop': t.shapeWorkshopName,
      'pattern-train': t.patternTrainName,
      'story-garden': t.storyGardenName,
    };

    if (!this.activeGameId) {
      this.hud.title.textContent = t.appTitle;
    } else if (gameTitles[this.activeGameId]) {
      this.hud.title.textContent = gameTitles[this.activeGameId];
    }
    const hints = { memory: 'memoryHint', color: 'colorHint', math: 'mathHint', 'alphabet-pop': 'alphabetHint', 'dinosaur-colors': 'dinosaurColorsHint', 'vehicle-parking': 'vehicleHint', 'shape-workshop': 'shapeWorkshopHint', 'pattern-train': 'patternTrainHint', 'story-garden': 'storyGardenHint' };
    document.getElementById('game-hint').textContent = t[hints[this.activeGameId]] || '';
  }

  /* ── Shared toast notifications ── */
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
      this.screens[key].inert = key !== name;
    });

    const t = this.T[this.lang];
    if (name === 'game') {
      this.hud.backBtn.classList.remove('hidden');
    } else {
      this.hud.backBtn.classList.add('hidden');
      this.hud.title.textContent = t.appTitle;
    }
    document.dispatchEvent(new Event('explorer-screen-change'));
  }

  /* ── Launch a game ── */
  launchGame(gameId) {
    if (this.activeGame) this.activeGame.destroy();
    audio.setDashboardActive(false);
    this.activeGameId = gameId;
    document.body.dataset.game = gameId;
    this.showScreen('game');

    const stage = document.getElementById('game-stage');
    stage.innerHTML = '';

    // Reset the in-game HUD so a previous game's score never leaks into a new one
    const scoreVal = document.getElementById('score-val');
    if (scoreVal) scoreVal.textContent = '0';
    const timerEl = document.getElementById('game-timer');
    if (timerEl) timerEl.classList.add('hidden');

    // Games without a numeric score hide the in-game dashboard entirely
    const SCORELESS_GAMES = ['color', 'dinosaur-colors'];
    const dashboard = document.getElementById('game-dashboard');
    if (dashboard) {
      dashboard.style.display = SCORELESS_GAMES.includes(gameId) ? 'none' : 'flex';
    }

    const t = this.T[this.lang];

    switch (gameId) {
      case 'memory':
        this.hud.title.textContent = t.memoryName;
        this.activeGame = new MemoryJungle(stage, this);
        break;
      case 'color':
        this.hud.title.textContent = t.colorName;
        this.activeGame = new ColorMixLab(stage, this);
        break;
      case 'alphabet-pop':
        this.hud.title.textContent = t.alphabetPopName;
        this.activeGame = new AlphabetPop(stage, this);
        break;
      case 'dinosaur-colors':
        this.hud.title.textContent = t.dinosaurColorsName;
        this.activeGame = new DinosaurColors(stage, this);
        break;
      case 'math':
        this.hud.title.textContent = t.mathName;
        this.activeGame = new FruitMarket(stage, this);
        break;
      case 'vehicle-parking':
        this.hud.title.textContent = t.vehicleParkingName;
        this.activeGame = new VehicleParking(stage, this);
        break;
      case 'shape-workshop':
        this.hud.title.textContent = t.shapeWorkshopName;
        this.activeGame = new ShapeWorkshop(stage, this);
        break;
      case 'pattern-train':
        this.hud.title.textContent = t.patternTrainName;
        this.activeGame = new PatternTrain(stage, this);
        break;
      case 'story-garden':
        this.hud.title.textContent = t.storyGardenName;
        this.activeGame = new StoryGarden(stage, this);
        break;
      default:
        // Unknown / unimplemented game – go back to dashboard
        console.warn('Game not implemented:', gameId);
        this.showScreen('dashboard');
        return;
    }

    this.activeGame.start();
    this.applyLang();
    this.hud.backBtn.focus({ preventScroll: true });
  }

  /* ── Close active game ── */
  closeActiveGame() {
    const previousGame = this.activeGameId;
    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }
    this.activeGameId = '';
    audio.setDashboardActive(true);
    delete document.body.dataset.game;
    this.showScreen('dashboard');
    document.querySelector(`[data-game="${previousGame}"]`)?.focus({ preventScroll: true });
    if (this.pendingAppUpdate) { this.pendingAppUpdate = false; window.location.reload(); }
  }

  /* ── Persist game rewards and update the HUD ── */
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
