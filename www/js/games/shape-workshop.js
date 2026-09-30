/* Five quiet, untimed building projects. Geometry is original inline SVG. */
class ShapeWorkshop extends ExplorerActivity {
  constructor(container, app) {
    super(container, app);
    this.mode = null;
    this.screen = 'menu';
    this.round = 0;
    this.score = 0;
    this.awarded = false;
    this.selected = null;
    this.placed = new Map();
    this.used = new Set();
    this.message = 'instruction';
    this.words = {
      vi: {
        title: 'Xưởng Lắp Ghép', intro: 'Ghép 5 món đồ chơi cho ngôi làng của em!',
        easy: 'Dễ', medium: 'Vừa', hard: 'Khó',
        easyInfo: '3 mảnh ghép', mediumInfo: '5–6 mảnh ghép', hardInfo: 'Chọn đúng kích thước và hướng',
        instruction: 'Kéo mảnh ghép vào bóng hình, hoặc chọn mảnh rồi chọn bóng hình. Không cần vội!',
        hardInstruction: 'Nhìn cả kích thước và hướng. Chọn mảnh rồi chọn bóng hình, hoặc kéo để ghép.',
        listen: 'Nghe hướng dẫn', tray: 'Khay mảnh ghép', board: 'Bóng hình cần ghép',
        selected: 'Đã chọn', choose: 'Chọn một mảnh trong khay trước nhé.',
        wrong: 'Thử mảnh khác nhé! Nhìn đường viền của bóng hình.',
        wrongSize: 'Đúng hình rồi! Thử mảnh có kích thước giống bóng hình nhé.',
        wrongAngle: 'Đúng hình rồi! Tìm mảnh quay cùng hướng với bóng hình nhé.',
        match: 'Khớp rồi! Em ghép tiếp nhé.', complete: 'Tuyệt vời! Đồ chơi của em đã sẵn sàng!',
        next: 'Đồ chơi tiếp theo', galleryButton: 'Xem ngôi làng', gallery: 'Ngôi làng đồ chơi của em',
        reward: 'Em đã tạo đủ 5 đồ chơi và nhận 5 ngôi sao!',
        replay: 'Chơi lại mức này', menu: 'Chọn mức chơi', object: 'Đồ chơi', piece: 'Mảnh',
        target: 'Bóng hình', filled: 'Đã ghép', small: 'nhỏ', large: 'lớn',
        up: 'hướng lên', right: 'hướng phải', down: 'hướng xuống', left: 'hướng trái',
        horizontal: 'nằm ngang', vertical: 'thẳng đứng',
        circle: 'hình tròn', square: 'hình vuông', triangle: 'hình tam giác', rectangle: 'hình chữ nhật',
        house: 'Ngôi nhà', rocket: 'Tên lửa', train: 'Tàu hỏa', robot: 'Rô-bốt', boat: 'Thuyền buồm',
      },
      en: {
        title: 'Shape Workshop', intro: 'Build 5 toys for your own little village!',
        easy: 'Easy', medium: 'Medium', hard: 'Hard',
        easyInfo: '3 pieces', mediumInfo: '5–6 pieces', hardInfo: 'Match size and direction',
        instruction: 'Drag a piece onto its shadow, or choose a piece and then a shadow. Take your time!',
        hardInstruction: 'Look at size and direction too. Choose a piece and then a shadow, or drag to fit.',
        listen: 'Listen to instructions', tray: 'Piece tray', board: 'Shadows to build on',
        selected: 'Selected', choose: 'Choose a piece from the tray first.',
        wrong: 'Try another piece! Look at the outline of the shadow.',
        wrongSize: 'Right shape! Try a piece the same size as the shadow.',
        wrongAngle: 'Right shape! Find a piece pointing the same way as the shadow.',
        match: 'It fits! Keep building.', complete: 'Wonderful! Your toy is ready!',
        next: 'Next toy', galleryButton: 'See the village', gallery: 'Your toy village',
        reward: 'You built all 5 toys and earned 5 stars!',
        replay: 'Play this level again', menu: 'Choose a level', object: 'Toy', piece: 'Piece',
        target: 'Shadow', filled: 'Placed', small: 'small', large: 'large',
        up: 'pointing up', right: 'pointing right', down: 'pointing down', left: 'pointing left',
        horizontal: 'horizontal', vertical: 'vertical',
        circle: 'circle', square: 'square', triangle: 'triangle', rectangle: 'rectangle',
        house: 'House', rocket: 'Rocket', train: 'Train', robot: 'Robot', boat: 'Sailboat',
      },
    };
    // x/y are centers in a square canvas; extent leaves separate, tappable regions.
    this.projects = [
      { model: 'house',
        easy: [['triangle', 50, 25, 42], ['square', 34, 65, 32], ['rectangle', 70, 65, 28, 90]],
        full: [['triangle', 50, 20, 34], ['square', 30, 52, 27], ['square', 70, 52, 27],
          ['rectangle', 50, 79, 23, 90], ['circle', 18, 80, 24], ['circle', 82, 80, 24]] },
      { model: 'rocket',
        easy: [['triangle', 50, 19, 30], ['rectangle', 50, 52, 38, 90], ['circle', 50, 86, 23]],
        full: [['triangle', 50, 15, 26], ['rectangle', 50, 44, 32, 90], ['triangle', 20, 64, 26],
          ['triangle', 80, 64, 26], ['rectangle', 50, 79, 25, 90]] },
      { model: 'train',
        easy: [['rectangle', 50, 37, 65], ['circle', 28, 73, 28], ['circle', 72, 73, 28]],
        full: [['rectangle', 28, 47, 37], ['square', 73, 40, 33], ['rectangle', 20, 19, 20, 90],
          ['circle', 22, 76, 22], ['circle', 52, 76, 22], ['circle', 80, 76, 22]] },
      { model: 'robot',
        easy: [['square', 50, 20, 28], ['rectangle', 50, 54, 42], ['circle', 50, 84, 24]],
        full: [['square', 50, 20, 27], ['rectangle', 50, 52, 32],
          ['rectangle', 17, 52, 24, 90], ['rectangle', 83, 52, 24, 90],
          ['square', 32, 84, 23], ['square', 68, 84, 23]] },
      { model: 'boat',
        easy: [['triangle', 29, 34, 36], ['triangle', 71, 34, 36], ['rectangle', 50, 77, 68]],
        full: [['triangle', 27, 37, 31], ['triangle', 73, 37, 31],
          ['rectangle', 50, 34, 23, 90], ['rectangle', 50, 72, 60],
          ['circle', 20, 89, 22], ['circle', 80, 89, 22]] },
    ];
  }

  get text() { return this.words[this.lang === 'en' ? 'en' : 'vi']; }
  get project() { return this.projects[this.round]; }

  start() {
    if (this.destroyed) return;
    this.showMenu();
  }

  showMenu() {
    if (this.destroyed) return;
    this.clearTimers();
    this.screen = 'menu';
    this.score = 0;
    this.selected = null;
    this.updateHUD();
    this.render();
  }

  startMode(mode) {
    if (this.destroyed || !['easy', 'medium', 'hard'].includes(mode)) return;
    this.clearTimers();
    this.mode = mode;
    this.round = 0;
    this.score = 0;
    this.awarded = false;
    this.beginRound();
  }

  beginRound() {
    this.screen = 'build';
    this.selected = null;
    this.placed = new Map();
    this.used = new Set();
    this.message = 'instruction';
    const layout = this.mode === 'easy' ? this.project.easy : this.project.full;
    this.targets = layout.map(([shape, x, y, extent, angle = 0], index) => ({
      id: `t${index}`, shape, x, y, extent, angle,
      size: this.mode === 'hard' && index % 3 === 2 ? 'small' : 'large',
    }));
    const colors = ['#f77658', '#47a8cf', '#efb943', '#9880d8', '#5ab692', '#e782ac'];
    this.pieces = this.targets.map((target, index) => ({
      ...target, id: `p${index}`, color: colors[index % colors.length],
    }));
    if (this.mode === 'medium') {
      const absentShape = ['circle', 'square', 'triangle', 'rectangle']
        .find(shape => !this.targets.some(target => target.shape === shape));
      const shape = absentShape || 'rectangle';
      const angle = absentShape ? 0 : [0, 90]
        .find(direction => !this.targets.some(target => target.shape === shape && target.angle === direction));
      this.pieces.push({ id: 'd-medium', shape, angle, size: 'large', color: '#e782ac' });
    }
    if (this.mode === 'hard') {
      const reference = this.pieces.find(piece => ['triangle', 'rectangle'].includes(piece.shape));
      this.pieces.push({ ...reference, id: 'd-size', size: reference.size === 'large' ? 'small' : 'large' });
      this.pieces.push({ ...reference, id: 'd-angle', angle: (reference.angle + 90) % 360 });
    }
    // A stable mixed tray is predictable for children but never mirrors target order.
    this.pieces = this.pieces.filter((_, i) => i % 2).reverse()
      .concat(this.pieces.filter((_, i) => !(i % 2)));
    this.updateHUD();
    this.render();
  }

  updateHUD() {
    const score = document.getElementById('score-val');
    if (score) score.textContent = `${this.score}/5`;
  }

  updateLanguage(lang) {
    if (this.destroyed) return;
    this.lang = lang;
    this.render();
  }

  instruction() {
    return this.text[this.mode === 'hard' ? 'hardInstruction' : 'instruction'];
  }

  describe(piece) {
    const t = this.text;
    const details = [t[piece.shape]];
    if (this.mode === 'hard') details.push(t[piece.size]);
    if (piece.shape === 'triangle') details.push(t[['up', 'right', 'down', 'left'][piece.angle / 90]]);
    if (piece.shape === 'rectangle') details.push(t[piece.angle % 180 ? 'vertical' : 'horizontal']);
    return details.join(', ');
  }

  createDragGhost(source) {
    const ghost = super.createDragGhost(source);
    const shape = source.querySelector('.swp-shape');
    const style = getComputedStyle(shape);
    const preview = shape.cloneNode(true);
    preview.style.width = style.width;
    preview.style.height = style.height;
    ghost.classList.add('swp-drag-ghost');
    ghost.replaceChildren(preview);
    return ghost;
  }

  shapeSVG(piece, ghost = false) {
    const shapes = {
      circle: '<circle cx="50" cy="50" r="40"/>',
      square: '<rect x="10" y="10" width="80" height="80" rx="4"/>',
      triangle: '<path d="M50 8 L94 88 L6 88 Z"/>',
      rectangle: '<rect x="5" y="25" width="90" height="50" rx="4"/>',
    };
    return `<svg class="swp-shape${piece.size === 'small' ? ' swp-shape-small' : ''}" viewBox="0 0 100 100"
      aria-hidden="true" focusable="false" style="--swp-color:${ghost ? '#dce4ed' : piece.color}">
      <g transform="rotate(${piece.angle} 50 50)">${shapes[piece.shape]}</g></svg>`;
  }

  feedback() {
    if (this.message === 'instruction') return this.instruction();
    if (this.message === 'selected') {
      const piece = this.pieces.find(item => item.id === this.selected);
      return piece ? `${this.text.selected}: ${this.describe(piece)}.` : this.instruction();
    }
    return this.text[this.message];
  }

  softSound(method) {
    if (this.destroyed || window.speechSynthesis?.speaking || window.speechSynthesis?.pending) return;
    if (typeof audio !== 'undefined' && typeof audio[method] === 'function') audio[method]();
  }

  selectPiece(id) {
    if (this.destroyed || this.screen !== 'build' || this.used.has(id)) return;
    this.selected = id;
    this.message = 'selected';
    this.softSound('playTap');
    this.refreshBuild();
  }

  placePiece(sourceId, targetId) {
    if (this.destroyed || this.screen !== 'build' || this.used.has(sourceId) || this.placed.has(targetId)) return;
    const source = this.pieces.find(piece => piece.id === sourceId);
    const target = this.targets.find(piece => piece.id === targetId);
    if (!target) return;
    if (!source) {
      this.message = 'choose';
      this.refreshBuild();
      return;
    }
    if (source.shape !== target.shape || source.size !== target.size || source.angle !== target.angle) {
      this.message = source.shape !== target.shape ? 'wrong' : source.size !== target.size ? 'wrongSize' : 'wrongAngle';
      this.refreshBuild();
      return;
    }
    this.used.add(sourceId);
    this.placed.set(targetId, sourceId);
    this.selected = null;
    this.message = 'match';
    this.softSound('playMatch');
    if (this.placed.size === this.targets.length) {
      this.score++;
      this.screen = 'reward';
      this.updateHUD();
      if (this.score === 5 && !this.awarded) {
        this.awarded = true;
        this.app.addStars(5);
      }
      this.render();
      this.container.querySelector('[data-swp-next]')?.focus({ preventScroll: true });
    } else {
      this.refreshBuild();
      this.container.querySelector('.swp-piece:not(:disabled)')?.focus({ preventScroll: true });
    }
  }

  next() {
    if (this.destroyed || this.screen !== 'reward') return;
    if (this.round === 4) {
      this.screen = 'gallery';
      this.render();
    } else {
      this.round++;
      this.beginRound();
    }
  }

  // Update existing buttons while dragging; replacing DOM would abort pointer capture.
  refreshBuild() {
    if (this.destroyed || this.screen !== 'build') return;
    for (const piece of this.pieces) {
      const button = this.container.querySelector(`[data-drag-id="${piece.id}"]`);
      button.disabled = this.used.has(piece.id);
      button.classList.toggle('swp-used', button.disabled);
      button.setAttribute('aria-pressed', String(this.selected === piece.id));
    }
    for (const target of this.targets) {
      const button = this.container.querySelector(`[data-drop-id="${target.id}"]`);
      if (!this.placed.has(target.id) || button.disabled) continue;
      const piece = this.pieces.find(item => item.id === this.placed.get(target.id));
      button.disabled = true;
      button.classList.add('swp-filled');
      button.setAttribute('aria-label', `${this.text.filled}: ${this.describe(target)}`);
      button.querySelector('svg').style.setProperty('--swp-color', piece.color);
    }
    const status = this.container.querySelector('.swp-feedback');
    status.textContent = this.feedback();
    status.dataset.message = this.message;
    this.container.querySelector('.swp-piece-count').textContent = `${this.placed.size}/${this.targets.length}`;
  }

  render() {
    if (this.destroyed) return;
    const t = this.text;
    const active = document.activeElement;
    const focusKey = this.container.contains(active) ? active?.dataset.swpFocus : null;
    this.prepareRender();
    let body;
    if (this.screen === 'menu') {
      body = `<div class="swp-menu"><div class="swp-menu-mascot">${this.modelMarkup('robot', t.robot, 'animate')}</div>
        <p>${t.intro}</p><div class="swp-modes">
        ${['easy', 'medium', 'hard'].map((mode, i) => `<button type="button" class="swp-mode swp-button"
          data-swp-mode="${mode}" data-level="${mode}" data-swp-focus="${mode}"><span aria-hidden="true">${['🏠', '🚀', '🤖'][i]}</span>
          <strong>${t[mode]}</strong><small>${t[`${mode}Info`]}</small></button>`).join('')}</div></div>`;
    } else if (this.screen === 'gallery') {
      body = `<div class="swp-gallery"><h3>${t.gallery}</h3><p class="swp-stars" aria-hidden="true">★ ★ ★ ★ ★</p>
        <p>${t.reward}</p><div class="swp-village">${this.projects.map(project => `<figure class="swp-toy">
          ${this.modelMarkup(project.model, t[project.model], 'animate')}<figcaption>${t[project.model]}</figcaption></figure>`).join('')}</div>
        <div class="swp-actions"><button class="swp-button" data-swp-replay data-swp-focus="replay">${t.replay}</button>
        <button class="swp-button swp-secondary" data-swp-menu data-swp-focus="menu">${t.menu}</button></div></div>`;
    } else {
      body = `<div class="swp-round-heading"><h3>${t.object} ${this.round + 1}/5 · ${t[this.project.model]}</h3>
        <span class="swp-level">${t[this.mode]}</span></div>`;
      if (this.screen === 'reward') {
        body += `<div class="swp-reward"><p class="swp-celebrate" aria-hidden="true">✨ ★ ✨</p>
          <p role="status">${t.complete}</p><div class="swp-reward-toy">${this.modelMarkup(this.project.model, t[this.project.model], 'animate')}</div>
          <button class="swp-button" data-swp-next data-swp-focus="next">${this.round === 4 ? t.galleryButton : t.next}</button></div>`;
      } else {
        body += `<p class="swp-instruction">${this.instruction()}</p><div class="swp-workspace">
          <section class="swp-board-area" aria-label="${t.board}"><div class="swp-board">
          ${this.targets.map(target => {
            const placed = this.pieces.find(piece => piece.id === this.placed.get(target.id));
            return `<button type="button" class="swp-target${placed ? ' swp-filled' : ''}" data-drop-id="${target.id}"
              data-swp-focus="${target.id}" data-shape="${target.shape}" data-size="${target.size}" data-angle="${target.angle}"
              aria-label="${placed ? t.filled : t.target} ${Number(target.id.slice(1)) + 1}: ${this.describe(target)}"
              style="left:${target.x}%;top:${target.y}%;width:${target.extent}%;height:${target.extent}%" ${placed ? 'disabled' : ''}>
              ${this.shapeSVG(placed || target, !placed)}</button>`;
          }).join('')}</div><span class="swp-piece-count" aria-label="${t.filled}">${this.placed.size}/${this.targets.length}</span></section>
          <section class="swp-tray-area" aria-label="${t.tray}"><h4>${t.tray}</h4><div class="swp-tray">
          ${this.pieces.map((piece, i) => `<button type="button" class="swp-piece${this.used.has(piece.id) ? ' swp-used' : ''}"
            data-drag-id="${piece.id}" data-swp-focus="${piece.id}" data-shape="${piece.shape}" data-size="${piece.size}" data-angle="${piece.angle}"
            aria-label="${t.piece} ${i + 1}: ${this.describe(piece)}" aria-pressed="${this.selected === piece.id}"
            ${this.used.has(piece.id) ? 'disabled' : ''}>${this.shapeSVG(piece)}<span class="swp-piece-name">${t[piece.shape]}</span></button>`).join('')}
          </div></section></div><p class="swp-feedback" role="status" aria-live="polite" aria-atomic="true" data-message="${this.message}">${this.feedback()}</p>`;
      }
    }
    this.container.innerHTML = `<section class="swp-game" data-swp-screen="${this.screen}" data-swp-round="${this.round}" lang="${this.lang}">
      <header class="swp-header"><h2>${t.title}</h2><button type="button" class="swp-listen swp-button swp-secondary"
      data-swp-listen data-swp-focus="listen" aria-label="${t.listen}">🔊 <span>${t.listen}</span></button></header>${body}</section>`;
    this.container.querySelector('[data-swp-listen]').onclick = () => {
      const instruction = this.screen === 'menu' ? t.intro : this.screen === 'gallery' ? t.reward :
        this.screen === 'reward' ? `${t[this.project.model]}. ${t.complete}` : `${t[this.project.model]}. ${this.instruction()}`;
      this.speak(instruction);
    };
    this.container.querySelectorAll('[data-swp-mode]').forEach(button => {
      button.onclick = () => this.startMode(button.dataset.swpMode);
    });
    this.container.querySelector('[data-swp-next]')?.addEventListener('click', () => this.next());
    this.container.querySelector('[data-swp-replay]')?.addEventListener('click', () => this.startMode(this.mode));
    this.container.querySelector('[data-swp-menu]')?.addEventListener('click', () => this.showMenu());
    if (this.screen === 'build') {
      this.container.querySelectorAll('[data-drag-id]').forEach(button => {
        button.onclick = () => this.selectPiece(button.dataset.dragId);
      });
      this.container.querySelectorAll('[data-drop-id]').forEach(button => {
        button.onclick = () => this.placePiece(this.selected, button.dataset.dropId);
      });
      this.bindDragDrop('.swp-piece:not(:disabled)', '.swp-target:not(:disabled)',
        (sourceId, targetId) => this.placePiece(sourceId, targetId));
    }
    if (focusKey) this.container.querySelector(`[data-swp-focus="${focusKey}"]`)?.focus({ preventScroll: true });
  }
}
