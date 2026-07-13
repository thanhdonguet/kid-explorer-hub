/* Central Application Router & State Manager */
class AppController {
  constructor() {
    this.stars = parseInt(localStorage.getItem('kid_explorer_stars')) || 0;
    this.activeGame = null;
    this.activeGameId = '';
    
    // UI Cache
    this.screens = {
      dashboard: document.getElementById('dashboard-screen'),
      game: document.getElementById('game-screen')
    };
    this.hud = {
      backBtn: document.getElementById('btn-back'),
      soundBtn: document.getElementById('btn-sound'),
      soundOnIcon: document.getElementById('sound-on-icon'),
      soundOffIcon: document.getElementById('sound-off-icon'),
      starCount: document.getElementById('star-count'),
      title: document.getElementById('app-title-hud')
    };
    this.victoryModal = document.getElementById('victory-modal');
    this.victoryNextBtn = document.getElementById('btn-next-action');
    this.victoryStarsRewardVal = document.getElementById('star-reward-count');
  }

  init() {
    // 1. Render Initial HUD
    this.hud.starCount.textContent = this.stars;

    // 2. Attach Global Event Listeners
    // Island clicks
    document.querySelectorAll('.island-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game');
        audio.playTap();
        this.launchGame(gameId);
      });
    });

    // Back button
    this.hud.backBtn.addEventListener('click', () => {
      audio.playTap();
      this.closeActiveGame();
    });

    // Sound toggle
    this.hud.soundBtn.addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      audio.playTap();
      if (isMuted) {
        this.hud.soundOnIcon.classList.add('hidden');
        this.hud.soundOffIcon.classList.remove('hidden');
      } else {
        this.hud.soundOnIcon.classList.remove('hidden');
        this.hud.soundOffIcon.classList.add('hidden');
      }
    });

    // Next game action button inside victory overlay
    this.victoryNextBtn.addEventListener('click', () => {
      audio.playTap();
      this.hideVictory();
      this.closeActiveGame();
    });

    // Service Worker Registration for PWA Capabilities
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((reg) => {
          console.log('Service Worker registered successfully!', reg.scope);
        }).catch((err) => {
          console.warn('Service Worker registration failed: ', err);
        });
      });
    }

    // Audio Context unlock listener
    document.body.addEventListener('click', () => {
      audio.resume();
    }, { once: true });
  }

  // Routing: Switch Screen helper
  showScreen(screenName) {
    Object.keys(this.screens).forEach(key => {
      if (key === screenName) {
        this.screens[key].classList.add('active');
      } else {
        this.screens[key].classList.remove('active');
      }
    });

    if (screenName === 'game') {
      this.hud.backBtn.classList.remove('hidden');
    } else {
      this.hud.backBtn.classList.add('hidden');
      this.hud.title.textContent = "Đảo Khám Phá";
    }
  }

  // Load and start game
  launchGame(gameId) {
    this.activeGameId = gameId;
    this.showScreen('game');

    const stage = document.getElementById('game-stage');
    stage.innerHTML = ''; // Reset container

    // Load specific game module
    switch(gameId) {
      case 'math':
        this.hud.title.textContent = "Bóng Bay Toán Học";
        this.activeGame = new MathAdventure(stage, this);
        break;
      case 'spelling':
        this.hud.title.textContent = "Thám Hiểm Từ Vựng";
        this.activeGame = new SpellingQuest(stage, this);
        break;
      case 'drawing':
        this.hud.title.textContent = "Vương Quốc Cọ Vẽ";
        this.activeGame = new MagicCanvas(stage, this);
        break;
      case 'memory':
        this.hud.title.textContent = "Khu Rừng Trí Nhớ";
        this.activeGame = new MemoryJungle(stage, this);
        break;
    }

    if (this.activeGame) {
      this.activeGame.start();
    }
  }

  closeActiveGame() {
    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }
    this.activeGameId = '';
    
    // Hide game elements
    document.getElementById('game-timer').classList.add('hidden');
    document.getElementById('game-lives').classList.add('hidden');
    
    this.showScreen('dashboard');
  }

  // Win Event Handler
  winGame(starsEarned = 10) {
    // Play sound and increment stars
    audio.playCheer();
    this.stars += starsEarned;
    localStorage.setItem('kid_explorer_stars', this.stars);
    this.hud.starCount.textContent = this.stars;

    // Show Victory Overlay
    this.victoryStarsRewardVal.textContent = starsEarned;
    this.victoryModal.classList.remove('hidden');
    this.createConfetti();
  }

  hideVictory() {
    this.victoryModal.classList.add('hidden');
    const container = this.victoryModal.querySelector('.confetti-container');
    if (container) container.innerHTML = '';
  }

  // Visual Confetti explosion
  createConfetti() {
    const container = this.victoryModal.querySelector('.confetti-container');
    if (!container) return;
    
    const colors = ['#ff6b8b', '#4ecdc4', '#ffbe0b', '#a1c4fd', '#ff8da1', '#84fab0'];
    const numConfetti = 50;

    for (let i = 0; i < numConfetti; i++) {
      const el = document.createElement('div');
      el.classList.add('confetti');
      
      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 2 + Math.random() * 2;
      const size = 6 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      el.style.left = left + '%';
      el.style.animationDelay = delay + 's';
      el.style.animationDuration = duration + 's';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.backgroundColor = color;
      
      container.appendChild(el);
    }
  }
}

// Global App Initialization
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new AppController();
  app.init();
});
