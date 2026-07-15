class DinosaurColors {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    
    // Config
    this.rounds = [
      { fruit: 'banana', color: '#FFD700', speech: "Eating the banana turned me yellow!", audioKey: 'banana' },
      { fruit: 'peach', color: '#FF8FAB', speech: "Eating the peach turned me pink!", audioKey: 'peach' },
      { fruit: 'tomato', color: '#E53935', speech: "Eating the tomato turned me red!", audioKey: 'tomato' },
      { fruit: 'cucumber', color: '#43A047', speech: "Eating the cucumber turned me green!", audioKey: 'cucumber' },
      { fruit: 'grapes', color: '#7B1FA2', speech: "Eating the grapes turned me purple!", audioKey: 'grapes' },
      { fruit: 'orange', color: '#FB8C00', speech: "Eating the orange turned me orange!", audioKey: 'orange' }
    ];
    this.currentRound = 0;
    this.lang = this.app.lang || 'vi';
    
    this.T_inline = {
      vi: {
        introText: "Đói quá! Tớ đi tìm đồ ăn đây.",
        feedBtn: "Cho ăn nào! 🍽️",
        fullText: "Ăn no rồi! 🤩",
        replayBtn: "Chơi Lại",
        backBtn: "Về Đảo"
      },
      en: {
        introText: "I'm so hungry! I'm going to find some food!",
        feedBtn: "Feed me! 🍽️",
        fullText: "I'm so full! 🤩",
        replayBtn: "Play Again",
        backBtn: "Back to Island"
      }
    };

    // Clean container
    this.container.innerHTML = '';
    
    // Main layout
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'dino-game-container';
    this.container.appendChild(this.wrapper);
    
    // Default color
    document.documentElement.style.setProperty('--dino-body-color', '#9E9E9E');
  }

  start() {
    this.showIntroScreen();
  }

  getT() {
    return this.T_inline[this.lang];
  }

  updateLanguage(lang, T) {
    this.lang = lang;
    const t = this.getT();
    const introText = this.wrapper.querySelector('.dino-intro-text');
    if (introText) introText.textContent = t.introText;
    const feedBtn = this.wrapper.querySelector('.dino-feed-btn');
    if (feedBtn) feedBtn.textContent = t.feedBtn;
    const fullText = this.wrapper.querySelector('.dino-full-text');
    if (fullText) fullText.textContent = t.fullText;
    const replayBtn = this.wrapper.querySelector('.dino-replay-btn');
    if (replayBtn) replayBtn.textContent = t.replayBtn;
    const backBtn = this.wrapper.querySelector('.dino-back-btn');
    if (backBtn) backBtn.textContent = t.backBtn;
  }

  createDinoSVG() {
    return `
      <svg class="dino-svg" viewBox="0 0 200 200" width="100%" height="100%">
        <!-- Body Layer -->
        <g class="dino-body">
          <path class="dino-body-path" d="M 90 40 C 130 35, 165 40, 165 65 C 165 85, 140 100, 120 100 C 110 100, 100 110, 100 130 C 100 155, 130 155, 130 175 C 130 185, 125 195, 110 195 L 90 195 C 85 195, 80 185, 85 175 C 80 180, 75 195, 65 195 L 45 195 C 40 195, 30 180, 40 165 C 30 160, 25 145, 35 135 C 45 145, 55 140, 60 120 C 65 90, 65 70, 70 50 C 75 35, 80 35, 90 40 Z" />
        </g>
        
        <!-- Details Layer -->
        <g class="dino-details">
          <!-- Spikes -->
          <path d="M 85 40 L 75 25 L 75 42 Z" fill="#555" />
          <path d="M 72 45 L 60 30 L 68 52 Z" fill="#555" />
          <path d="M 66 58 L 50 48 L 62 68 Z" fill="#555" />
          <path d="M 60 75 L 45 70 L 58 85 Z" fill="#555" />
          <path d="M 57 95 L 40 95 L 56 105 Z" fill="#555" />
          <path d="M 55 112 L 38 120 L 52 120 Z" fill="#555" />
          <path d="M 48 125 L 30 135 L 42 135 Z" fill="#555" />
          
          <!-- White Belly -->
          <ellipse cx="105" cy="150" rx="20" ry="30" fill="#fff" transform="rotate(-15 105 150)" />
          
          <!-- Eyes -->
          <circle cx="105" cy="65" r="14" fill="#fff" />
          <circle cx="110" cy="65" r="5" fill="#333" />
          <circle cx="130" cy="68" r="16" fill="#fff" />
          <circle cx="135" cy="68" r="6" fill="#333" />
          
          <!-- Mouth -->
          <path d="M 120 95 C 130 90, 140 85, 155 80" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round" />
          
          <!-- Tongue (hidden by default) -->
          <path class="dino-tongue" d="M 130 90 C 120 120, 145 125, 145 100 C 145 95, 140 90, 140 85 Z" fill="#FF5722" opacity="0" />
          
          <!-- Arms -->
          <g fill="none" stroke="#555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M 115 145 L 130 142 L 135 138 M 130 142 L 136 143 M 130 142 L 133 148" />
            <path d="M 90 140 L 80 135 L 75 130 M 80 135 L 75 136 M 80 135 L 77 142" />
          </g>
          
          <!-- Toes -->
          <path d="M 108 195 A 3 3 0 0 0 102 195 Z" fill="#555" />
          <path d="M 101 195 A 3 3 0 0 0 95 195 Z" fill="#555" />
          <path d="M 94 195 A 3 3 0 0 0 88 195 Z" fill="#555" />
          
          <path d="M 63 195 A 3 3 0 0 0 57 195 Z" fill="#555" />
          <path d="M 56 195 A 3 3 0 0 0 50 195 Z" fill="#555" />
          <path d="M 49 195 A 3 3 0 0 0 43 195 Z" fill="#555" />
        </g>
      </svg>
    `;
  }

  showIntroScreen() {
    this.wrapper.innerHTML = '';
    document.documentElement.style.setProperty('--dino-body-color', '#9E9E9E');
    
    const t = this.getT();
    
    const introDiv = document.createElement('div');
    introDiv.className = 'dino-intro-screen';
    
    const dinoContainer = document.createElement('div');
    dinoContainer.className = 'dino-stage dino-wiggle';
    dinoContainer.innerHTML = this.createDinoSVG();
    
    const bubble = document.createElement('div');
    bubble.className = 'dino-bubble intro-bubble';
    bubble.textContent = 'Ọc! Ọc!';
    dinoContainer.appendChild(bubble);

    const textEl = document.createElement('h2');
    textEl.className = 'dino-intro-text';
    textEl.textContent = t.introText;
    
    const feedBtn = document.createElement('button');
    feedBtn.className = 'btn-primary dino-feed-btn';
    feedBtn.textContent = t.feedBtn;
    
    feedBtn.addEventListener('click', () => {
      audio.playTap();
      this.startGame();
    });

    introDiv.appendChild(dinoContainer);
    introDiv.appendChild(textEl);
    introDiv.appendChild(feedBtn);
    
    this.wrapper.appendChild(introDiv);
    
    this.speak("I'm so hungry! I'm going to find some food!", "intro");
  }

  startGame() {
    this.currentRound = 0;
    this.showRound(this.currentRound);
  }

  showRound(index) {
    if (index >= this.rounds.length) {
      this.showFullScreen();
      return;
    }
    
    const roundInfo = this.rounds[index];
    this.wrapper.innerHTML = '';
    
    const gameDiv = document.createElement('div');
    gameDiv.className = 'dino-game-screen';
    
    // Left: Dino
    const dinoStage = document.createElement('div');
    dinoStage.className = 'dino-stage';
    dinoStage.innerHTML = this.createDinoSVG();
    
    const speechBubble = document.createElement('div');
    speechBubble.className = 'dino-speech-bubble hidden';
    dinoStage.appendChild(speechBubble);
    
    // Right: Fruit
    const fruitDisplay = document.createElement('div');
    fruitDisplay.className = 'fruit-display';
    
    const fruitImg = document.createElement('img');
    fruitImg.src = `img/vocab/${roundInfo.fruit}.svg`;
    fruitImg.className = 'fruit-item bounce-in';
    
    fruitDisplay.appendChild(fruitImg);
    
    // Make sure touch/click are handled well
    const tapHandler = (e) => {
      e.preventDefault();
      this.handleFruitTap(fruitImg, index);
    };
    
    fruitImg.addEventListener('click', tapHandler);
    fruitImg.addEventListener('touchstart', tapHandler, {passive: false});
    
    gameDiv.appendChild(dinoStage);
    gameDiv.appendChild(fruitDisplay);
    this.wrapper.appendChild(gameDiv);
  }

  handleFruitTap(fruitImg, index) {
    if (this.isEating) return;
    this.isEating = true;
    
    const roundInfo = this.rounds[index];
    
    audio.playTap();
    
    fruitImg.classList.remove('bounce-in');
    fruitImg.classList.add('fruit-slide-anim');
    
    const tongue = this.wrapper.querySelector('.dino-tongue');
    if (tongue) tongue.setAttribute('opacity', '1');
    
    setTimeout(() => {
      fruitImg.style.display = 'none';
      if (tongue) tongue.setAttribute('opacity', '0');
      
      this.changeDinoColor(roundInfo.color);
      
      this.showSpeechBubble(roundInfo.speech);
      this.speak(roundInfo.speech, roundInfo.audioKey);
      
      const dinoSvg = this.wrapper.querySelector('.dino-svg');
      if (dinoSvg) dinoSvg.classList.add('dino-jump-anim');
      
      setTimeout(() => {
        this.isEating = false;
        this.showRound(index + 1);
      }, 3000);
      
    }, 600);
  }

  changeDinoColor(hexColor) {
    document.documentElement.style.setProperty('--dino-body-color', hexColor);
  }

  speak(text, audioKey) {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    
    // Sử dụng file audio cố định để có giọng đều và ổn định
    // Tăng playbackRate để tạo ra chất giọng the thé của trẻ con / chipmunk
    if (audioKey) {
      const audio = new Audio(`audio/dino/${audioKey}.mp3`);
      audio.playbackRate = 1.35; 
      audio.play().catch(e => console.warn('Audio play failed:', e));
      this.currentAudio = audio;
      return;
    }

    // Fallback nếu không có audio file
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'en-US';
      msg.pitch = 2.0;
      msg.rate = 1.1;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen')));
      if (preferredVoice) {
        msg.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(msg);
    }
  }

  showSpeechBubble(text) {
    const bubble = this.wrapper.querySelector('.dino-speech-bubble');
    if (bubble) {
      bubble.textContent = text;
      bubble.classList.remove('hidden');
      bubble.classList.add('bubble-pop-anim');
    }
  }

  showFullScreen() {
    this.wrapper.innerHTML = '';
    const t = this.getT();
    
    const fullDiv = document.createElement('div');
    fullDiv.className = 'dino-full-screen';
    
    const dinoContainer = document.createElement('div');
    dinoContainer.className = 'dino-stage dino-belly-grow';
    dinoContainer.innerHTML = this.createDinoSVG();
    
    const textEl = document.createElement('h2');
    textEl.className = 'dino-full-text';
    textEl.textContent = t.fullText;
    
    const btnsDiv = document.createElement('div');
    btnsDiv.className = 'dino-actions';
    
    const replayBtn = document.createElement('button');
    replayBtn.className = 'btn-primary dino-replay-btn';
    replayBtn.textContent = t.replayBtn;
    replayBtn.addEventListener('click', () => {
      audio.playTap();
      this.resetGame();
    });
    
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary dino-back-btn';
    backBtn.textContent = t.backBtn;
    backBtn.addEventListener('click', () => {
      audio.playTap();
      this.app.closeActiveGame();
    });
    
    btnsDiv.appendChild(replayBtn);
    btnsDiv.appendChild(backBtn);
    
    fullDiv.appendChild(dinoContainer);
    fullDiv.appendChild(textEl);
    fullDiv.appendChild(btnsDiv);
    
    this.wrapper.appendChild(fullDiv);
    
    this.createConfetti(fullDiv);
    
    this.speak("I ate everything! I'm so full! Burp!", "full");
    
    this.app.addStars(10);
  }

  createConfetti(container) {
    const colors = ['#FFD700', '#FF8FAB', '#E53935', '#43A047', '#7B1FA2', '#FB8C00'];
    for(let i=0; i<30; i++) {
      const c = document.createElement('div');
      c.className = 'dino-confetti';
      c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      c.style.left = Math.random() * 100 + '%';
      c.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(c);
    }
  }

  resetGame() {
    this.showIntroScreen();
  }

  destroy() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    document.documentElement.style.removeProperty('--dino-body-color');
    this.container.innerHTML = '';
  }
}
