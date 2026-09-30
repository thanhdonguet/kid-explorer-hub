/* Original picture sequences: every illustration is drawn locally, without image requests. */
class StoryGarden extends ExplorerActivity {
  constructor(container, app) {
    super(container, app);
    this.mode = null;
    this.phase = 'menu';
    this.completed = 0;
    this.rewarded = false;
    this.narration = false;
    this.stories = [
      {
        id: 'bean', title: ['Hạt đậu lớn lên', 'A bean grows'],
        steps: [
          ['seed', 'Gieo hạt đậu', 'Plant a bean', 'Hạt cần nằm trong đất trước khi được tưới.', 'The bean needs to be in the soil before watering.'],
          ['water', 'Tưới nước', 'Water the seed', 'Tưới hạt trong đất để hạt có nước nảy mầm.', 'Water the planted seed so it can sprout.'],
          ['sprout', 'Hạt nảy mầm', 'A sprout appears', 'Sau khi được tưới, hạt nảy thành mầm nhỏ.', 'After watering, a little sprout grows from the seed.'],
          ['grown', 'Cây đậu lớn lên', 'The bean plant grows', 'Mầm nhỏ cần lớn thành cây trước khi có quả đậu.', 'The little sprout grows into a plant before it makes bean pods.'],
          ['harvest', 'Hái quả đậu', 'Pick the bean pods', 'Chờ cây lớn có quả đậu rồi mới hái nhé.', 'Wait for the plant to grow bean pods before picking them.'],
        ],
        easy: [0, 1, 3], medium: [0, 1, 2, 3], hard: [0, 1, 2, 3, 4],
        extra: ['ice', 'Đặt hạt vào đá lạnh', 'Put the seed on ice'],
        extraHint: ['Hạt đậu cần đất, nước và hơi ấm, không phải đá lạnh. Hãy trả hình này về khay.', 'A bean needs soil, water and warmth, not ice. Return this picture to the tray.'],
        reward: 'flower', rewardName: ['Bông hoa', 'Flower'],
      },
      {
        id: 'carrot', title: ['Vườn cà rốt', 'The carrot patch'],
        steps: [
          ['seed', 'Gieo hạt cà rốt', 'Sow carrot seeds', 'Gieo hạt vào đất trước để có cây cà rốt.', 'First put seeds in the soil to grow carrots.'],
          ['water', 'Tưới luống đất', 'Water the soil', 'Hạt đã gieo cần nước để nảy mầm.', 'The planted seeds need water to sprout.'],
          ['sprout', 'Lá non nhú lên', 'Tiny leaves appear', 'Sau khi được tưới, lá non mới nhú lên khỏi đất.', 'After watering, tiny leaves appear above the soil.'],
          ['grown', 'Củ cà rốt lớn lên', 'The carrot grows', 'Củ cần lớn lên dưới đất trước khi nhổ.', 'The carrot needs to grow underground before we pull it up.'],
          ['harvest', 'Nhổ cà rốt', 'Pull up the carrot', 'Chờ củ lớn rồi cầm lá nhổ lên nhé.', 'Wait for a big carrot, then pull it up by its leaves.'],
        ],
        easy: [0, 1, 4], medium: [0, 1, 3, 4], hard: [0, 1, 2, 3, 4],
        extra: ['paint', 'Sơn luống đất', 'Paint the soil'],
        extraHint: ['Cà rốt cần nước, không cần sơn. Hãy trả hình lọ sơn về khay.', 'Carrots need water, not paint. Return the paint picture to the tray.'],
        reward: 'tree', rewardName: ['Cây xanh', 'Tree'],
      },
      {
        id: 'hands', title: ['Đôi tay sạch', 'Clean hands'],
        steps: [
          ['wet', 'Làm ướt tay', 'Wet your hands', 'Làm ướt tay trước để xà phòng dễ tạo bọt.', 'Wet your hands first so the soap can make bubbles.'],
          ['soap', 'Thoa xà phòng', 'Add soap', 'Thoa xà phòng lên tay ướt trước khi rửa sạch bọt.', 'Put soap on wet hands before rinsing the bubbles away.'],
          ['scrub', 'Chà hai bàn tay', 'Rub your hands', 'Chà tay có xà phòng để làm sạch trước khi xả nước.', 'Rub your soapy hands to clean them before rinsing.'],
          ['rinse', 'Xả sạch bọt', 'Rinse off the soap', 'Dùng nước rửa sạch bọt trước khi lau khô.', 'Rinse away the soap with water before drying.'],
          ['dry', 'Lau khô tay', 'Dry your hands', 'Khi tay đã sạch bọt, dùng khăn sạch lau khô.', 'Once the soap is gone, dry your hands with a clean towel.'],
        ],
        easy: [1, 3, 4], medium: [0, 1, 3, 4], hard: [0, 1, 2, 3, 4],
        extra: ['mud', 'Chạm vào bùn', 'Touch the mud'],
        extraHint: ['Bùn làm tay bẩn trở lại. Hãy trả hình bùn về khay để giữ tay sạch.', 'Mud makes hands dirty again. Return the mud picture to keep hands clean.'],
        reward: 'rabbit', rewardName: ['Bạn thỏ', 'Rabbit friend'],
      },
    ];
  }

  text(vi, en) { return this.lang === 'en' ? en : vi; }
  pair(values) { return values[this.lang === 'en' ? 1 : 0]; }
  get story() { return this.stories[this.completed]; }
  get steps() {
    return this.story[this.mode].map(index => {
      const step = [...this.story.steps[index]];
      if (this.story.id === 'hands' && this.mode === 'easy' && step[0] === 'soap') {
        step[1] = 'Làm ướt tay và xoa xà phòng';
        step[2] = 'Wet hands and rub with soap';
      }
      return step;
    });
  }
  start() { this.render(); }
  updateHUD() {
    const score = document.getElementById('score-val');
    if (score) score.textContent = `${this.completed}/3`;
  }
  updateLanguage(lang) {
    this.lang = lang;
    window.TTS?.cancel?.();
    this.render();
  }
  startSession(mode) {
    if (this.destroyed) return;
    this.clearTimers();
    window.TTS?.cancel?.();
    this.mode = 'easy';
    this.completed = 0;
    this.rewarded = false;
    this.startStory();
  }
  startStory() {
    this.phase = 'arrange';
    this.selected = null;
    this.issue = null;
    this.slots = Array(this.steps.length).fill(null);
    this.cards = [...this.steps.map(step => step[0])];
    if (this.mode === 'hard') this.cards.push(this.story.extra[0]);
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    if (this.steps.every((step, i) => this.cards[i] === step[0])) this.cards.push(this.cards.shift());
    this.render();
  }
  cardData(id) { return this.steps.find(step => step[0] === id) || this.story.extra; }
  label(id) {
    const step = this.cardData(id);
    return step[this.lang === 'en' ? 2 : 1];
  }
  instruction() {
    return this.text(
      'Kéo hình vào ô có hình giống nhau. Hoặc chạm vào hình, rồi chạm vào ô. Ghép đủ hình để xem câu chuyện nhé!',
      'Drag each picture onto its matching picture. Or tap a picture, then tap its space. Match all the pictures to watch the story!'
    );
  }
  createDragGhost(source) {
    const ghost = super.createDragGhost(source);
    ghost.classList.add('sgr-drag-ghost');
    ghost.replaceChildren(source.querySelector('.sgr-picture').cloneNode(true));
    return ghost;
  }
  move(id, target) {
    if (this.destroyed || this.phase !== 'arrange' || !this.cards.includes(id)) return;
    const source = this.slots.indexOf(id);
    if (target === 'tray') {
      if (source !== -1) this.slots[source] = null;
    } else {
      const index = Number(target);
      if (!Number.isInteger(index) || index < 0 || index >= this.slots.length) return;
      if (this.steps[index][0] !== id) {
        this.issue = this.steps.findIndex(step => step[0] === id);
        this.selected = id;
        this.render();
        this.container.querySelector(`[data-drag-id="${id}"]`)?.focus({ preventScroll: true });
        return;
      }
      const displaced = this.slots[index];
      if (source !== -1) this.slots[source] = displaced;
      this.slots[index] = id;
    }
    this.selected = null;
    this.issue = null;
    this.render();
    this.container.querySelector(target === 'tray' ? `[data-card="${id}"]` : `[data-slot="${target}"]`)?.focus({ preventScroll: true });
    if (this.slots.every(Boolean)) this.check();
  }
  choose(id) {
    if (this.phase !== 'arrange') return;
    this.selected = this.selected === id ? null : id;
    this.issue = null;
    this.render();
    this.container.querySelector(`[data-drag-id="${id}"]`)?.focus({ preventScroll: true });
  }
  check() {
    if (this.destroyed || this.phase !== 'arrange') return;
    const index = this.steps.findIndex((step, i) => this.slots[i] !== step[0]);
    if (index !== -1) {
      this.issue = index;
      this.render();
      this.container.querySelector(`[data-slot="${index}"]`)?.focus({ preventScroll: true });
      return;
    }
    this.phase = 'playing';
    window.TTS?.cancel?.();
    this.selected = null;
    this.issue = null;
    this.playIndex = 0;
    this.playStep();
  }
  playStep() {
    if (this.destroyed || this.phase !== 'playing') return;
    this.render();
    if (this.narration) this.speak(this.label(this.slots[this.playIndex]));
    this.later(() => {
      this.playIndex++;
      if (this.playIndex < this.slots.length) this.playStep();
      else this.finishStory();
    }, this.narration ? 3600 : 1400);
  }
  finishStory() {
    if (this.destroyed || this.phase !== 'playing') return;
    window.TTS?.cancel?.();
    this.completed++;
    this.phase = this.completed === 3 ? 'complete' : 'reward';
    if (this.completed === 3 && !this.rewarded) {
      this.rewarded = true;
      this.app.addStars(5);
    }
    this.render();
    this.container.querySelector('[data-action="next"], [data-action="replay"]')?.focus({ preventScroll: true });
  }
  feedback() {
    if (this.issue === null) return this.selected
      ? this.text(`Đã chọn: ${this.label(this.selected)}. Chọn ô số hoặc trả về khay.`, `Selected: ${this.label(this.selected)}. Choose a space or return it to the tray.`)
      : this.text('Mỗi hình kể một bước. Bé hãy thử nhé!', 'Each picture tells one step. Give it a try!');
    const expected = this.steps[this.issue];
    const prefix = this.text(`Ô ${this.issue + 1}: `, `Space ${this.issue + 1}: `);
    if (this.slots[this.issue] === this.story.extra[0]) return prefix + this.pair(this.story.extraHint);
    return prefix + (this.slots[this.issue] === null ? this.text('Còn trống. ', 'Still empty. ') : '')
      + expected[this.lang === 'en' ? 4 : 3];
  }
  gardenMarkup() {
    return `<div class="sgr-garden" aria-label="${this.text('Khu vườn đã trồng', 'Your growing garden')}">${this.stories.map((story, i) =>
      `<div class="sgr-garden-plot ${i < this.completed ? 'sgr-earned' : ''}" data-earned="${i < this.completed}">
        ${i < this.completed ? this.modelMarkup(story.reward, this.pair(story.rewardName)) : this.illustration('bean', 'sprout')}
      </div>`).join('')}</div>`;
  }
  iconButton(action, icon, vi, en, extra = '') {
    return `<button type="button" data-action="${action}" aria-label="${this.text(vi, en)}" ${extra}><span aria-hidden="true">${icon}</span></button>`;
  }
  render() {
    if (this.destroyed) return;
    this.prepareRender();
    this.updateHUD();
    const title = this.text('Khu Vườn Diệu Kỳ', 'Story Garden');
    const menu = this.phase === 'menu';
    const done = this.phase === 'complete' || this.phase === 'reward';
    this.container.innerHTML = `<section class="sgr-game" data-phase="${this.phase}" aria-label="${title}">
      ${menu ? `<div class="sgr-menu">
        <div class="sgr-welcome">${this.modelMarkup('rabbit', this.text('Bạn thỏ', 'Rabbit friend'))}${this.illustration('bean', 'grown')}</div>
        <div class="sgr-demo" aria-hidden="true">${this.illustration('bean', 'seed')}<span>→</span>${this.illustration('bean', 'water')}<span>→</span>${this.illustration('bean', 'grown')}</div>
        <div class="sgr-actions"><button type="button" data-mode="easy" data-level="easy" aria-label="${this.text('Bắt đầu chơi', 'Start playing')}"><span aria-hidden="true">▶</span></button>
        ${this.iconButton('listen', '🔊', 'Nghe hướng dẫn', 'Listen to instructions')}</div>
      </div>` : done ? `
        <div class="sgr-celebrate" role="status" aria-label="${this.phase === 'complete' ? this.text('Hoàn thành, nhận 5 sao', 'Complete, five stars earned') : this.text('Đúng rồi!', 'Well done!')}"><span aria-hidden="true">${this.phase === 'complete' ? '★ ★ ★ ★ ★' : '🌟'}</span></div>
        ${this.gardenMarkup()}
        <div class="sgr-actions">${this.phase === 'complete'
          ? this.iconButton('replay', '↻', 'Chơi lại', 'Play again') + this.iconButton('menu', '⌂', 'Về đầu trò chơi', 'Game home')
          : this.iconButton('next', '▶', 'Câu chuyện tiếp theo', 'Next story')}</div>
      ` : `
        <div class="sgr-story-heading"><div class="sgr-progress" aria-label="${this.completed + 1}/3">${this.stories.map((_, i) => `<span aria-hidden="true">${i < this.completed ? '🌼' : '○'}</span>`).join('')}</div>
          ${this.iconButton('listen', '🔊', 'Nghe hướng dẫn', 'Listen to instructions', this.phase === 'playing' ? 'disabled' : '')}</div>
        ${this.phase === 'playing' ? `<div class="sgr-playback" role="status" aria-label="${this.label(this.slots[this.playIndex])}">
          ${this.illustration(this.story.id, this.slots[this.playIndex])}
          <div aria-hidden="true">${this.slots.map((_, i) => i === this.playIndex ? '●' : '○').join(' ')}</div></div>` : ''}
        <div class="sgr-slots" style="--sgr-count:3" aria-label="${this.text('Thứ tự câu chuyện', 'Story order')}">
          ${this.slots.map((id, i) => `<button type="button" class="sgr-slot ${id ? 'sgr-filled' : 'sgr-placeholder'} ${this.issue === i ? 'sgr-issue' : ''} ${id && this.selected === id ? 'sgr-selected' : ''} ${this.phase === 'playing' && this.playIndex === i ? 'sgr-current' : ''}"
            data-slot="${i}" data-drop-id="${i}" ${id ? `data-drag-id="${id}"` : ''} ${this.phase === 'playing' ? 'disabled' : ''}
            aria-label="${this.text('Ô', 'Space')} ${i + 1}: ${this.label(this.steps[i][0])}" aria-pressed="${Boolean(id && this.selected === id)}">
            ${this.illustration(this.story.id, id || this.steps[i][0])}<span class="sgr-slot-mark" aria-hidden="true">${id ? '✓' : '＋'}</span></button>`).join('')}
        </div>
        ${this.phase === 'arrange' ? `<div class="sgr-feedback" role="status" aria-label="${this.issue !== null ? this.text('Thử ô có hình giống nhé', 'Try the space with the matching picture') : this.instruction()}"><span aria-hidden="true">${this.issue !== null ? '👀 ↑' : '☝ ↑'}</span></div>
          <div class="sgr-tray" data-drop-id="tray" aria-label="${this.text('Khay hình', 'Picture tray')}">
            ${this.cards.filter(id => !this.slots.includes(id)).map(id => `<button type="button" class="sgr-card ${this.selected === id ? 'sgr-selected' : ''}" data-card="${id}" data-drag-id="${id}" aria-pressed="${this.selected === id}" aria-label="${this.label(id)}">${this.illustration(this.story.id, id)}</button>`).join('')}
          </div>` : ''}
        <div class="sgr-mini-garden">${this.gardenMarkup()}</div>
      `}
    </section>`;
    this.bindUI();
  }
  bindUI() {
    this.container.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => this.startSession(button.dataset.mode)));
    this.container.querySelectorAll('[data-card]').forEach(button => button.addEventListener('click', () => this.choose(button.dataset.card)));
    this.container.querySelectorAll('[data-slot]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.slot);
      if (this.selected) this.move(this.selected, button.dataset.slot);
      else if (this.slots[index]) this.choose(this.slots[index]);
    }));
    this.container.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
      switch (button.dataset.action) {
        case 'listen': this.speak(this.instruction()); break;
        case 'watch': this.check(); break;
        case 'return': if (this.selected) this.move(this.selected, 'tray'); break;
        case 'narration': this.narration = button.checked; break;
        case 'next': if (this.phase === 'reward') this.startStory(); break;
        case 'replay': if (this.phase === 'complete') this.startSession(this.mode); break;
        case 'menu':
          this.clearTimers();
          this.phase = 'menu';
          this.render();
          break;
      }
    }));
    if (this.phase === 'arrange') this.bindDragDrop('[data-drag-id]', '[data-drop-id]', (id, target) => this.move(id, target));
  }

  illustration(story, step) {
    const soil = '<path d="M10 111 Q80 101 170 111V143H10Z" fill="#a96e42"/><path d="M18 120l13 3m19 10l9-4m66 3l12-4m15-10l8 3" stroke="#795039" stroke-width="3"/>';
    const seed = '<ellipse cx="86" cy="117" rx="9" ry="6" fill="#f3cb74" transform="rotate(-25 86 117)"/>';
    const rain = '<g fill="#4db8e5"><path d="M63 61q-9 13 0 13t0-13M78 72q-9 13 0 13t0-13M94 82q-9 13 0 13t0-13"/></g>';
    const leaves = '<path d="M89 111V78" stroke="#37884b" stroke-width="5"/><path d="M87 94Q57 93 63 75Q84 72 87 94M91 85Q93 59 118 63Q119 84 91 85" fill="#58ad53" stroke="#37884b" stroke-width="2"/>';
    const carrot = '<path d="M77 106Q90 98 106 107L86 140Z" fill="#f79035" stroke="#c2602e" stroke-width="2"/><path d="M83 113l9 2m-12 6l7 2" stroke="#c2602e" stroke-width="2"/><path d="M90 106q-26-24-10-40q16 5 10 40m3-2q-4-40 14-43q11 22-14 43m0 0q22-31 32-15q-5 15-32 15" fill="#56a650" stroke="#34824b" stroke-width="2"/>';
    const grownBean = '<path d="M85 112Q79 74 95 42" fill="none" stroke="#398148" stroke-width="6"/><path d="M85 90Q48 94 52 70Q71 63 85 90M87 72Q109 44 128 56Q128 77 87 72M92 52Q64 48 70 30Q91 28 92 52" fill="#5cae54" stroke="#398148" stroke-width="2"/><path d="M67 75q-11 27 3 28q15-2 5-28M113 62q-9 27 3 28q16-7 6-30" fill="#acd36a" stroke="#44834c" stroke-width="3"/>';
    const hand = '<path d="M44 105l13-14 10-32q3-8 9-4l-4 24 13-31q4-6 9-2l-8 31 13-23q6-5 9 1l-11 30 12-16q6-4 9 2l-9 23q-6 21-30 23l-16 8Z" fill="#efbd98" stroke="#b27a5f" stroke-width="3"/>';
    const faucet = '<path d="M116 24h36v30h-18V40h-18Z" fill="#94b9c5" stroke="#557e8c" stroke-width="3"/><path d="M130 21v-8m-11 0h23" stroke="#557e8c" stroke-width="5"/>';
    const bubbles = '<g fill="#eefcff" stroke="#7ec6dd" stroke-width="2"><circle cx="84" cy="86" r="12"/><circle cx="103" cy="87" r="9"/><circle cx="75" cy="100" r="8"/><circle cx="96" cy="105" r="11"/><circle cx="66" cy="80" r="6"/></g>';
    let drawing = '';
    if (story !== 'hands') {
      drawing = soil;
      if (step === 'seed') drawing += seed + '<path d="M87 42v46m-7-9l7 9 7-9" stroke="#66878f" stroke-width="3" fill="none" stroke-dasharray="4 3"/><path d="M111 28l-28 9q-11 5-5 12l16-3 14 7 34-7-2-21Z" fill="#efbd98" stroke="#b27a5f" stroke-width="3"/><ellipse cx="87" cy="59" rx="7" ry="5" fill="#f3cb74"/>';
      if (step === 'water') drawing += seed + '<path d="M20 27h35l7 26-32 9-12-24h-9v-10h12m32 7l19-8 11 10-23 13" fill="#69b7b1" stroke="#35847e" stroke-width="3"/>' + rain;
      if (step === 'sprout') drawing += seed + leaves;
      if (step === 'grown') drawing += story === 'bean' ? grownBean : carrot;
      if (step === 'harvest') {
        drawing += story === 'bean'
          ? grownBean + '<path d="M113 90h50l-5 45h-39Z" fill="#e6b879" stroke="#a57945" stroke-width="3"/><path d="M118 100q19-49 40 0" fill="none" stroke="#a57945" stroke-width="4"/><path d="M127 108q-10 22 3 23q13-8 6-23M145 104q-11 20 2 25q14-4 7-23" fill="#a3ca61" stroke="#44834c" stroke-width="2"/>'
          : '<g transform="translate(0 -40)">' + carrot + '</g><path d="M82 125v-25m-7 8l7-8 7 8" fill="none" stroke="#66878f" stroke-width="3"/><path d="M116 18l-24 8q-13 7-5 12l18-4 10 10 33-13-7-18Z" fill="#efbd98" stroke="#b27a5f" stroke-width="3"/>';
      }
      if (step === 'ice') drawing = '<g fill="#c8f0f9" stroke="#68b5d3" stroke-width="3"><path d="M25 70l24-20 43 11v57l-42 9-25-20Z"/><path d="M90 79l23-28 39 16v60l-40 8-22-15Z"/></g><path d="M33 77l17 8 34-12m-34 12v31m47-31l17 10 31-14m-31 14v32" fill="none" stroke="#fff" stroke-width="4"/><ellipse cx="86" cy="49" rx="10" ry="7" fill="#f3cb74"/>';
      if (step === 'paint') drawing += '<path d="M23 62h55v64H23Z" fill="#d690ca" stroke="#9a6092" stroke-width="3"/><path d="M26 64q22-40 48 0" fill="none" stroke="#667d8b" stroke-width="4"/><path d="M93 33l11-6 27 58-12 6Z" fill="#d5ab71"/><path d="M119 84l18 3 10 25-30 2Z" fill="#b16ab0"/><path d="M107 116q25-15 46 4" fill="none" stroke="#b16ab0" stroke-width="10"/>';
    } else {
      drawing = '<rect x="12" y="122" width="156" height="16" rx="8" fill="#c7e4e7"/>' + hand;
      if (step === 'wet' || step === 'rinse') drawing += faucet + '<path d="M138 60l-7 33m16-32l-7 42m-2 7l-4 9" stroke="#59bce5" stroke-width="5" stroke-linecap="round"/>';
      if (step === 'wet') drawing += '<g fill="#976a43"><circle cx="73" cy="99" r="4"/><circle cx="89" cy="90" r="3"/></g>';
      if (step === 'soap') {
        drawing += '<rect x="118" y="25" width="34" height="41" rx="8" fill="#f8c573" stroke="#d59444" stroke-width="3"/><path d="M134 24V14h20m-11 7h12" stroke="#d59444" stroke-width="4"/><path d="M151 34q-7 12 0 12t0-12" fill="#75c5e2"/>' + bubbles;
        if (this.mode === 'easy') drawing += '<g transform="translate(-100 0)">' + faucet + '</g><path d="M39 61l-4 17m14-17l-4 24" stroke="#59bce5" stroke-width="4" stroke-linecap="round"/>';
      }
      if (step === 'scrub') drawing += '<g transform="translate(173 16) scale(-.9 .9)">' + hand + '</g>' + bubbles + '<path d="M42 49q17-22 34-13m-9-8l9 8-12 4M127 118q-13 19-32 12m8 9l-8-9 13-2" fill="none" stroke="#55858c" stroke-width="3"/>';
      if (step === 'rinse') drawing += '<g fill="#f4fcff" stroke="#7ec6dd" stroke-width="2"><circle cx="113" cy="114" r="5"/><circle cx="125" cy="124" r="4"/></g>';
      if (step === 'dry') drawing = '<path d="M32 26h122v105H32Z" fill="#ffe2a6" stroke="#c59c56" stroke-width="3"/><path d="M40 32v94m106-94v94M34 115h118" stroke="#e6b767" stroke-width="4"/>' + hand + '<path d="M130 55v18m-9-9h18m-19 30v12m-6-6h12" stroke="#fff" stroke-width="4"/>';
      if (step === 'mud') drawing += '<path d="M33 114q-10-20 19-19q2-17 24-8q23-10 36 8q31-9 38 21q-43 25-117-2Z" fill="#916444"/><path d="M55 95l10 5m28-8l12 7m20 9l7 3" stroke="#bc916b" stroke-width="4"/>';
    }
    return `<svg class="sgr-picture" viewBox="0 0 180 150" aria-hidden="true" focusable="false"><rect x="2" y="2" width="176" height="146" rx="20" fill="${story === 'hands' ? '#eff9fb' : '#f2f9e7'}"/><circle cx="151" cy="26" r="13" fill="${story === 'hands' ? '#dceef2' : '#ffe39a'}"/>${drawing}</svg>`;
  }
}
