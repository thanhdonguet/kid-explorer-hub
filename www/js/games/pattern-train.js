class PatternTrain extends ExplorerActivity {
  constructor(container, app) {
    super(container, app);
    this.mode = null;
    this.phase = 'menu';
    this.roundIndex = 0;
    this.answers = [];
    this.rewarded = false;
    this.highlightIndex = -1;
    this.feedback = 'instruction';
    this.words = {
      vi: {
        title: 'Đoàn Tàu Quy Luật', intro: 'Chọn chuyến tàu của bé!',
        easy: 'Dễ', medium: 'Vừa', hard: 'Khó',
        easyHint: 'Hai đồ chơi thay phiên, điền toa cuối.',
        mediumHint: 'Nhóm ba đồ chơi lặp lại, điền toa cuối.',
        hardHint: 'Điền toa ở giữa, chú ý cả kích thước!',
        instruction: 'Nhìn các toa tàu. Đồ chơi nào còn thiếu?',
        sizeInstruction: 'Cùng một đồ chơi, nhưng nhỏ hoặc lớn. Kích thước nào còn thiếu?',
        listen: 'Nghe hướng dẫn', station: 'Ga', carriage: 'Toa',
        missing: 'Toa còn thiếu', choices: 'Chọn đồ chơi cho toa còn thiếu',
        correct: 'Đúng rồi! Cùng xem quy luật lặp lại nhé.',
        wrong: 'Cùng nhìn lại nhé. Hãy thử đồ chơi khác!',
        repeats: 'Nhóm lặp lại:',
        complete: 'Bé đã đi qua cả 5 ga!', reward: 'Bé nhận được 5 ngôi sao!',
        fullTrain: 'Đoàn tàu gồm 5 đồ chơi bé đã chọn',
        replay: 'Chơi lại', menu: 'Về đầu trò chơi', small: 'nhỏ', large: 'lớn',
        apple: 'Táo', banana: 'Chuối', cat: 'Mèo', dog: 'Chó',
        star: 'Ngôi sao', moon: 'Mặt trăng', train: 'Tàu hỏa'
      },
      en: {
        title: 'Pattern Train', intro: 'Choose your train journey!',
        easy: 'Easy', medium: 'Medium', hard: 'Hard',
        easyHint: 'Two toys take turns. Fill the last carriage.',
        mediumHint: 'Groups of three toys repeat. Fill the last carriage.',
        hardHint: 'Fill a middle carriage. Watch the sizes too!',
        instruction: 'Look at the carriages. Which toy is missing?',
        sizeInstruction: 'The same toy can be small or large. Which size is missing?',
        listen: 'Listen to instructions', station: 'Station', carriage: 'Carriage',
        missing: 'Missing carriage', choices: 'Choose a toy for the missing carriage',
        correct: 'That’s right! Let’s watch the pattern repeat.',
        wrong: 'Let’s look again. Try another toy!',
        repeats: 'The repeating group:',
        complete: 'You visited all 5 stations!', reward: 'You earned 5 stars!',
        fullTrain: 'A train of the 5 toys you chose',
        replay: 'Play again', menu: 'Game home', small: 'small', large: 'large',
        apple: 'Apple', banana: 'Banana', cat: 'Cat', dog: 'Dog',
        star: 'Star', moon: 'Moon', train: 'Train'
      }
    };
  }

  get text() { return this.words[this.lang === 'en' ? 'en' : 'vi']; }
  get round() { return this.rounds[this.roundIndex]; }

  start() {
    if (this.destroyed) return;
    this.showMenu();
  }

  updateLanguage(lang) {
    if (this.destroyed) return;
    this.lang = lang;
    if (this.phase === 'menu' || this.phase === 'complete') this.render();
    else this.refreshRound();
  }

  shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  makeRound() {
    const models = this.shuffle(['apple', 'cat', 'dog', 'star', 'moon']);
    const a = { model: models[0], size: 'normal' };
    const b = { model: models[1], size: 'normal' };
    return { pattern: [a, b], sequence: [a, b, a, b], missingIndex: 3, choices: this.shuffle([a, b]) };
  }

  startMode(mode) {
    if (this.destroyed || !['easy', 'medium', 'hard'].includes(mode)) return;
    this.clearTimers();
    this.mode = 'easy';
    this.rounds = Array.from({ length: 5 }, (_, i) => this.makeRound());
    this.roundIndex = 0;
    this.answers = [];
    this.rewarded = false;
    this.beginRound();
  }

  showMenu() {
    this.clearTimers();
    this.phase = 'menu';
    this.answers = [];
    this.render();
    this.updateHUD();
  }

  beginRound() {
    this.clearTimers();
    this.phase = 'playing';
    this.feedback = 'instruction';
    this.highlightIndex = -1;
    this.render();
    this.updateHUD();
  }

  updateHUD() {
    const score = document.getElementById('score-val');
    if (score) score.textContent = `${this.answers.length}/5`;
  }

  tokenKey(token) { return `${token.model}:${token.size}`; }

  tokenLabel(token) {
    const name = this.text[token.model];
    if (token.size === 'normal') return name;
    return this.lang === 'en' ? `${this.text[token.size]} ${name}` : `${name} ${this.text[token.size]}`;
  }

  toy(token) {
    return `<span class="ptr-toy ptr-size-${token.size}" aria-hidden="true">${this.modelMarkup(token.model, this.tokenLabel(token), 'yaw="0"')}</span>`;
  }

  instruction() {
    return this.text.instruction;
  }

  feedbackText() {
    if (this.feedback === 'instruction') return this.instruction();
    return `${this.text[this.feedback]} ${this.text.repeats} ${this.round.pattern.map(token => this.tokenLabel(token)).join(' → ')}.`;
  }

  render() {
    if (this.destroyed) return;
    const focused = this.container.contains(document.activeElement) ? document.activeElement.dataset.ptrFocus : null;
    this.prepareRender();
    const t = this.text;
    const listen = `<button type="button" class="ptr-listen" data-action="listen" data-ptr-focus="listen" aria-label="${t.listen}"><span aria-hidden="true">🔊</span></button>`;
    let content;
    if (this.phase === 'menu') {
      content = `<div class="ptr-mascot">${this.modelMarkup('train', t.train)}</div>
        <div class="ptr-demo" aria-hidden="true">🍎 ⭐ 🍎 <span>?</span></div>
        <div class="ptr-actions"><button type="button" class="ptr-button" data-mode="easy" data-level="easy" data-ptr-focus="easy" aria-label="${this.lang === 'en' ? 'Start playing' : 'Bắt đầu chơi'}"><span aria-hidden="true">▶</span></button>${listen}</div>`;
    } else if (this.phase === 'complete') {
      content = `<section class="ptr-complete" aria-labelledby="ptr-win-title">
        <h3 id="ptr-win-title" class="ptr-sr-only" tabindex="-1">${t.complete}</h3>
        <p class="ptr-reward" aria-label="${t.reward}"><span aria-hidden="true">★ ★ ★ ★ ★</span></p>
        <ol class="ptr-train ptr-full-train" aria-label="${t.fullTrain}">${this.answers.map((token, i) => this.carriage(token, i, false)).join('')}</ol>
        <div class="ptr-actions"><button type="button" class="ptr-button" data-action="replay" data-ptr-focus="replay" aria-label="${t.replay}"><span aria-hidden="true">↻</span></button>
        <button type="button" class="ptr-button ptr-secondary" data-action="menu" data-ptr-focus="menu" aria-label="${t.menu}"><span aria-hidden="true">⌂</span></button></div>
      </section>`;
    } else {
      const locked = this.phase !== 'playing';
      content = `<div class="ptr-station"><span class="ptr-progress" aria-label="${t.station} ${this.roundIndex + 1}/5"><span aria-hidden="true">${Array.from({length: 5}, (_, i) => i < this.answers.length ? '★' : '☆').join(' ')}</span></span>${listen}</div>
        <div class="ptr-track"><span class="ptr-engine" aria-hidden="true">🚂</span>
        <ol class="ptr-train${this.phase === 'departing' ? ' ptr-departing' : ''}" aria-label="${t.title}">
          ${this.round.sequence.map((token, i) => this.carriage(token, i, i === this.round.missingIndex && !locked)).join('')}
        </ol></div>
        <div id="ptr-feedback" class="ptr-feedback" role="status" aria-live="polite" aria-atomic="true"><span class="ptr-feedback-icon" aria-hidden="true">${this.feedbackIcon()}</span><span class="ptr-sr-only">${this.feedbackText()}</span></div>
        <div class="ptr-choices" role="group" aria-label="${t.choices}">
          ${this.round.choices.map((token, i) => `<button type="button" class="ptr-choice" data-choice="${i}" data-token="${token.model}" data-size="${token.size}" data-ptr-focus="choice-${i}" aria-label="${this.tokenLabel(token)}" ${locked ? 'disabled' : ''}>${this.toy(token)}</button>`).join('')}
        </div>`;
    }
    this.container.innerHTML = `<section class="ptr-game${this.phase === 'playing' ? ' ptr-arriving' : ''}" data-phase="${this.phase}" lang="${this.lang}" aria-label="${t.title}">${content}</section>`;
    this.container.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => this.startMode('easy')));
    this.container.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => this.choose(Number(button.dataset.choice))));
    this.container.querySelector('[data-action="listen"]')?.addEventListener('click', () => this.speak(this.phase === 'menu' ? t.instruction : this.feedbackText()));
    this.container.querySelector('[data-action="replay"]')?.addEventListener('click', () => this.startMode('easy'));
    this.container.querySelector('[data-action="menu"]')?.addEventListener('click', () => this.showMenu());
    if (focused) this.container.querySelector(`[data-ptr-focus="${focused}"]:not(:disabled)`)?.focus({ preventScroll: true });
  }

  feedbackIcon() {
    return this.feedback === 'correct' ? '🌟' : this.feedback === 'wrong' ? '👀' : '☝';
  }

  refreshRound() {
    const t = this.text;
    const locked = this.phase !== 'playing';
    const root = this.container.querySelector('.ptr-game');
    root.dataset.phase = this.phase;
    root.lang = this.lang;
    root.setAttribute('aria-label', t.title);
    root.querySelector('.ptr-progress').setAttribute('aria-label', `${t.station} ${this.roundIndex + 1}/5`);
    root.querySelector('.ptr-progress span').textContent = Array.from({length: 5}, (_, i) => i < this.answers.length ? '★' : '☆').join(' ');
    root.querySelector('[data-action="listen"]').setAttribute('aria-label', t.listen);
    root.querySelector('.ptr-train').setAttribute('aria-label', t.title);
    this.round.sequence.forEach((token, index) => {
      const carriage = root.querySelector(`[data-carriage="${index}"]`);
      const missing = index === this.round.missingIndex && !locked;
      const label = missing ? t.missing : this.tokenLabel(token);
      if (!missing && carriage.classList.contains('ptr-missing')) {
        carriage.querySelector('.ptr-question').outerHTML = this.toy(token);
        carriage.classList.remove('ptr-missing');
        carriage.dataset.token = token.model;
        carriage.dataset.size = token.size;
      }
      carriage.setAttribute('aria-label', `${t.carriage} ${index + 1}: ${label}`);
      carriage.querySelector('kid-model')?.setAttribute('aria-label', label);
    });
    root.querySelector('.ptr-choices').setAttribute('aria-label', t.choices);
    root.querySelectorAll('[data-choice]').forEach(button => {
      const token = this.round.choices[Number(button.dataset.choice)];
      const label = this.tokenLabel(token);
      button.disabled = locked;
      button.setAttribute('aria-label', label);
      button.querySelector('kid-model').setAttribute('aria-label', label);
      button.classList.toggle('ptr-hint', this.feedback === 'wrong' && this.tokenKey(token) === this.tokenKey(this.round.sequence[this.round.missingIndex]));
    });
    root.querySelector('.ptr-feedback-icon').textContent = this.feedbackIcon();
    root.querySelector('#ptr-feedback .ptr-sr-only').textContent = this.feedbackText();
  }

  carriage(token, index, missing) {
    const label = missing ? this.text.missing : this.tokenLabel(token);
    return `<li class="ptr-carriage${missing ? ' ptr-missing' : ''}${index === this.highlightIndex ? ' ptr-highlight' : ''}" data-carriage="${index}" data-token="${missing ? '' : token.model}" data-size="${missing ? '' : token.size}" aria-label="${this.text.carriage} ${index + 1}: ${label}">
      ${missing ? '<span class="ptr-question" aria-hidden="true">?</span>' : this.toy(token)}
    </li>`;
  }

  choose(index) {
    if (this.destroyed || this.phase !== 'playing') return;
    const selected = this.round.choices[index];
    if (!selected) return;
    this.clearTimers();
    this.highlightIndex = -1;
    const correct = this.tokenKey(selected) === this.tokenKey(this.round.sequence[this.round.missingIndex]);
    this.feedback = correct ? 'correct' : 'wrong';
    if (correct) {
      // Reserve the answer before any rendering or delayed explanation.
      this.phase = 'explaining';
      this.answers.push({ ...selected });
      this.updateHUD();
    }
    this.refreshRound();
    this.explain(correct);
  }

  explain(correct) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = reduced ? 140 : 380;
    this.setHighlight(0);
    for (let i = 1; i < this.round.sequence.length; i++) {
      this.later(() => this.setHighlight(i), step * i);
    }
    this.later(() => {
      this.setHighlight(-1);
      if (!correct) return;
      this.phase = 'departing';
      this.container.querySelector('.ptr-game')?.setAttribute('data-phase', this.phase);
      this.container.querySelector('.ptr-train')?.classList.add('ptr-departing');
      this.later(() => this.nextStation(), reduced ? 0 : 700);
    }, step * this.round.sequence.length);
  }

  setHighlight(index) {
    this.highlightIndex = index;
    this.container.querySelectorAll('[data-carriage]').forEach(carriage => {
      carriage.classList.toggle('ptr-highlight', Number(carriage.dataset.carriage) === index);
    });
  }

  nextStation() {
    if (this.destroyed || this.phase !== 'departing') return;
    this.clearTimers();
    if (this.roundIndex < 4) {
      this.roundIndex++;
      this.beginRound();
      this.container.querySelector('[data-choice]')?.focus({ preventScroll: true });
      return;
    }
    this.phase = 'complete';
    if (!this.rewarded) {
      this.rewarded = true;
      this.app.addStars(5);
    }
    this.render();
    this.container.querySelector('#ptr-win-title')?.focus({ preventScroll: true });
  }

  destroy() {
    this.feedbackResize?.disconnect();
    super.destroy();
  }
}
