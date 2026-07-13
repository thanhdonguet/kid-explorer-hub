/* Memory Jungle (Card Match) Game */
class MemoryJungle {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.pairsCount = 6; // 4x3 grid = 12 cards (6 pairs)
    this.animals = ['🦁', '🐵', '🐼', '🐨', '🦊', '🐰', '🐸', '🐯', '🦒', '🐘'];
    
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.lockBoard = false;
    this.active = false;
  }

  start() {
    this.active = true;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.lockBoard = false;

    // Update scoreboard
    this.updateHUD();

    // Create Grid Container
    this.container.innerHTML = `
      <div id="memory-container">
        <div id="memory-grid" class="grid-easy"></div>
      </div>
    `;

    this.grid = document.getElementById('memory-grid');
    this.setupBoard();
  }

  updateHUD() {
    document.getElementById('score-val').textContent = `${this.matchedPairs}/${this.pairsCount}`;
  }

  updateLanguage() {
    this.updateHUD();
  }

  setupBoard() {
    // 1. Select subset of animals and double them
    const selectedAnimals = this.animals.slice(0, this.pairsCount);
    let cardDeck = [...selectedAnimals, ...selectedAnimals];

    // 2. Shuffle Deck
    cardDeck.sort(() => Math.random() - 0.5);

    // 3. Render Cards
    this.grid.innerHTML = '';
    this.cards = [];

    cardDeck.forEach((animal, index) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.animal = animal;
      card.dataset.id = index;

      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front"></div>
          <div class="card-back">${animal}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.flipCard(card);
      });

      this.grid.appendChild(card);
      this.cards.push(card);
    });
  }

  flipCard(card) {
    if (!this.active) return;
    if (this.lockBoard) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    audio.playTap();
    card.classList.add('flipped');
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.lockBoard = true;
      this.checkMatch();
    }
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;
    const isMatch = card1.dataset.animal === card2.dataset.animal;

    if (isMatch) {
      this.handleMatch(card1, card2);
    } else {
      this.handleMismatch(card1, card2);
    }
  }

  handleMatch(card1, card2) {
    setTimeout(() => {
      audio.playSuccess();
      
      card1.classList.add('matched');
      card2.classList.add('matched');
      
      this.matchedPairs++;
      this.updateHUD();

      this.flippedCards = [];
      this.lockBoard = false;

      // Check win condition
      if (this.matchedPairs === this.pairsCount) {
        setTimeout(() => {
          this.app.winGame(12);
        }, 600);
      }
    }, 450);
  }

  handleMismatch(card1, card2) {
    setTimeout(() => {
      audio.playFail();
      
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      
      this.flippedCards = [];
      this.lockBoard = false;
    }, 1000);
  }

  destroy() {
    this.active = false;
    this.cards = [];
    this.flippedCards = [];
    this.container.innerHTML = '';
  }
}
