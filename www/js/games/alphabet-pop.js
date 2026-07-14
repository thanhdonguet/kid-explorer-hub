/* ================================================================
   Alphabet Pop Game (Bong Bóng Chữ Cái)
   ================================================================ */

class AlphabetPop {
  constructor(container, appCtrl) {
    this.container = container;
    this.appCtrl = appCtrl;
    this.lang = appCtrl.lang;

    // Game state
    this.currentScreen = 1; // 1: Alphabet board, 2: Gameplay
    this.selectedLetter = null;
    this.currentThemeIndex = 0;
    
    // 14 Themes setup (CSS animation classes will correspond to these)
    this.themes = [
      'theme-balloon', 'theme-rocket', 'theme-cloud', 'theme-cat',
      'theme-star', 'theme-bubble', 'theme-frog', 'theme-bird',
      'theme-leaf', 'theme-fish', 'theme-ghost', 'theme-car',
      'theme-flower', 'theme-ufo'
    ];

    // Vocabulary DB
    this.VOCAB_DB = {
      'A': [{ word: 'Apple', image: 'img/vocab/a.png' }],
      'B': [{ word: 'Bear', image: 'img/vocab/b.png' }],
      'C': [{ word: 'Cat', image: 'img/vocab/c.png' }],
      'D': [{ word: 'Dog', image: 'img/vocab/d.png' }],
      'E': [{ word: 'Elephant', image: 'img/vocab/e.png' }],
      'F': [{ word: 'Fox', image: 'img/vocab/f.png' }],
      'G': [{ word: 'Giraffe', image: 'img/vocab/g.png' }],
      'H': [{ word: 'Horse', image: 'img/vocab/h.png' }],
      'I': [{ word: 'Ice cream', image: 'img/vocab/i.png' }],
      'J': [{ word: 'Jellyfish', image: 'img/vocab/j.png' }],
      'K': [{ word: 'Kangaroo', image: 'img/vocab/k.svg' }],
      'L': [{ word: 'Lion', image: 'img/vocab/l.svg' }],
      'M': [{ word: 'Monkey', image: 'img/vocab/m.svg' }],
      'N': [{ word: 'Nest', image: 'img/vocab/n.svg' }],
      'O': [{ word: 'Owl', image: 'img/vocab/o.svg' }],
      'P': [{ word: 'Pig', image: 'img/vocab/p.svg' }],
      'Q': [{ word: 'Queen', image: 'img/vocab/q.svg' }],
      'R': [{ word: 'Rabbit', image: 'img/vocab/r.svg' }],
      'S': [{ word: 'Snake', image: 'img/vocab/s.svg' }],
      'T': [{ word: 'Tiger', image: 'img/vocab/t.svg' }],
      'U': [{ word: 'Umbrella', image: 'img/vocab/u.svg' }],
      'V': [{ word: 'Violin', image: 'img/vocab/v.svg' }],
      'W': [{ word: 'Whale', image: 'img/vocab/w.svg' }],
      'X': [{ word: 'X-ray', image: 'img/vocab/x.svg' }],
      'Y': [{ word: 'Yak', image: 'img/vocab/y.svg' }],
      'Z': [{ word: 'Zebra', image: 'img/vocab/z.svg' }]
    };

    // Synthesizer for TTS
    this.synth = window.speechSynthesis;
  }

  start() {
    this.renderScreen1();
  }

  destroy() {
    this.container.innerHTML = '';
    this.synth.cancel(); // Stop any reading
  }

  updateLanguage(lang, T) {
    this.lang = lang;
  }

  /* ── Text-to-Speech Helper ── */
  speak(text) {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Always read in English for alphabet/vocab
    utterance.rate = 0.9;
    this.synth.speak(utterance);
  }

  /* ── Screen 1: Alphabet Board ── */
  renderScreen1() {
    this.currentScreen = 1;
    this.container.innerHTML = `
      <div id="alphabet-board" class="ap-board">
        <h2 class="ap-title">Choose a Letter!</h2>
        <div class="ap-grid"></div>
      </div>
    `;

    const grid = this.container.querySelector('.ap-grid');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    letters.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'ap-letter-btn';
      btn.textContent = letter;
      btn.addEventListener('click', () => {
        // Highlight logic and TTS
        this.speak(letter);
        // Add effect, then transition to Screen 2
        btn.classList.add('ap-selected');
        setTimeout(() => {
          this.selectedLetter = letter;
          this.renderScreen2();
        }, 1000); // wait for voice and animation
      });
      grid.appendChild(btn);
    });
  }

  /* ── Screen 2: Gameplay ── */
  renderScreen2() {
    this.currentScreen = 2;
    this.currentThemeIndex = Math.floor(Math.random() * this.themes.length);
    const themeClass = this.themes[this.currentThemeIndex];

    this.container.innerHTML = `
      <div id="alphabet-play" class="ap-play-area ${themeClass}">
        <button class="ap-back-btn" aria-label="Back to Board">⬅️</button>
        <div class="ap-objects-container"></div>
      </div>
    `;

    this.container.querySelector('.ap-back-btn').addEventListener('click', () => {
      this.renderScreen1();
    });

    this.spawnObjects();
  }

  spawnObjects() {
    const container = this.container.querySelector('.ap-objects-container');
    container.innerHTML = ''; // clear old

    const objectsCount = 10;
    const correctIndex = Math.floor(Math.random() * objectsCount);
    this.activeObjects = [];

    for (let i = 0; i < objectsCount; i++) {
      const isCorrect = (i === correctIndex);
      const objEl = document.createElement('div');
      objEl.className = 'ap-flying-object';
      
      // Random starting positions and animations
      const startX = Math.random() * 80 + 10; // 10% to 90%
      const startY = Math.random() * 80 + 10;
      objEl.style.left = `${startX}%`;
      objEl.style.top = `${startY}%`;
      objEl.style.animationDelay = `${Math.random() * 2}s`;
      
      // We use a pseudo-element or an img child for the visual
      const visualEl = document.createElement('div');
      visualEl.className = 'ap-object-visual';
      
      const themeImg = document.createElement('img');
      themeImg.src = `img/themes/${themeClass.replace('theme-', '')}.svg`;
      themeImg.className = 'ap-theme-icon';
      themeImg.onerror = () => { themeImg.style.display = 'none'; }; // fallback if theme SVG fails
      visualEl.appendChild(themeImg);

      objEl.appendChild(visualEl);

      if (isCorrect) {
        const textEl = document.createElement('span');
        textEl.className = 'ap-object-text';
        textEl.textContent = this.selectedLetter;
        objEl.appendChild(textEl);
      }

      objEl.addEventListener('click', () => this.handleObjectClick(objEl, isCorrect));
      
      container.appendChild(objEl);
      this.activeObjects.push(objEl);
    }
  }

  handleObjectClick(element, isCorrect) {
    if (element.classList.contains('ap-popped')) return;

    element.classList.add('ap-popped'); // Trigger disappear animation
    if (typeof audio !== 'undefined' && audio.playPop) audio.playPop();

    if (isCorrect) {
      this.speak(this.selectedLetter);
      
      // Pop all others
      this.activeObjects.forEach(obj => {
        if (obj !== element) obj.classList.add('ap-popped');
      });

      // Show vocab picture after pop
      setTimeout(() => {
        this.showVocabResult();
      }, 600);
    } else {
      // Just empty, it disappears.
      if (typeof audio !== 'undefined' && audio.playMiss) audio.playMiss();
    }
  }

  showVocabResult() {
    const vocabList = this.VOCAB_DB[this.selectedLetter];
    const vocabItem = vocabList[Math.floor(Math.random() * vocabList.length)];
    
    const resultEl = document.createElement('div');
    resultEl.className = 'ap-vocab-result';
    
    // Instead of using missing images right away, use a fallback emoji or text if img fails
    resultEl.innerHTML = `
      <div class="ap-vocab-image-container">
        <img src="${vocabItem.image}" alt="${vocabItem.word}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="ap-vocab-placeholder" style="display:none;">${this.selectedLetter}</div>
      </div>
      <div class="ap-vocab-text">${vocabItem.word}</div>
    `;

    resultEl.addEventListener('click', () => {
      this.speak(vocabItem.word);
      // pop animation
      resultEl.style.transform = 'scale(1.1)';
      setTimeout(() => resultEl.style.transform = 'scale(1)', 200);
    });

    this.container.querySelector('.ap-play-area').appendChild(resultEl);
    
    // Play voice and cheer
    setTimeout(() => {
      this.speak(vocabItem.word);
      if (typeof audio !== 'undefined' && audio.playCheer) audio.playCheer();
    }, 500);
  }
}
