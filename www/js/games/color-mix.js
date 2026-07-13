/* ================================================================
   Color Mix Lab – Phòng Thí Nghiệm Màu Sắc  v1.0
   Features (Phase "Học"):
   - 9 draggable color bubbles (primary + secondary + white/black)
   - Real-time RGB blend as bubbles enter mixing bowl
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

    // ── Color Palette ──
    this.COLORS = [
      { id: 'red',    hex: '#FF0000', r: 255, g:   0, b:   0, vi: 'Đỏ',         en: 'Red'      },
      { id: 'orange', hex: '#FFA500', r: 255, g: 165, b:   0, vi: 'Cam',        en: 'Orange'   },
      { id: 'yellow', hex: '#FFFF00', r: 255, g: 255, b:   0, vi: 'Vàng',       en: 'Yellow'   },
      { id: 'green',  hex: '#00FF00', r:   0, g: 255, b:   0, vi: 'Lục',        en: 'Green'    },
      { id: 'blue',   hex: '#0000FF', r:   0, g:   0, b: 255, vi: 'Lam',        en: 'Blue'     },
      { id: 'indigo', hex: '#4B0082', r:  75, g:   0, b: 130, vi: 'Chàm',       en: 'Indigo'   },
      { id: 'purple', hex: '#800080', r: 128, g:   0, b: 128, vi: 'Tím',        en: 'Purple'   },
      { id: 'pink',   hex: '#FFC0CB', r: 255, g: 192, b: 203, vi: 'Hồng',       en: 'Pink'     },
      { id: 'white',  hex: '#FFFFFF', r: 255, g: 255, b: 255, vi: 'Trắng',      en: 'White'    },
      { id: 'black',  hex: '#000000', r:   0, g:   0, b:   0, vi: 'Đen',        en: 'Black'    },
    ];

    // ── State ──
    this.mixedColors   = [];   // array of COLORS objects in the bowl
    this.dragging      = null; // { colorObj, ghostEl, startX, startY, bowl }
    this.speechEnabled = true;
    this.active        = false;
    this.currentApiName = null;

    // Warm up voices
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
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
    this.container.innerHTML = '';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  updateLanguage(lang) {
    this.lang = lang;
    // Update all color name labels
    const nameEl = this.container.querySelector('.cmx-result-name');
    if (nameEl && this.mixedColors.length > 0) {
      const result = this._computeMix();
      nameEl.textContent = this._getColorName(result);
    }
    // Update palette bubble titles
    this.COLORS.forEach(c => {
      const el = this.container.querySelector(`[data-color-id="${c.id}"] .cmx-bubble-label`);
      if (el) el.textContent = lang === 'vi' ? c.vi : c.en;
    });
    // Update UI text
    const ph = this.container.querySelector('.cmx-bowl-placeholder');
    if (ph) ph.textContent = lang === 'vi' ? 'Kéo màu vào đây' : 'Drag colors here';
    const resetBtn = this.container.querySelector('#cmx-reset-btn');
    if (resetBtn) resetBtn.textContent = lang === 'vi' ? '🗑️ Đổ ra' : '🗑️ Clear';
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

    this.container.innerHTML = `
      <div class="cmx-wrapper" id="cmx-wrapper">

        <!-- Main 3-column layout -->
        <div class="cmx-main">

          <!-- LEFT: Color Palette -->
          <div class="cmx-palette" id="cmx-palette">
            ${this.COLORS.map(c => `
              <div class="cmx-bubble-wrap" data-color-id="${c.id}">
                <div class="cmx-bubble"
                     id="bubble-${c.id}"
                     data-color-id="${c.id}"
                     style="background: radial-gradient(circle at 35% 30%, ${this._lighten(c.hex, 40)}, ${c.hex} 60%, ${this._darken(c.hex, 20)});">
                </div>
                <span class="cmx-bubble-label">${this.lang === 'vi' ? c.vi : c.en}</span>
              </div>
            `).join('')}
          </div>

          <!-- CENTER: Mixing Bowl -->
          <div class="cmx-center">
            <div class="cmx-bowl-area">
              <div class="cmx-bowl" id="cmx-bowl">
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
              <div class="cmx-result-empty-icon">🎨</div>
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
      e.preventDefault();
      const t = e.touches[0];
      this._moveDrag(t.clientX, t.clientY);
    };
    this._onTouchEnd  = (e) => {
      const t = e.changedTouches[0];
      this._endDrag(t.clientX, t.clientY);
    };

    document.addEventListener('mousemove',  this._onMouseMove);
    document.addEventListener('mouseup',    this._onMouseUp);
    document.addEventListener('touchmove',  this._onTouchMove, { passive: false });
    document.addEventListener('touchend',   this._onTouchEnd);
  }

  _unbindGlobalEvents() {
    document.removeEventListener('mousemove',  this._onMouseMove);
    document.removeEventListener('mouseup',    this._onMouseUp);
    document.removeEventListener('touchmove',  this._onTouchMove);
    document.removeEventListener('touchend',   this._onTouchEnd);
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
        if (this.mixedColors.length < 3) {
          this._dropColorInBowl(colorObj, clientX, clientY);
        } else {
          bowl.classList.add('cmx-bowl-shake');
          setTimeout(() => bowl.classList.remove('cmx-bowl-shake'), 400);
          this._speak('Bowl is full');
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
    this.mixedColors.push(colorObj);
    this.currentApiName = null;

    // Particles
    this._spawnParticles(dropX, dropY, colorObj.hex);

    // Update liquid color
    this._updateBowl();

    const nameEnEl = document.getElementById('cmx-result-name-en');

    // If the bowl contains only one base color (even if multiple of the same), bypass API
    const isPureColor = this.mixedColors.every(c => c.id === this.mixedColors[0].id);
    if (isPureColor) {
      this.currentApiName = this.mixedColors[0].en;
      nameEnEl.textContent = this.currentApiName;
      
      nameEnEl.classList.remove('cmx-name-anim');
      void nameEnEl.offsetWidth;
      nameEnEl.classList.add('cmx-name-anim');
      
      this._speakColorResult(this.currentApiName);
      return; // Skip API fetch
    }

    // UI Loading state for API
    nameEnEl.innerHTML = '<span style="font-size: 0.8em; color: #888;">⏳ Loading API...</span>';

    // Fetch professional name
    const result = this._computeMix();
    
    // Bypass API if it matched a known primary recipe (e.g., Red + Yellow = exact Orange)
    if (result.isRecipeMatch) {
      const targetColor = this.COLORS.find(c => c.id === result.isRecipeMatch);
      this.currentApiName = targetColor.en;
      nameEnEl.textContent = this.currentApiName;
      
      nameEnEl.classList.remove('cmx-name-anim');
      void nameEnEl.offsetWidth;
      nameEnEl.classList.add('cmx-name-anim');
      
      this._speakColorResult(this.currentApiName);
      return; // Skip API fetch
    }

    const hex = this._rgbToHex(result.r, result.g, result.b);
    
    try {
      const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex.replace('#', '')}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      // Prevent race condition if user dropped another color or reset
      if (this.mixedColors.length > 0) {
        this.currentApiName = data.name.value;
        nameEnEl.textContent = this.currentApiName;
        
        nameEnEl.classList.remove('cmx-name-anim');
        void nameEnEl.offsetWidth;
        nameEnEl.classList.add('cmx-name-anim');
        
        this._speakColorResult(this.currentApiName);
      }
    } catch (e) {
      console.warn("Color API failed, using fallback");
      const bestMatch = this._getColorObj(result);
      if (this.mixedColors.length > 0) {
        this.currentApiName = bestMatch.en;
        nameEnEl.textContent = this.currentApiName;
        this._speakColorResult(this.currentApiName);
      }
    }
  }

  _updateBowl() {
    const liquid   = document.getElementById('cmx-liquid');
    const chips    = document.getElementById('cmx-chips');
    const ph       = document.getElementById('cmx-placeholder');
    const preview  = document.getElementById('cmx-result-preview');
    const nameEnEl = document.getElementById('cmx-result-name-en');
    const nameViEl = document.getElementById('cmx-result-name-vi');
    const hexEl    = document.getElementById('cmx-result-hex');
    const rChips   = document.getElementById('cmx-result-chips');

    if (!this.mixedColors.length) {
      liquid.style.height    = '0%';
      liquid.style.opacity   = '0';
      ph.style.display       = 'flex';
      chips.innerHTML        = '';
      preview.innerHTML      = '<div class="cmx-result-empty-icon">🎨</div>';
      nameEnEl.textContent   = '—';
      nameViEl.textContent   = '—';
      hexEl.textContent      = '';
      rChips.innerHTML       = '';
      return;
    }

    const result = this._computeMix();
    const hex    = this._rgbToHex(result.r, result.g, result.b);
    const bestObj = this._getColorObj(result);

    // Bowl liquid
    liquid.style.background = `linear-gradient(180deg, ${this._lighten(hex, 25)}, ${hex})`;
    liquid.style.height  = Math.min(40 + this.mixedColors.length * 8, 80) + '%';
    liquid.style.opacity = '1';
    ph.style.display     = 'none';

    // Chips inside bowl
    chips.innerHTML = this.mixedColors.map(c =>
      `<div class="cmx-chip" style="background:${c.hex}" title="${this.lang === 'vi' ? c.vi : c.en}"></div>`
    ).join('');

    // Result panel
    preview.style.background = `radial-gradient(circle at 35% 30%, ${this._lighten(hex, 35)}, ${hex} 65%, ${this._darken(hex, 20)})`;
    preview.innerHTML = '';

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

    // Known child-friendly subtractive recipes
    const uniqueIds = Array.from(new Set(this.mixedColors.map(c => c.id))).sort().join('+');
    
    const recipes = {
      'red+yellow': 'orange',
      'orange+red+yellow': 'orange',
      'blue+yellow': 'green',
      'blue+green+yellow': 'green',
      'blue+red': 'purple',
      'blue+purple+red': 'purple',
      'red+white': 'pink',
      'pink+red+white': 'pink',
      'black+white': 'gray',
      'black+gray+white': 'gray',
    };

    if (recipes[uniqueIds]) {
      const targetColor = this.COLORS.find(c => c.id === recipes[uniqueIds]);
      if (targetColor) {
        return { r: targetColor.r, g: targetColor.g, b: targetColor.b, isRecipeMatch: targetColor.id };
      }
    }

    // Fallback: standard RGB average
    const r = Math.round(this.mixedColors.reduce((s, c) => s + c.r, 0) / this.mixedColors.length);
    const g = Math.round(this.mixedColors.reduce((s, c) => s + c.g, 0) / this.mixedColors.length);
    const b = Math.round(this.mixedColors.reduce((s, c) => s + c.b, 0) / this.mixedColors.length);
    return { r, g, b };
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
      // Common mixes
      { r: 155, g: 129, b: 152, vi: 'Xám tím',       en: 'Mauve'        },
      { r: 127, g: 130, b: 171, vi: 'Xanh tím',      en: 'Periwinkle'   },
      { r: 153, g: 113, b:  21, vi: 'Nâu vàng',      en: 'Goldenrod'    },
      { r: 115, g: 179, b: 172, vi: 'Xanh ngọc',     en: 'Teal'         },
      { r: 255, g: 127, b:  67, vi: 'Cam đỏ',        en: 'Coral'        },
      { r: 127, g: 127, b: 127, vi: 'Xám',           en: 'Gray'         },
      { r: 255, g: 176, b:  42, vi: 'Vàng cam',      en: 'Amber'        },
      { r: 166, g: 107, b: 136, vi: 'Hồng tím',      en: 'Mauve Pink'   },
      { r: 153, g: 202, b: 172, vi: 'Xanh nhạt',     en: 'Mint'         },
    ];

    let best = NAMED[0], bestDist = Infinity;
    NAMED.forEach(n => {
      const d = (n.r - r) ** 2 + (n.g - g) ** 2 + (n.b - b) ** 2;
      if (d < bestDist) { bestDist = d; best = n; }
    });
    return best;
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
    if (typeof audio !== 'undefined' && audio.muted) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    
    // Always use English voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.startsWith('en'));
    
    if (voice) {
      utt.voice = voice;
    }

    utt.lang   = 'en-US';
    utt.rate   = 0.9;
    utt.pitch  = 1.1;
    utt.volume = 1;
    window.speechSynthesis.speak(utt);
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
