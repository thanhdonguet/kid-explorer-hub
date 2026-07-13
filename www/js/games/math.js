/* Math Balloon Pop Game */
class MathAdventure {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.score = 0;
    this.targetScore = 5;
    this.currentQuestion = null;
    this.spawnInterval = null;
    this.gameLoopInterval = null;
    this.activeBalloons = [];
    this.active = false;
    this.colors = ['#ff6b8b', '#4ecdc4', '#ffbe0b', '#a1c4fd', '#ff8da1', '#84fab0', '#a78bfa'];
  }

  start() {
    this.active = true;
    this.score = 0;
    this.updateHUD();
    
    // Create Layout
    this.container.innerHTML = `
      <div id="math-container">
        <div id="math-question-bubble">? + ? = ?</div>
      </div>
    `;
    this.mathContainer = document.getElementById('math-container');

    // Generate first question
    this.nextQuestion();

    // Start spawn loop
    this.spawnInterval = setInterval(() => {
      if (this.active && this.activeBalloons.length < 5) {
        this.spawnBalloon();
      }
    }, 1500);

    // General game cleanup check (for out of screen balloons)
    this.gameLoopInterval = setInterval(() => {
      this.checkBalloons();
    }, 200);
  }

  updateHUD() {
    document.getElementById('score-val').textContent = `${this.score}/${this.targetScore}`;
  }

  nextQuestion() {
    // Generate simple sum
    const a = Math.floor(Math.random() * 8) + 1; // 1-8
    const b = Math.floor(Math.random() * 7) + 1; // 1-7
    const isAddition = Math.random() > 0.4;
    
    let questionText = '';
    let answer = 0;
    
    if (isAddition) {
      questionText = `${a} + ${b} = ?`;
      answer = a + b;
    } else {
      // Subtraction (make sure result >= 0)
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      questionText = `${max} - ${min} = ?`;
      answer = max - min;
    }

    this.currentQuestion = {
      text: questionText,
      answer: answer
    };

    document.getElementById('math-question-bubble').textContent = this.currentQuestion.text;
  }

  spawnBalloon() {
    if (!this.active) return;

    const balloon = document.createElement('div');
    balloon.className = 'balloon';

    // Set Random properties
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    balloon.style.backgroundColor = color;
    balloon.style.color = '#ffffff';

    const stageWidth = this.container.clientWidth || 800;
    const startX = 40 + Math.random() * (stageWidth - 140);
    balloon.style.left = startX + 'px';

    // Speed variance
    const speed = 6 + Math.random() * 4; // 6 to 10 seconds to cross the screen
    balloon.style.animationDuration = speed + 's';

    // Decide value (one balloon must be correct, or random)
    let value = 0;
    const isCorrect = Math.random() > 0.65 || !this.hasCorrectBalloon();
    
    if (isCorrect) {
      value = this.currentQuestion.answer;
      balloon.dataset.correct = "true";
    } else {
      // Generate incorrect answer near target
      let wrongVal = this.currentQuestion.answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
      if (wrongVal < 0) wrongVal = this.currentQuestion.answer + 2;
      value = wrongVal;
      balloon.dataset.correct = "false";
    }

    balloon.innerHTML = `${value}<div class="balloon-string"></div>`;

    // Click event
    balloon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.popBalloon(balloon);
    });

    this.mathContainer.appendChild(balloon);
    this.activeBalloons.push(balloon);
  }

  hasCorrectBalloon() {
    return this.activeBalloons.some(b => b.dataset.correct === "true");
  }

  popBalloon(balloon) {
    if (balloon.classList.contains('popping')) return;
    
    const isCorrect = balloon.dataset.correct === "true";
    
    if (isCorrect) {
      audio.playPop();
      balloon.classList.add('popping');
      audio.playSuccess();
      
      this.score++;
      this.updateHUD();

      // Clear popped balloon from array
      this.activeBalloons = this.activeBalloons.filter(b => b !== balloon);
      
      // Balloon animation takes 0.2s, wait and clean up
      setTimeout(() => {
        if (balloon.parentNode) balloon.parentNode.removeChild(balloon);
      }, 200);

      // Check win condition
      if (this.score >= this.targetScore) {
        setTimeout(() => {
          this.app.winGame(10);
        }, 300);
      } else {
        // Clear all current balloons and start new question
        this.clearAllBalloons();
        this.nextQuestion();
      }
    } else {
      // Wrong answer
      audio.playFail();
      
      // Shake effect
      balloon.style.transform = 'scale(0.9)';
      setTimeout(() => {
        balloon.style.transform = 'scale(1)';
      }, 100);
    }
  }

  checkBalloons() {
    // Check if balloons have floated off screen
    this.activeBalloons.forEach((balloon, index) => {
      const rect = balloon.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      
      // If balloon float past top bounds
      if (rect.bottom < containerRect.top) {
        if (balloon.parentNode) {
          balloon.parentNode.removeChild(balloon);
        }
        this.activeBalloons.splice(index, 1);
      }
    });
  }

  clearAllBalloons() {
    this.activeBalloons.forEach(b => {
      if (b.parentNode) b.parentNode.removeChild(b);
    });
    this.activeBalloons = [];
  }

  destroy() {
    this.active = false;
    clearInterval(this.spawnInterval);
    clearInterval(this.gameLoopInterval);
    this.clearAllBalloons();
    this.container.innerHTML = '';
  }
}
