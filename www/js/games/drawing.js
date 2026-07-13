/* Magic Canvas (Creativity Studio) Game */
class MagicCanvas {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.currentColor = '#ff6b8b';
    this.currentSize = 12;
    this.isRainbow = false;
    this.activeStamp = null;
    this.hue = 0;
    this.strokeCount = 0;
    this.active = false;

    this.colors = [
      '#ff6b8b', '#ff4757', '#ffa502', '#ffbe0b',
      '#2ed573', '#1e90ff', '#a78bfa', '#2b2d42',
      '#795548', '#ffffff' // Brown, Eraser (white)
    ];

    this.stamps = ['⭐', '❤️', '🌿', '🎈', '🐯', '🦄'];
  }

  start() {
    this.active = true;
    this.strokeCount = 0;
    
    // Set score indicator as strokes count
    const t = TRANSLATIONS[this.app.lang];
    document.getElementById('score-val').textContent = `0 ${t.score_drawing}`;

    this.container.innerHTML = `
      <div id="drawing-container">
        <!-- Left Toolbox -->
        <div id="drawing-toolbox">
          
          <div class="toolbox-section">
            <div class="toolbox-label" id="lbl-draw-color">${t.draw_color}</div>
            <div class="color-palette" id="colors-container"></div>
          </div>

          <div class="toolbox-section">
            <div class="toolbox-label" id="lbl-draw-size">${t.draw_size}</div>
            <div class="size-selectors">
              <button class="size-btn active" data-size="6"><div class="size-dot size-small"></div></button>
              <button class="size-btn" data-size="14"><div class="size-dot size-medium"></div></button>
              <button class="size-btn" data-size="24"><div class="size-dot size-large"></div></button>
            </div>
          </div>

          <div class="toolbox-section">
            <div class="toolbox-label" id="lbl-draw-stamp">${t.draw_stamp}</div>
            <div class="stamps-palette" id="stamps-container"></div>
          </div>

          <div class="toolbox-section" style="margin-top: auto; gap: 8px;">
            <button id="btn-rainbow-toggle" class="tool-action-btn btn-rainbow">${t.draw_rainbow}</button>
            <button id="btn-clear-canvas" class="tool-action-btn btn-clear">${t.draw_clear}</button>
            <button id="btn-submit-art" class="btn-primary" style="padding: 10px 15px; font-size: 1rem; width: 100%; box-shadow: 0 4px 0 #d93d5f;">${t.draw_submit}</button>
          </div>

        </div>

        <!-- Right Canvas Area -->
        <div id="canvas-area">
          <canvas id="draw-canvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('draw-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvasArea = document.getElementById('canvas-area');

    this.setupCanvas();
    this.setupToolbox();
    this.attachDrawingEvents();

    // Redraw on window resize
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  updateLanguage() {
    const t = TRANSLATIONS[this.app.lang];
    document.getElementById('score-val').textContent = `${this.strokeCount} ${t.score_drawing}`;
    
    // Update static labels in DOM
    const lblColor = document.getElementById('lbl-draw-color');
    if (lblColor) lblColor.textContent = t.draw_color;
    
    const lblSize = document.getElementById('lbl-draw-size');
    if (lblSize) lblSize.textContent = t.draw_size;
    
    const lblStamp = document.getElementById('lbl-draw-stamp');
    if (lblStamp) lblStamp.textContent = t.draw_stamp;

    // Update buttons
    const btnRainbow = document.getElementById('btn-rainbow-toggle');
    if (btnRainbow) btnRainbow.textContent = t.draw_rainbow;
    
    const btnClear = document.getElementById('btn-clear-canvas');
    if (btnClear) btnClear.textContent = t.draw_clear;
    
    const btnSubmit = document.getElementById('btn-submit-art');
    if (btnSubmit) btnSubmit.textContent = t.draw_submit;
  }

  setupCanvas() {
    // Set internal resolution of canvas to match visual size
    this.canvas.width = this.canvasArea.clientWidth;
    this.canvas.height = this.canvasArea.clientHeight;

    // Line drawing defaults
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  handleResize() {
    // Save image before resize
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.canvas, 0, 0);

    // Resize
    this.canvas.width = this.canvasArea.clientWidth;
    this.canvas.height = this.canvasArea.clientHeight;

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Draw back
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  setupToolbox() {
    // 1. Color Palette Buttons
    const colorsContainer = document.getElementById('colors-container');
    this.colors.forEach(color => {
      const btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.style.backgroundColor = color;
      if (color === this.currentColor) btn.classList.add('active');

      btn.addEventListener('click', () => {
        audio.playTap();
        this.activeStamp = null;
        this.isRainbow = false;
        this.currentColor = color;
        
        // Update active states
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.stamp-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('btn-rainbow-toggle').classList.remove('active');
      });

      colorsContainer.appendChild(btn);
    });

    // 2. Size Button Selectors
    document.querySelectorAll('.size-selectors button').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playTap();
        this.currentSize = parseInt(btn.getAttribute('data-size'));
        
        document.querySelectorAll('.size-selectors button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 3. Stamp Buttons
    const stampsContainer = document.getElementById('stamps-container');
    this.stamps.forEach(stamp => {
      const btn = document.createElement('button');
      btn.className = 'stamp-btn';
      btn.textContent = stamp;

      btn.addEventListener('click', () => {
        audio.playTap();
        this.activeStamp = stamp;
        this.isRainbow = false;

        // Reset other states
        document.querySelectorAll('.stamp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('btn-rainbow-toggle').classList.remove('active');
      });

      stampsContainer.appendChild(btn);
    });

    // 4. Special Button Handlers
    const rainbowToggle = document.getElementById('btn-rainbow-toggle');
    rainbowToggle.addEventListener('click', () => {
      audio.playTap();
      this.isRainbow = !this.isRainbow;
      this.activeStamp = null;

      if (this.isRainbow) {
        rainbowToggle.classList.add('active');
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.stamp-btn').forEach(b => b.classList.remove('active'));
      } else {
        rainbowToggle.classList.remove('active');
        // fall back to first color
        document.querySelector('.color-btn').click();
      }
    });

    const clearBtn = document.getElementById('btn-clear-canvas');
    clearBtn.addEventListener('click', () => {
      audio.playFail(); // Cute negative chime for clearing
      
      // Shake animation
      this.canvasArea.classList.add('shake-canvas');
      setTimeout(() => {
        this.canvasArea.classList.remove('shake-canvas');
      }, 400);

      // Clear
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.strokeCount = 0;
      document.getElementById('score-val').textContent = `0 ${TRANSLATIONS[this.app.lang].score_drawing}`;
    });

    const submitBtn = document.getElementById('btn-submit-art');
    submitBtn.addEventListener('click', () => {
      audio.playTap();
      if (this.strokeCount > 2) {
        this.app.winGame(12); // Award stars
      } else {
        // Encourage to draw first
        alert(TRANSLATIONS[this.app.lang].draw_alert);
      }
    });
  }

  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  attachDrawingEvents() {
    // Drawing Start helper
    const drawStart = (e) => {
      if (!this.active) return;
      const coords = this.getCoordinates(e);

      if (this.activeStamp) {
        // If stamp selected, draw emoji
        this.drawStamp(coords.x, coords.y);
      } else {
        // Regular line draw start
        this.isDrawing = true;
        this.lastX = coords.x;
        this.lastY = coords.y;
      }
    };

    // Drawing Move helper
    const drawMove = (e) => {
      if (!this.isDrawing || !this.active) return;
      const coords = this.getCoordinates(e);

      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(coords.x, coords.y);

      // Rainbow styling
      if (this.isRainbow) {
        this.ctx.strokeStyle = `hsl(${this.hue}, 100%, 55%)`;
        this.hue = (this.hue + 4) % 360;
      } else {
        this.ctx.strokeStyle = this.currentColor;
      }

      this.ctx.lineWidth = this.currentSize;
      this.ctx.stroke();

      this.lastX = coords.x;
      this.lastY = coords.y;

      // Soft drawing sound
      if (Math.random() > 0.8) {
        audio.playPaint(0.2 + (this.currentSize / 30));
      }
    };

    const drawEnd = () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.strokeCount++;
        document.getElementById('score-val').textContent = `${this.strokeCount} nét vẽ`;
      }
    };

    // Mouse Listeners
    this.canvas.addEventListener('mousedown', drawStart);
    this.canvas.addEventListener('mousemove', drawMove);
    this.canvas.addEventListener('mouseup', drawEnd);
    this.canvas.addEventListener('mouseleave', drawEnd);

    // Mobile Touch Listeners (Prevent bounce scrolling while drawing)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      drawStart(e);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      drawMove(e);
    });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      drawEnd();
    });
  }

  drawStamp(x, y) {
    this.ctx.font = `${this.currentSize * 2.5}px var(--font-kids)`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw text/emoji
    this.ctx.fillText(this.activeStamp, x, y);

    audio.playPop(); // Cute bubble pop on stamp placement
    
    this.strokeCount++;
    document.getElementById('score-val').textContent = `${this.strokeCount} nét vẽ`;
  }

  destroy() {
    this.active = false;
    window.removeEventListener('resize', this.resizeHandler);
    this.container.innerHTML = '';
  }
}
