/* Addition game; keep the existing math route and script path for saved installs. */
class FruitMarket {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.lang = app.lang || 'vi';
    this.score = 0;
    this.targetScore = 5;
    this.phase = 'menu';
    this.currentLevel = null;
    this.destroyed = false;
    this.timers = new Set();
    this.levels = { easy: { min: 1, max: 10 }, medium: { min: 11, max: 20 }, hard: { min: 21, max: 100 } };
  }

  text(vi, en) { return this.lang === 'en' ? en : vi; }
  start() { this.showMenu(); }
  clearTimers() { this.timers.forEach(clearTimeout); this.timers.clear(); }
  later(fn, delay) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.destroyed) fn();
    }, delay);
    this.timers.add(timer);
  }
  updateHUD() {
    const score = document.getElementById('score-val');
    if (score) score.textContent = `${this.score}/${this.targetScore}`;
  }
  updateLanguage(lang) {
    if (this.destroyed) return;
    this.lang = lang;
    window.TTS?.cancel();
    this.render();
  }
  speak() {
    if (this.destroyed || !this.question) return;
    const { a, b, sum } = this.question;
    const message = this.phase === 'correct'
      ? this.text(`${a} cộng ${b} bằng ${sum}.`, `${a} plus ${b} equals ${sum}.`)
      : this.text(`${a} cộng ${b} bằng bao nhiêu?`, `What is ${a} plus ${b}?`);
    window.TTS?.speak(message, { lang: this.lang === 'en' ? 'en-US' : 'vi-VN', rate: .85 });
  }
  shuffle(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  makeQuestion(level) {
    const { min, max } = this.levels[level];
    const sum = min + Math.floor(Math.random() * (max - min + 1));
    const a = Math.floor(Math.random() * (sum + 1));
    const candidates = [...new Set([sum - 1, sum + 1, sum - 2, sum + 2, sum - 10, sum + 10])]
      .filter(value => value >= 0 && value <= max && value !== sum);
    return { a, b: sum - a, sum, choices: this.shuffle([sum, ...this.shuffle(candidates).slice(0, 2)]) };
  }
  showMenu() {
    if (this.destroyed) return;
    this.clearTimers();
    window.TTS?.cancel();
    this.phase = 'menu';
    this.question = null;
    this.score = 0;
    this.updateHUD();
    this.render();
  }
  startLevel(level) {
    if (this.destroyed || !Object.hasOwn(this.levels, level)) return;
    this.clearTimers();
    window.TTS?.cancel();
    this.currentLevel = level;
    this.score = 0;
    this.rewarded = false;
    this.nextQuestion();
  }
  nextQuestion() {
    if (this.destroyed) return;
    this.question = this.makeQuestion(this.currentLevel);
    this.phase = 'playing';
    this.wrongAnswer = null;
    this.hint = this.currentLevel === 'easy';
    this.updateHUD();
    this.render();
  }
  choose(value) {
    if (this.destroyed || this.phase !== 'playing' || !this.question.choices.includes(value)) return;
    if (value !== this.question.sum) {
      this.wrongAnswer = value;
      this.hint = true;
      this.render();
      this.container.querySelector(`[data-answer="${value}"]`)?.focus({ preventScroll: true });
      return;
    }
    // Lock synchronously so fast taps cannot count a question twice.
    this.phase = 'correct';
    this.wrongAnswer = null;
    this.score++;
    this.updateHUD();
    this.render();
    if (typeof audio !== 'undefined') audio.playSuccess?.();
    this.later(() => {
      if (this.score < this.targetScore) {
        this.nextQuestion();
        this.container.querySelector('[data-answer]')?.focus({ preventScroll: true });
      } else {
        this.phase = 'complete';
        if (!this.rewarded) { this.rewarded = true; this.app.addStars(5); }
        this.render();
        this.container.querySelector('[data-action="replay"]')?.focus({ preventScroll: true });
      }
    }, 1200);
  }
  quantity(value) {
    if (value === 0) return '<span class="fm-zero" aria-hidden="true">0</span>';
    if (this.currentLevel === 'easy') {
      return `<div class="fm-apples" aria-hidden="true">${Array.from({ length: value }, () => '<img src="img/vocab/apple.svg" alt="" draggable="false">').join('')}</div>`;
    }
    return `<div class="fm-blocks" aria-hidden="true">${Array.from({ length: Math.floor(value / 10) }, () =>
      '<span class="fm-ten">' + '<i></i>'.repeat(10) + '</span>').join('')}${'<span class="fm-one"></span>'.repeat(value % 10)}</div>`;
  }
  render() {
    if (this.destroyed) return;
    const title = this.text('Bé Học Cộng', 'Addition Adventure');
    const labels = this.lang === 'en' ? ['Easy', 'Medium', 'Hard'] : ['Dễ', 'Vừa', 'Khó'];
    const menuLabel = this.text('Chọn mức', 'Choose level');
    const icon = (action, symbol, label, extra = '') => `<button type="button" class="fm-icon" data-action="${action}" aria-label="${label}" ${extra}><span aria-hidden="true">${symbol}</span></button>`;
    let content;
    if (this.phase === 'menu') {
      content = `<div class="fm-mascot"><kid-model model="bear" aria-label="${this.text('Bạn Gấu', 'Bear friend')}"><img class="model-fallback" src="img/vocab/bear.svg" alt=""></kid-model></div>
        <div class="fm-demo" aria-hidden="true">2 + 3 = 5</div>
        <div class="fm-levels" role="group" aria-label="${menuLabel}">${Object.entries(this.levels).map(([level, config], i) =>
          `<button type="button" class="fm-level" data-level="${level}"><span aria-hidden="true">${'★'.repeat(i + 1)}</span><strong>${labels[i]}</strong><small>${this.text('Tổng đến', 'Sums up to')} ${config.max}</small></button>`).join('')}</div>`;
    } else if (this.phase === 'complete') {
      content = `<div class="fm-complete" role="status"><div class="fm-stars" aria-label="${this.text('Nhận 5 sao', 'Five stars earned')}">★ ★ ★ ★ ★</div><h2>${this.text('Giỏi lắm!', 'Well done!')}</h2></div>
        <div class="fm-actions">${icon('replay', '↻', this.text('Chơi lại', 'Play again'))}${icon('menu', '⌂', menuLabel)}</div>`;
    } else {
      const { a, b, sum, choices } = this.question;
      const locked = this.phase === 'correct';
      content = `<div class="fm-toolbar"><span class="fm-progress" aria-label="${this.score}/5">${Array.from({ length: 5 }, (_, i) => i < this.score ? '★' : '☆').join(' ')}</span>
        <div class="fm-actions">${icon('menu', '⌂', menuLabel)}${icon('hint', '💡', this.text('Gợi ý bằng hình', 'Picture hint'), `aria-pressed="${this.hint}"`)}${icon('listen', '🔊', this.text('Nghe phép tính', 'Hear the sum'))}</div></div>
        <div class="fm-equation" role="group" aria-label="${a} + ${b} = ${locked ? sum : '?'}"><span class="fm-a">${a}</span><span>+</span><span class="fm-b">${b}</span><span>=</span><strong class="fm-result">${locked ? sum : '?'}</strong></div>
        <div class="fm-hint" ${this.hint ? '' : 'hidden'}><div class="fm-quantities"><div aria-label="${a}">${this.quantity(a)}</div><span class="fm-plus" aria-hidden="true">+</span><div aria-label="${b}">${this.quantity(b)}</div></div>
        ${this.currentLevel !== 'easy' ? '<div class="fm-legend" aria-hidden="true"><span class="fm-ten">' + '<i></i>'.repeat(10) + '</span> = 10 <span class="fm-one"></span> = 1</div>' : ''}</div>
        <div class="fm-feedback" role="status" aria-live="polite">${locked ? this.text('Đúng rồi! 🌟', 'Correct! 🌟') : this.wrongAnswer !== null ? this.text('Thử lại nhé 👀', 'Try again 👀') : this.text('Chọn đáp án', 'Choose an answer')}</div>
        <div class="fm-answers" role="group" aria-label="${this.text('Đáp án', 'Answers')}">${choices.map(value => `<button type="button" class="fm-answer ${this.wrongAnswer === value ? 'fm-wrong' : ''} ${locked && value === sum ? 'fm-right' : ''}" data-answer="${value}" ${locked ? 'disabled' : ''}>${value}</button>`).join('')}</div>`;
    }
    this.container.innerHTML = `<section class="fm-addition" data-phase="${this.phase}" lang="${this.lang}" aria-label="${title}">${content}</section>`;
    this.container.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => this.startLevel(button.dataset.level)));
    this.container.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => this.choose(Number(button.dataset.answer))));
    this.container.querySelector('[data-action="listen"]')?.addEventListener('click', () => this.speak());
    this.container.querySelector('[data-action="hint"]')?.addEventListener('click', () => {
      this.hint = !this.hint;
      this.render();
      this.container.querySelector('[data-action="hint"]')?.focus({ preventScroll: true });
    });
    this.container.querySelector('[data-action="menu"]')?.addEventListener('click', () => this.showMenu());
    this.container.querySelector('[data-action="replay"]')?.addEventListener('click', () => this.startLevel(this.currentLevel));
  }
  destroy() {
    this.destroyed = true;
    this.clearTimers();
    window.TTS?.cancel();
    this.container.innerHTML = '';
  }
}
