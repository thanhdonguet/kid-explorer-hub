/* ================================================================
   Color Mix Lab – Phòng Thí Nghiệm Màu Sắc  v1.0
   Features (Phase "Học"):
   - 9 draggable color bubbles (primary + secondary + white/black)
   - Perceptual subtractive blend as bubbles enter mixing bowl
   - Web Speech API reads color name on mousedown, result on drop
   - Touch-first: touchstart/touchmove/touchend with preventDefault
   - Particle effects on drop
   - Reset button
   ================================================================ */

class ColorMixLab {
  constructor(container, app) {
    this.container = container;
    this.app       = app;
    this.lang      = app ? app.lang : 'vi';

    // ── Color Palette (20 basic colors) ──
    this.COLORS = [
      { id: 'red',       hex: '#FF0000', r: 255, g:   0, b:   0, vi: 'Đỏ',         en: 'Red'       },
      { id: 'orange',    hex: '#FFA500', r: 255, g: 165, b:   0, vi: 'Cam',        en: 'Orange'    },
      { id: 'yellow',    hex: '#FFFF00', r: 255, g: 255, b:   0, vi: 'Vàng',       en: 'Yellow'    },
      { id: 'green',     hex: '#00FF00', r:   0, g: 255, b:   0, vi: 'Lục',        en: 'Green'     },
      { id: 'blue',      hex: '#0000FF', r:   0, g:   0, b: 255, vi: 'Lam',        en: 'Blue'      },
      { id: 'indigo',    hex: '#4B0082', r:  75, g:   0, b: 130, vi: 'Chàm',       en: 'Indigo'    },
      { id: 'purple',    hex: '#800080', r: 128, g:   0, b: 128, vi: 'Tím',        en: 'Purple'    },
      { id: 'pink',      hex: '#FFC0CB', r: 255, g: 192, b: 203, vi: 'Hồng',       en: 'Pink'      },
      { id: 'white',     hex: '#FFFFFF', r: 255, g: 255, b: 255, vi: 'Trắng',      en: 'White'     },
      { id: 'black',     hex: '#000000', r:   0, g:   0, b:   0, vi: 'Đen',        en: 'Black'     },
      // 10 new colors
      { id: 'coral',     hex: '#FF7F50', r: 255, g: 127, b:  80, vi: 'San hô',     en: 'Coral'     },
      { id: 'gold',      hex: '#FFD700', r: 255, g: 215, b:   0, vi: 'Vàng kim',   en: 'Gold'      },
      { id: 'cyan',      hex: '#00FFFF', r:   0, g: 255, b: 255, vi: 'Xanh lơ',    en: 'Cyan'      },
      { id: 'magenta',   hex: '#FF00FF', r: 255, g:   0, b: 255, vi: 'Cánh sen',   en: 'Magenta'   },
      { id: 'brown',     hex: '#8B4513', r: 139, g:  69, b:  19, vi: 'Nâu',        en: 'Brown'     },
      { id: 'gray',      hex: '#808080', r: 128, g: 128, b: 128, vi: 'Xám',        en: 'Gray'      },
      { id: 'lime',      hex: '#32CD32', r:  50, g: 205, b:  50, vi: 'Xanh chanh', en: 'Lime'      },
      { id: 'turquoise', hex: '#40E0D0', r:  64, g: 224, b: 208, vi: 'Ngọc lâm',   en: 'Turquoise' },
      { id: 'maroon',    hex: '#800000', r: 128, g:   0, b:   0, vi: 'Đỏ sẫm',     en: 'Maroon'    },
      { id: 'navy',      hex: '#000080', r:   0, g:   0, b: 128, vi: 'Xanh hải',   en: 'Navy'      },
    ];

    // ── State ──
    this.mixedColors   = [];   // array of COLORS objects in the bowl
    this.dragging      = null; // { colorObj, ghostEl, startX, startY, bowl }
    this.speechEnabled = true;
    this.active        = false;
    this.currentApiName = null;
    this.currentMix = null;
    this.MAX_DROPS = 8;

    if (window.TTS) window.TTS.warm();
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  start() {
    this.active = true;
    this._render();
    this._bindGlobalEvents();
  }

  destroy() {
    this.active = false;
    this._unbindGlobalEvents();

    // The drag ghost lives on document.body – leaving mid-drag would strand it
    // on top of the dashboard forever.
    if (this.dragging && this.dragging.ghost) this.dragging.ghost.remove();
    this.dragging = null;
    document.querySelectorAll('.cmx-drag-ghost').forEach(el => el.remove());

    this.container.innerHTML = '';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  updateLanguage(lang) {
    this.lang = lang;
    // The result panel shows the English AND Vietnamese name side by side at all
    // times, so it needs no language switch – only the chrome below does.
    // Update palette bubble titles
    this.COLORS.forEach(c => {
      const el = this.container.querySelector(`[data-color-id="${c.id}"] .cmx-bubble-label`);
      if (el) el.textContent = lang === 'vi' ? c.vi : c.en;
      this.container.querySelector(`#bubble-${c.id}`)?.setAttribute('aria-label', lang === 'vi' ? c.vi : c.en);
    });
    // Update UI text
    const ph = this.container.querySelector('.cmx-bowl-placeholder');
    if (ph) ph.textContent = lang === 'vi' ? 'Kéo màu vào đây' : 'Drag colors here';
    const resetBtn = this.container.querySelector('#cmx-reset-btn');
    if (resetBtn) resetBtn.textContent = lang === 'vi' ? '🗑️ Đổ ra' : '🗑️ Clear';
    const bottomLabel = this.container.querySelector('.cmx-palette-bottom-label');
    if (bottomLabel) bottomLabel.textContent = lang === 'vi' ? '🎨 Thêm màu' : '🎨 More colors';
  }

  _text(key) {
    const strings = {
      bowlFull: { vi: `Bát đã đầy ${this.MAX_DROPS} màu rồi!`, en: `The bowl is full after ${this.MAX_DROPS} colors!` },
    };
    return strings[key]?.[this.lang] || strings[key]?.en || '';
  }

  /* ================================================================
     RENDER
     ================================================================ */
  _render() {
    this.container.innerHTML = '';

    const t = {
      phaseLabel:  this.lang === 'vi' ? '🔬 Phần Học – Pha Màu'  : '🔬 Learn – Mix Colors',
      dragHint:    this.lang === 'vi' ? 'Kéo màu vào đây'         : 'Drag colors here',
      resultLabel: this.lang === 'vi' ? 'Màu kết quả'             : 'Result Color',
      resetBtn:    this.lang === 'vi' ? '🗑️ Đổ ra'               : '🗑️ Clear',
    };

    const colorsTop = this.COLORS.slice(0, 10);
    const colorsBottom = this.COLORS.slice(10);

    const renderBubble = (c) => `
      <div class="cmx-bubble-wrap" data-color-id="${c.id}">
        <button type="button" class="cmx-bubble" aria-label="${this.lang === 'vi' ? c.vi : c.en}"
             id="bubble-${c.id}"
             data-color-id="${c.id}"
             style="background: radial-gradient(circle at 35% 30%, ${this._lighten(c.hex, 40)}, ${c.hex} 60%, ${this._darken(c.hex, 20)});">
          <kid-model model="potion" color="${c.hex}" aria-label="${c.en}"><span class="model-fallback" style="background:${c.hex};border-radius:50%"></span></kid-model>
        </button>
        <span class="cmx-bubble-label">${this.lang === 'vi' ? c.vi : c.en}</span>
      </div>
    `;

    this.container.innerHTML = `
      <div class="cmx-wrapper" id="cmx-wrapper">

        <!-- Main 3-column layout (top) -->
        <div class="cmx-main">

          <!-- LEFT: Primary Palette (10 colors) -->
          <div class="cmx-palette" id="cmx-palette">
            ${colorsTop.map(renderBubble).join('')}
          </div>

          <!-- CENTER: Mixing Bowl -->
          <div class="cmx-center">
            <div class="cmx-bowl-area">
              <div class="cmx-bowl" id="cmx-bowl">
                <kid-model id="cmx-bowl-model" model="bowl" color="#c1d5bf" aria-label="Bát pha màu"><span class="model-fallback" style="border:6px solid #bfcfb9;border-radius:50%"></span></kid-model>
                <div class="cmx-bowl-liquid" id="cmx-liquid"></div>
                <div class="cmx-bowl-chips" id="cmx-chips"></div>
                <div class="cmx-bowl-placeholder" id="cmx-placeholder">${t.dragHint}</div>
                <div class="cmx-bowl-shine"></div>
              </div>
              <div class="cmx-bowl-base"></div>
            </div>
            <button class="cmx-reset-btn" id="cmx-reset-btn">${t.resetBtn}</button>
          </div>

          <!-- RIGHT: Result Display -->
          <div class="cmx-result" id="cmx-result">
            <div class="cmx-result-preview" id="cmx-result-preview">
              <kid-model model="potion" color="#d9c8df" aria-label="Màu kết quả"><span class="model-fallback">✦</span></kid-model>
            </div>
            <div class="cmx-result-info" id="cmx-result-info">
              <div class="cmx-result-label">${t.resultLabel}</div>
              <div class="cmx-result-name-en" id="cmx-result-name-en">—</div>
              <div class="cmx-result-name-vi" id="cmx-result-name-vi">—</div>
              <div class="cmx-result-hex"  id="cmx-result-hex"></div>
              <div class="cmx-result-chips" id="cmx-result-chips"></div>
            </div>
          </div>
        </div>

        <!-- Bottom: Extended Palette (10 extra colors) -->
        <div class="cmx-palette-bottom" id="cmx-palette-bottom">
          <div class="cmx-palette-bottom-label">${this.lang === 'vi' ? '🎨 Thêm màu' : '🎨 More colors'}</div>
          <div class="cmx-palette-bottom-grid">
            ${colorsBottom.map(renderBubble).join('')}
          </div>
        </div>

        <!-- Particle layer -->
        <div class="cmx-particles" id="cmx-particles"></div>
      </div>
    `;

    this._bindBubbleEvents();
    this._bindBowlEvents();

    document.getElementById('cmx-reset-btn').addEventListener('click', () => {
      this._resetBowl();
    });

    document.getElementById('cmx-result').addEventListener('click', () => {
      if (this.mixedColors.length > 0 && this.currentApiName) {
        this._speakColorResult(this.currentApiName);
      }
    });
  }

  /* ================================================================
     DRAG EVENTS (Mouse + Touch unified)
     ================================================================ */
  _bindBubbleEvents() {
    this.COLORS.forEach(colorObj => {
      const el = document.getElementById(`bubble-${colorObj.id}`);
      if (!el) return;
      el.addEventListener('click', (e) => {
        if (e.detail !== 0) return;
        if (this.mixedColors.length >= this.MAX_DROPS) { this._showBowlFull(); return; }
        const rect = document.getElementById('cmx-bowl').getBoundingClientRect();
        this._dropColorInBowl(colorObj, rect.left + rect.width / 2, rect.top + rect.height / 2);
      });

      // ── Mouse ──
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._speakColor(colorObj);
        this._startDrag(colorObj, e.clientX, e.clientY);
      });

      // ── Touch ──
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        this._speakColor(colorObj);
        this._startDrag(colorObj, touch.clientX, touch.clientY);
      }, { passive: false });
    });
  }

  _bindGlobalEvents() {
    this._onMouseMove = (e) => this._moveDrag(e.clientX, e.clientY);
    this._onMouseUp   = (e) => this._endDrag(e.clientX, e.clientY);
    this._onTouchMove = (e) => {
      if (!this.dragging) return;
      e.preventDefault();
      const t = e.touches[0];
      this._moveDrag(t.clientX, t.clientY);
    };
    this._onTouchEnd  = (e) => {
      if (e.type === 'touchcancel') { this._endDrag(NaN, NaN); return; }
      const t = e.changedTouches[0];
      if (!t) return;
      this._endDrag(t.clientX, t.clientY);
    };

    document.addEventListener('mousemove',  this._onMouseMove);
    document.addEventListener('mouseup',    this._onMouseUp);
    document.addEventListener('touchmove',  this._onTouchMove, { passive: false });
    document.addEventListener('touchend',   this._onTouchEnd);
    document.addEventListener('touchcancel',this._onTouchEnd);
  }

  _unbindGlobalEvents() {
    document.removeEventListener('mousemove',  this._onMouseMove);
    document.removeEventListener('mouseup',    this._onMouseUp);
    document.removeEventListener('touchmove',  this._onTouchMove);
    document.removeEventListener('touchend',   this._onTouchEnd);
    document.removeEventListener('touchcancel',this._onTouchEnd);
  }

  _bindBowlEvents() {
    // Nothing needed – drop detection uses coordinate check in _endDrag
  }

  _startDrag(colorObj, clientX, clientY) {
    if (this.dragging) return;

    // Create ghost bubble that follows cursor
    const ghost = document.createElement('div');
    ghost.className = 'cmx-drag-ghost';
    ghost.style.background = `radial-gradient(circle at 35% 30%, ${this._lighten(colorObj.hex, 40)}, ${colorObj.hex} 60%, ${this._darken(colorObj.hex, 20)})`;
    ghost.style.left = `${clientX}px`;
    ghost.style.top  = `${clientY}px`;
    document.body.appendChild(ghost);

    this.dragging = { colorObj, ghost, startX: clientX, startY: clientY };

    // Dim source bubble
    const src = document.getElementById(`bubble-${colorObj.id}`);
    if (src) src.classList.add('cmx-bubble-dragging');

    // Highlight bowl as drop target
    const bowl = document.getElementById('cmx-bowl');
    if (bowl) bowl.classList.add('cmx-bowl-ready');
  }

  _moveDrag(clientX, clientY) {
    if (!this.dragging) return;
    const { ghost } = this.dragging;
    ghost.style.left = `${clientX}px`;
    ghost.style.top  = `${clientY}px`;

    // Live preview: check if ghost overlaps the bowl
    const bowl = document.getElementById('cmx-bowl');
    if (bowl) {
      const r = bowl.getBoundingClientRect();
      const inside = clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
      bowl.classList.toggle('cmx-bowl-hover', inside);
    }
  }

  _endDrag(clientX, clientY) {
    if (!this.dragging) return;
    const { colorObj, ghost } = this.dragging;

    // Check if dropped on bowl
    const bowl = document.getElementById('cmx-bowl');
    if (bowl) {
      const r = bowl.getBoundingClientRect();
      const inside = clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;

      if (inside) {
        if (this.mixedColors.length < this.MAX_DROPS) {
          this._dropColorInBowl(colorObj, clientX, clientY);
        } else {
          this._showBowlFull();
        }
      }
      bowl.classList.remove('cmx-bowl-hover', 'cmx-bowl-ready');
    }

    // Remove ghost
    ghost.remove();

    // Un-dim source bubble
    const src = document.getElementById(`bubble-${colorObj.id}`);
    if (src) src.classList.remove('cmx-bubble-dragging');

    this.dragging = null;
  }

  /* ================================================================
     BOWL LOGIC
     ================================================================ */
  async _dropColorInBowl(colorObj, dropX, dropY) {
    const previous = this.currentMix;
    this.mixedColors.push(colorObj);
    let result = this._computeMix();
    // A real pigment may barely change when the new paint is close to the
    // existing mixture. Nudge only those near-identical results far enough for
    // a child to perceive the added paint, while preserving the mix direction.
    if (previous && this._deltaE(previous, result) < 2.3 && this._deltaE(previous, colorObj) >= 2.3) {
      for (let amount = .08; amount <= .4 && this._deltaE(previous, result) < 2.3; amount += .08) {
        result = {
          r: Math.round(result.r * (1 - amount) + colorObj.r * amount),
          g: Math.round(result.g * (1 - amount) + colorObj.g * amount),
          b: Math.round(result.b * (1 - amount) + colorObj.b * amount),
          isRecipeMatch: result.isRecipeMatch,
        };
      }
    }
    this.currentMix = result;
    const named = result.isRecipeMatch
      ? this.COLORS.find(c => c.id === result.isRecipeMatch)
      : this._getColorObj(result);
    this.currentApiName = named.en;

    // Particles
    this._spawnParticles(dropX, dropY, colorObj.hex);

    this._updateBowl(result);
    this._speakColorResult(this.currentApiName);
  }

  _showBowlFull() {
    const bowl = document.getElementById('cmx-bowl');
    bowl?.classList.add('cmx-bowl-shake');
    setTimeout(() => bowl?.classList.remove('cmx-bowl-shake'), 400);
    this.app?._showToast?.(this._text('bowlFull'));
    this._speak(this._text('bowlFull'));
  }

  _updateBowl(result = this.currentMix || this._computeMix()) {
    const liquid   = document.getElementById('cmx-liquid');
    const chips    = document.getElementById('cmx-chips');
    const ph       = document.getElementById('cmx-placeholder');
    const preview  = document.getElementById('cmx-result-preview');
    const nameEnEl = document.getElementById('cmx-result-name-en');
    const nameViEl = document.getElementById('cmx-result-name-vi');
    const hexEl    = document.getElementById('cmx-result-hex');
    const rChips   = document.getElementById('cmx-result-chips');

    if (!this.mixedColors.length) {
      document.getElementById('cmx-bowl-model')?.setAttribute('color', '#c1d5bf');
      liquid.style.height    = '0%';
      liquid.style.opacity   = '0';
      ph.style.display       = 'flex';
      chips.innerHTML        = '';
      preview.innerHTML      = '<kid-model model="potion" color="#d9c8df" aria-label="Color"><span class="model-fallback">✦</span></kid-model>';
      nameEnEl.textContent   = '—';
      nameViEl.textContent   = '—';
      hexEl.textContent      = '';
      rChips.innerHTML       = '';
      return;
    }

    const hex    = this._rgbToHex(result.r, result.g, result.b);
    document.getElementById('cmx-bowl-model')?.setAttribute('color', hex);
    const bestObj = this._getColorObj(result);

    // Bowl liquid
    liquid.style.background = `linear-gradient(180deg, ${this._lighten(hex, 25)}, ${hex})`;
    liquid.style.height  = Math.min(30 + this.mixedColors.length * 10, 85) + '%';
    liquid.style.opacity = '1';
    ph.style.display     = 'none';

    // Chips inside bowl
    chips.innerHTML = this.mixedColors.map(c =>
      `<div class="cmx-chip" style="background:${c.hex}" title="${this.lang === 'vi' ? c.vi : c.en}"></div>`
    ).join('');

    // Result panel
    preview.style.background = `radial-gradient(circle at 35% 30%, ${this._lighten(hex, 35)}, ${hex} 65%, ${this._darken(hex, 20)})`;
    preview.innerHTML = `<kid-model model="potion" color="${hex}" aria-label="${bestObj.en}"><span class="model-fallback" style="background:${hex};border-radius:50%"></span></kid-model>`;

    nameEnEl.textContent = this.currentApiName || bestObj.en;
    nameViEl.textContent = bestObj.vi;
    
    nameEnEl.classList.remove('cmx-name-anim');
    nameViEl.classList.remove('cmx-name-anim');
    void nameEnEl.offsetWidth;           // force reflow to restart animation
    nameEnEl.classList.add('cmx-name-anim');
    nameViEl.classList.add('cmx-name-anim');

    hexEl.textContent  = hex.toUpperCase();

    rChips.innerHTML = this.mixedColors.map(c =>
      `<span class="cmx-result-chip-dot" style="background:${c.hex}" title="${this.lang === 'vi' ? c.vi : c.en}"></span>`
    ).join(' <span class="cmx-plus">+</span> ');
  }

  _resetBowl() {
    this.mixedColors = [];
    this.currentApiName = null;
    this.currentMix = null;
    this._updateBowl();
    // Reset bowl animation
    const bowl = document.getElementById('cmx-bowl');
    bowl.classList.add('cmx-bowl-shake');
    setTimeout(() => bowl.classList.remove('cmx-bowl-shake'), 400);

    if (typeof audio !== 'undefined') { try { audio.playTap?.(); } catch(e){} }
  }

  /* ================================================================
     COLOR MATH
     ================================================================ */
  _computeMix() {
    if (!this.mixedColors.length) return { r: 200, g: 200, b: 200 };
    if (this.mixedColors.length === 1) return { r: this.mixedColors[0].r, g: this.mixedColors[0].g, b: this.mixedColors[0].b };

    // Snap only the five canonical two-paint lessons. Once a third drop is
    // added, every individual drop contributes to the physical mix below.
    const pair = this.mixedColors.length === 2
      ? this.mixedColors.map(c => c.id).sort().join('+')
      : '';
    const lessons = {
      'red+yellow':       'orange',
      'blue+yellow':      'green',
      'blue+red':         'purple',
      'red+white':        'pink',
      'black+white':      'gray',
    };
    if (lessons[pair]) {
      const targetColor = this.COLORS.find(c => c.id === lessons[pair]);
      if (targetColor) {
        return { r: targetColor.r, g: targetColor.g, b: targetColor.b, isRecipeMatch: targetColor.id };
      }
    }

    // Kubelka-Munk single-constant approximation. Convert display RGB to
    // linear reflectance, average pigment K/S absorption (including repeated
    // colors as real weights), then solve reflectance back to display RGB.
    const toLinear = v => {
      v /= 255;
      return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    };
    const toSrgb = v => {
      v = Math.max(0, Math.min(1, v));
      return Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055));
    };
    const channels = ['r', 'g', 'b'].map(channel => {
      const ks = this.mixedColors.reduce((sum, color) => {
        const reflectance = Math.max(.02, Math.min(.98, toLinear(color[channel])));
        return sum + ((1 - reflectance) ** 2) / (2 * reflectance);
      }, 0) / this.mixedColors.length;
      return toSrgb(1 + ks - Math.sqrt(ks * ks + 2 * ks));
    });
    return { r: channels[0], g: channels[1], b: channels[2] };
  }

  _getColorObj({ r, g, b }) {
    // Extended name table with common mixes
    const NAMED = [
      { r: 255, g:   0, b:   0, vi: 'Đỏ',           en: 'Red'          },
      { r: 255, g: 165, b:   0, vi: 'Cam',           en: 'Orange'       },
      { r: 255, g: 255, b:   0, vi: 'Vàng',          en: 'Yellow'       },
      { r:   0, g: 255, b:   0, vi: 'Lục',           en: 'Green'        },
      { r:   0, g:   0, b: 255, vi: 'Lam',           en: 'Blue'         },
      { r:  75, g:   0, b: 130, vi: 'Chàm',          en: 'Indigo'       },
      { r: 128, g:   0, b: 128, vi: 'Tím',           en: 'Purple'       },
      { r: 255, g: 192, b: 203, vi: 'Hồng',          en: 'Pink'         },
      { r: 255, g: 255, b: 255, vi: 'Trắng',         en: 'White'        },
      { r:   0, g:   0, b:   0, vi: 'Đen',           en: 'Black'        },
      // New palette colors
      { r: 255, g: 127, b:  80, vi: 'San hô',        en: 'Coral'        },
      { r: 255, g: 215, b:   0, vi: 'Vàng kim',      en: 'Gold'         },
      { r:   0, g: 255, b: 255, vi: 'Xanh lơ',       en: 'Cyan'         },
      { r: 255, g:   0, b: 255, vi: 'Cánh sen',      en: 'Magenta'      },
      { r: 139, g:  69, b:  19, vi: 'Nâu',           en: 'Brown'        },
      { r: 128, g: 128, b: 128, vi: 'Xám',           en: 'Gray'         },
      { r:  50, g: 205, b:  50, vi: 'Xanh chanh',    en: 'Lime'         },
      { r:  64, g: 224, b: 208, vi: 'Ngọc lâm',      en: 'Turquoise'    },
      { r: 128, g:   0, b:   0, vi: 'Đỏ sẫm',        en: 'Maroon'       },
      { r:   0, g:   0, b: 128, vi: 'Xanh hải',      en: 'Navy'         },
      // Common mix results
      { r: 155, g: 129, b: 152, vi: 'Xám tím',       en: 'Mauve'        },
      { r: 127, g: 130, b: 171, vi: 'Xanh tím',      en: 'Periwinkle'   },
      { r: 153, g: 113, b:  21, vi: 'Nâu vàng',      en: 'Goldenrod'    },
      { r: 115, g: 179, b: 172, vi: 'Xanh ngọc',     en: 'Teal'         },
      { r: 255, g: 176, b:  42, vi: 'Vàng cam',      en: 'Amber'        },
      { r: 166, g: 107, b: 136, vi: 'Hồng tím',      en: 'Mauve Pink'   },
      { r: 153, g: 202, b: 172, vi: 'Xanh nhạt',     en: 'Mint'         },
      { r: 178, g:  34, b:  34, vi: 'Đỏ gạch',       en: 'Firebrick'    },
      { r: 210, g: 105, b:  30, vi: 'Quế',           en: 'Chocolate'    },
      { r:  70, g: 130, b: 180, vi: 'Xanh thép',     en: 'Steel Blue'   },
      { r: 244, g: 164, b:  96, vi: 'Nâu cát',       en: 'Sandy Brown'  },
      { r: 218, g: 112, b: 214, vi: 'Tím phong lan',  en: 'Orchid'       },
      { r: 240, g: 230, b: 140, vi: 'Vàng nhạt',     en: 'Khaki'        },
      { r: 173, g: 216, b: 230, vi: 'Xanh nhạt',     en: 'Light Blue'   },
      { r: 144, g: 238, b: 144, vi: 'Lục nhạt',      en: 'Light Green'  },
      { r: 255, g: 228, b: 196, vi: 'Be',            en: 'Bisque'       },
      { r: 245, g: 222, b: 179, vi: 'Lúa mì',        en: 'Wheat'        },
      { r: 188, g: 143, b: 143, vi: 'Hồng xám',      en: 'Rosy Brown'   },
    ];

    let best = NAMED[0], bestDist = Infinity;
    NAMED.forEach(n => {
      const d = this._deltaE(n, { r, g, b });
      if (d < bestDist) { bestDist = d; best = n; }
    });
    return best;
  }

  _rgbToLab({ r, g, b }) {
    const linear = value => {
      value /= 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    };
    r = linear(r); g = linear(g); b = linear(b);
    let x = (r * .4124 + g * .3576 + b * .1805) / .95047;
    let y = (r * .2126 + g * .7152 + b * .0722);
    let z = (r * .0193 + g * .1192 + b * .9505) / 1.08883;
    const pivot = value => value > .008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
    x = pivot(x); y = pivot(y); z = pivot(z);
    return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
  }

  _deltaE(first, second) {
    const a = this._rgbToLab(first), b = this._rgbToLab(second);
    return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
  }

  _getColorName({ r, g, b }) {
    const best = this._getColorObj({ r, g, b });
    return this.lang === 'vi' ? best.vi : best.en;
  }

  _rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  _lighten(hex, pct) {
    let { r, g, b } = this._hexToRgb(hex);
    r = Math.min(255, r + Math.round((255 - r) * pct / 100));
    g = Math.min(255, g + Math.round((255 - g) * pct / 100));
    b = Math.min(255, b + Math.round((255 - b) * pct / 100));
    return this._rgbToHex(r, g, b);
  }

  _darken(hex, pct) {
    let { r, g, b } = this._hexToRgb(hex);
    r = Math.max(0, r - Math.round(r * pct / 100));
    g = Math.max(0, g - Math.round(g * pct / 100));
    b = Math.max(0, b - Math.round(b * pct / 100));
    return this._rgbToHex(r, g, b);
  }

  _hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }

  /* ================================================================
     SPEECH
     ================================================================ */
  _speakColor(colorObj) {
    if (!this.speechEnabled) return;
    this._speak(colorObj.en);
  }

  _speakColorResult(enName) {
    if (!this.speechEnabled) return;
    this._speak('Color: ' + enName);
  }

  _speak(text) {
    if (!this.active) return; // never talk over the dashboard after leaving
    if (!window.TTS) return;

    // Must stay a synchronous call from the user gesture (touchstart/
    // touchend) – deferring it even by setTimeout(0) breaks iOS Safari's
    // gesture requirement and the utterance is dropped with no error.
    window.TTS.speak(text, { lang: 'en-US', rate: 0.9, pitch: 1.1 });
  }

  /* ================================================================
     PARTICLES
     ================================================================ */
  _spawnParticles(x, y, hex) {
    const layer = document.getElementById('cmx-particles');
    if (!layer) return;

    const bowl = document.getElementById('cmx-bowl');
    const br   = bowl ? bowl.getBoundingClientRect() : { left: x, top: y };

    for (let i = 0; i < 14; i++) {
      const p  = document.createElement('div');
      p.className = 'cmx-particle';

      const angle = (Math.random() * 360) * (Math.PI / 180);
      const dist  = 30 + Math.random() * 60;
      const tx    = Math.cos(angle) * dist;
      const ty    = Math.sin(angle) * dist - 40;
      const size  = 6 + Math.random() * 10;

      p.style.cssText = `
        left: ${x}px; top: ${y}px;
        width: ${size}px; height: ${size}px;
        background: ${hex};
        --tx: ${tx}px; --ty: ${ty}px;
        animation-delay: ${Math.random() * 0.1}s;
      `;
      layer.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }
}
