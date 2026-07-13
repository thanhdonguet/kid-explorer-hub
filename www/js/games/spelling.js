/* Word Builder (Spelling Quest) Game */
class SpellingQuest {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.score = 0;
    this.targetScore = 3;
    this.currentWord = null;
    this.spelledLetters = []; // Letters currently placed in slots
    this.active = false;

    // Game Database with inline SVGs for premium rendering
    this.wordsDatabase = [
      {
        word: "SUN",
        vietnamese: "Mặt Trời",
        svg: `<svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="20" fill="#f59e0b" />
          <path d="M50 10 V22 M50 78 V90 M10 50 H22 M78 50 H90 M22 22 L30 30 M70 70 L78 78 M22 78 L30 70 M70 22 L78 30" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" />
        </svg>`
      },
      {
        word: "CAT",
        vietnamese: "Con Mèo",
        svg: `<svg viewBox="0 0 100 100">
          <!-- Ears -->
          <polygon points="25,35 15,10 40,25" fill="#f472b6" />
          <polygon points="75,35 85,10 60,25" fill="#f472b6" />
          <!-- Head -->
          <circle cx="50" cy="45" r="30" fill="#fbcfe8" />
          <!-- Eyes -->
          <circle cx="38" cy="40" r="4" fill="#2b2d42" />
          <circle cx="62" cy="40" r="4" fill="#2b2d42" />
          <!-- Nose & Whiskers -->
          <polygon points="50,48 46,44 54,44" fill="#f43f5e" />
          <path d="M40 50 Q30 52 20 48 M40 54 Q30 55 22 55 M60 50 Q70 52 80 48 M60 54 Q70 55 78 55" stroke="#f472b6" stroke-width="2" stroke-linecap="round" fill="none" />
        </svg>`
      },
      {
        word: "FISH",
        vietnamese: "Con Cá",
        svg: `<svg viewBox="0 0 100 100">
          <!-- Tail -->
          <polygon points="15,50 5,30 5,70" fill="#38bdf8" />
          <!-- Body -->
          <ellipse cx="55" cy="50" rx="30" ry="22" fill="#bae6fd" />
          <circle cx="70" cy="45" r="4" fill="#2b2d42" />
          <!-- Fins -->
          <polygon points="55,28 45,15 65,25" fill="#38bdf8" />
          <polygon points="55,72 45,85 65,75" fill="#38bdf8" />
        </svg>`
      },
      {
        word: "STAR",
        vietnamese: "Ngôi Sao",
        svg: `<svg viewBox="0 0 100 100">
          <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="#facc15" stroke="#eab308" stroke-width="2" stroke-linejoin="round" />
        </svg>`
      },
      {
        word: "FROG",
        vietnamese: "Con Ếch",
        svg: `<svg viewBox="0 0 100 100">
          <!-- Eyes base -->
          <circle cx="35" cy="35" r="12" fill="#4ade80" />
          <circle cx="65" cy="35" r="12" fill="#4ade80" />
          <!-- Eyes pupil -->
          <circle cx="35" cy="35" r="5" fill="#2b2d42" />
          <circle cx="65" cy="35" r="5" fill="#2b2d42" />
          <!-- Head/Body -->
          <ellipse cx="50" cy="55" rx="32" ry="24" fill="#4ade80" />
          <ellipse cx="50" cy="62" rx="20" ry="14" fill="#bbf7d0" />
          <!-- Smile -->
          <path d="M42 55 Q50 62 58 55" stroke="#166534" stroke-width="3" stroke-linecap="round" fill="none" />
        </svg>`
      }
    ];

    this.usedWords = [];
  }

  start() {
    this.active = true;
    this.score = 0;
    this.usedWords = [];
    this.updateHUD();

    // Set up game board
    this.container.innerHTML = `
      <div id="spelling-container">
        <div class="word-image-view" id="word-image"></div>
        <div class="slots-row" id="slots-container"></div>
        <div class="letters-pool" id="pool-container"></div>
      </div>
    `;

    this.nextWord();
  }

  updateHUD() {
    document.getElementById('score-val').textContent = `${this.score}/${this.targetScore}`;
  }

  nextWord() {
    this.spelledLetters = [];

    // Reset UI colors
    const slotsCont = document.getElementById('slots-container');
    if (slotsCont) slotsCont.style.transform = '';

    // Pick unique word
    let availableWords = this.wordsDatabase.filter(w => !this.usedWords.includes(w.word));
    if (availableWords.length === 0) {
      this.usedWords = []; // Recenter database
      availableWords = this.wordsDatabase;
    }

    const selected = availableWords[Math.floor(Math.random() * availableWords.length)];
    this.currentWord = selected;
    this.usedWords.push(selected.word);

    // 1. Draw SVG Image & tooltip
    const imgDiv = document.getElementById('word-image');
    imgDiv.innerHTML = selected.svg;
    imgDiv.setAttribute('title', selected.vietnamese);

    // 2. Draw slots
    const slotsContainer = document.getElementById('slots-container');
    slotsContainer.innerHTML = '';
    for (let i = 0; i < selected.word.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'letter-slot';
      slot.dataset.index = i;
      
      // Undo click helper
      slot.addEventListener('click', () => {
        this.undoLetter(i);
      });
      slotsContainer.appendChild(slot);
    }

    // 3. Draw Scrambled letters pool
    // Scramble letters + add 1-2 random letters
    const letters = selected.word.split('');
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const extraLettersCount = selected.word.length < 4 ? 2 : 1;
    
    for (let i = 0; i < extraLettersCount; i++) {
      let randChar = alphabet[Math.floor(Math.random() * alphabet.length)];
      // Make sure it doesn't match the word letters too much
      while (letters.includes(randChar)) {
        randChar = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      letters.push(randChar);
    }

    // Shuffle
    letters.sort(() => Math.random() - 0.5);

    const poolContainer = document.getElementById('pool-container');
    poolContainer.innerHTML = '';
    letters.forEach((char, idx) => {
      const letterBlock = document.createElement('div');
      letterBlock.className = 'letter-block';
      letterBlock.textContent = char;
      letterBlock.dataset.id = idx;

      letterBlock.addEventListener('click', () => {
        this.selectLetter(char, letterBlock);
      });

      poolContainer.appendChild(letterBlock);
    });
  }

  selectLetter(char, element) {
    if (!this.active) return;
    if (element.classList.contains('used')) return;

    // Find first empty slot
    const slots = document.querySelectorAll('.letter-slot');
    let emptyIdx = -1;
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].classList.contains('filled')) {
        emptyIdx = i;
        break;
      }
    }

    if (emptyIdx !== -1) {
      audio.playTap();

      // Mark pool block as used
      element.classList.add('used');

      // Place in slot
      const slot = slots[emptyIdx];
      slot.textContent = char;
      slot.classList.add('filled');
      slot.dataset.poolId = element.dataset.id; // Map back to undo later

      this.spelledLetters[emptyIdx] = {
        char: char,
        poolId: element.dataset.id
      };

      // Check spelling completion
      if (this.spelledLetters.filter(Boolean).length === this.currentWord.word.length) {
        this.checkSpelling();
      }
    }
  }

  undoLetter(slotIndex) {
    if (!this.active) return;
    
    const slot = document.querySelector(`.letter-slot[data-index="${slotIndex}"]`);
    if (!slot || !slot.classList.contains('filled')) return;

    audio.playTap();

    const letterInfo = this.spelledLetters[slotIndex];
    if (letterInfo) {
      // Find letter block in pool and restore it
      const poolBlock = document.querySelector(`.letter-block[data-id="${letterInfo.poolId}"]`);
      if (poolBlock) {
        poolBlock.classList.remove('used');
      }

      // Empty slot
      slot.textContent = '';
      slot.classList.remove('filled');
      delete slot.dataset.poolId;

      this.spelledLetters[slotIndex] = null;
    }
  }

  checkSpelling() {
    const spelledWord = this.spelledLetters.map(item => item.char).join('');
    const targetWord = this.currentWord.word;

    const slots = document.querySelectorAll('.letter-slot');

    if (spelledWord === targetWord) {
      // Correct!
      audio.playSuccess();
      
      slots.forEach(slot => {
        slot.style.borderColor = 'var(--secondary)';
        slot.style.backgroundColor = '#ecfdf5';
        slot.style.color = '#047857';
      });

      this.score++;
      this.updateHUD();

      // Disable inputs temporarily
      this.active = false;

      setTimeout(() => {
        if (this.score >= this.targetScore) {
          this.app.winGame(15);
        } else {
          this.active = true;
          this.nextWord();
        }
      }, 1500);

    } else {
      // Wrong!
      audio.playFail();

      // Color red
      slots.forEach(slot => {
        slot.style.borderColor = 'var(--primary)';
        slot.style.backgroundColor = '#fef2f2';
        slot.style.color = '#b91c1c';
      });

      // Shake animation
      const container = document.getElementById('slots-container');
      container.style.animation = 'none';
      // trigger reflow
      void container.offsetWidth;
      container.style.animation = 'shakeEffect 0.4s ease-in-out';

      // Reset slots after 1 second
      setTimeout(() => {
        if (!this.active) return;
        
        // Reset styles
        slots.forEach(slot => {
          slot.textContent = '';
          slot.classList.remove('filled');
          slot.style.borderColor = '';
          slot.style.backgroundColor = '';
          slot.style.color = '';
        });

        // Reset pool blocks
        document.querySelectorAll('.letter-block').forEach(block => {
          block.classList.remove('used');
        });

        container.style.animation = '';
        this.spelledLetters = [];
      }, 1000);
    }
  }

  destroy() {
    this.active = false;
    this.container.innerHTML = '';
  }
}
