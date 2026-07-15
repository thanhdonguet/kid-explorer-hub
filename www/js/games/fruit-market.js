/* Fruit Market Game */
class FruitMarket {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.lang = app.lang || 'vi';
    this.T = app.T[this.lang];
    
    this.score = 0;
    this.targetScore = 5;
    
    this.targetCount = 0;
    this.currentCount = 0;
    
    this.currentLevel = null;
    this.activeFruits = [];
    
    this.fruitTypes = [
      'apple', 'banana', 'orange', 'lemon', 'grapes', 
      'watermelon', 'peach', 'pear', 'avocado', 'pineapple'
    ];
    
    // Level config
    this.levels = {
      easy: { min: 1, max: 3, spawnCount: 5 },
      medium: { min: 1, max: 5, spawnCount: 7 },
      hard: { min: 1, max: 10, spawnCount: 10 }
    };
  }

  start() {
    this.score = 0;
    this.startLevel('hard');
  }

  updateHUD() {
    const scoreVal = document.getElementById('score-val');
    if (scoreVal) {
      scoreVal.textContent = `${this.score}/${this.targetScore}`;
    }
  }

  updateLanguage(lang, T) {
    this.lang = lang;
    this.T = T;
  }

  speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this.lang === 'vi' ? 'vi-VN' : 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  renderLevelSelect() {
    // Removed level select
  }

  startLevel(level) {
    this.currentLevel = level;
    this.score = 0;
    this.updateHUD();
    
    this.container.innerHTML = `
      <div id="fruit-market-container" class="fm-gameplay">
        <div class="fm-bear-area">
          <div class="fm-number-sign" id="fm-target-number">?</div>
          <div class="fm-bear">🐻</div>
          <div class="fm-basket-wrapper">
            <div class="fm-basket" id="fm-basket">
              <div class="fm-basket-back"></div>
              <div class="fm-basket-content" id="fm-basket-content"></div>
              <div class="fm-basket-front"></div>
            </div>
            <div class="fm-basket-dropzone" id="fm-basket-dropzone"></div>
          </div>
        </div>
        <div class="fm-fruit-area" id="fm-fruit-area"></div>
      </div>
    `;

    this.generateQuestion();
  }

  generateQuestion() {
    const config = this.levels[this.currentLevel];
    this.targetCount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    this.currentCount = 0;
    this.currentFruitType = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
    
    document.getElementById('fm-target-number').textContent = this.targetCount;
    document.getElementById('fm-basket-content').innerHTML = '';
    
    this.renderFruits();
  }

  renderFruits() {
    const fruitArea = document.getElementById('fm-fruit-area');
    if (!fruitArea) return;
    fruitArea.innerHTML = '';
    this.activeFruits = [];

    const config = this.levels[this.currentLevel];
    
    for (let i = 0; i < config.spawnCount; i++) {
      const fruitEl = document.createElement('div');
      fruitEl.className = 'fm-fruit';
      fruitEl.innerHTML = `<img src="img/vocab/${this.currentFruitType}.svg" alt="fruit" draggable="false">`;
      
      // Random position (avoid edges too tightly)
      const topPct = 10 + Math.random() * 70;
      const leftPct = 10 + Math.random() * 70;
      fruitEl.style.top = topPct + '%';
      fruitEl.style.left = leftPct + '%';
      
      // Random float delay
      fruitEl.style.animationDelay = (Math.random() * 2) + 's';

      fruitEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleFruitTap(fruitEl);
      });

      fruitArea.appendChild(fruitEl);
      this.activeFruits.push(fruitEl);
    }
  }

  handleFruitTap(fruitEl) {
    if (fruitEl.classList.contains('fm-dropping')) return;
    
    if (typeof audio !== 'undefined' && audio.playPop) audio.playPop();
    fruitEl.classList.add('fm-dropping');
    
    // Animate to basket
    const dropzone = document.getElementById('fm-basket-dropzone');
    if (dropzone) {
      const dzRect = dropzone.getBoundingClientRect();
      const fRect = fruitEl.getBoundingClientRect();
      
      const dx = dzRect.left + dzRect.width/2 - (fRect.left + fRect.width/2);
      const dy = dzRect.top + dzRect.height/2 - (fRect.top + fRect.height/2);
      
      fruitEl.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`;
      fruitEl.style.opacity = '0';
    }
    
    setTimeout(() => {
      if (fruitEl.parentNode) fruitEl.parentNode.removeChild(fruitEl);
      this.currentCount++;
      this.speak(this.currentCount.toString());
      
      // Add mini fruit to basket content
      const basketContent = document.getElementById('fm-basket-content');
      if (basketContent) {
        const mini = document.createElement('img');
        mini.src = `img/vocab/${this.currentFruitType}.svg`;
        mini.className = 'fm-mini-fruit';
        basketContent.appendChild(mini);
      }
      
      this.checkWin();
    }, 400); // sync with css drop animation
  }

  checkWin() {
    if (this.currentCount === this.targetCount) {
      // Correct!
      if (typeof audio !== 'undefined' && audio.playSuccess) audio.playSuccess();
      const bear = document.querySelector('.fm-bear');
      if (bear) bear.classList.add('fm-bear-jump');
      
      this.score++;
      this.updateHUD();
      
      setTimeout(() => {
        if (bear) bear.classList.remove('fm-bear-jump');
        
        if (this.score >= this.targetScore) {
          this.showWinScreen();
        } else {
          this.showNextQuestion();
        }
      }, 1500);
      
    } else if (this.currentCount > this.targetCount) {
      // Over count
      const msg = this.lang === 'vi' ? 'Nhiều quá rồi!' : 'Too many!';
      this.speak(msg);
      if (typeof audio !== 'undefined' && audio.playFail) audio.playFail();
      
      const basket = document.getElementById('fm-basket');
      if (basket) {
        basket.classList.add('fm-basket-shake');
        setTimeout(() => basket.classList.remove('fm-basket-shake'), 500);
      }
      
      this.resetBasket();
    }
  }

  resetBasket() {
    setTimeout(() => {
      this.currentCount = 0;
      const basketContent = document.getElementById('fm-basket-content');
      if (basketContent) basketContent.innerHTML = '';
      this.renderFruits(); // Respawn fruits
    }, 800);
  }

  showNextQuestion() {
    const area = document.getElementById('fm-fruit-area');
    if (area) {
      area.style.opacity = '0';
      setTimeout(() => {
        area.style.opacity = '1';
        this.generateQuestion();
      }, 400);
    }
  }

  showWinScreen() {
    if (typeof audio !== 'undefined' && audio.playCheer) audio.playCheer();
    this.app.winGame(10);
    
    const overlay = document.createElement('div');
    overlay.className = 'fm-win-overlay';
    
    const winMsg = this.lang === 'vi' ? '🎉 Tuyệt vời!' : '🎉 Great Job!';
    const btnReplay = this.lang === 'vi' ? 'Chơi Lại' : 'Play Again';
    const btnBack = this.lang === 'vi' ? 'Về Đảo' : 'Back to Island';
    
    overlay.innerHTML = `
      <div class="fm-win-box">
        <h2>${winMsg}</h2>
        <div class="comp-actions">
          <button class="btn-primary" id="fm-btn-replay">${btnReplay}</button>
          <button class="btn-secondary" id="fm-btn-back">${btnBack}</button>
        </div>
      </div>
    `;
    
    this.container.appendChild(overlay);
    
    document.getElementById('fm-btn-replay').addEventListener('click', () => {
      overlay.remove();
      this.currentLevel = null;
      this.start();
    });
    
    document.getElementById('fm-btn-back').addEventListener('click', () => {
      this.app.closeActiveGame();
    });
  }

  destroy() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.container.innerHTML = '';
  }
}
