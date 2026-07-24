const ALL_VEHICLES = [
  { name: 'Fire Truck', nameVi: 'Xe Cứu Hỏa', img: 'fire_truck.svg', color: '', station: 'Fire Station', stationVi: 'Trạm Cứu Hỏa', emoji: '🔥', group: 'emergency' },
  { name: 'Ambulance', nameVi: 'Xe Cứu Thương', img: 'ambulance.svg', color: '', station: 'Hospital', stationVi: 'Bệnh Viện', emoji: '🏥', group: 'emergency' },
  { name: 'Police Car', nameVi: 'Xe Cảnh Sát', img: 'car.svg', color: '#3498db', station: 'Police Station', stationVi: 'Đồn Cảnh Sát', emoji: '👮', group: 'emergency' },
  { name: 'Airplane', nameVi: 'Máy Bay', img: 'airplane.svg', color: '', station: 'Airport', stationVi: 'Sân Bay', emoji: '✈️', group: 'aviation' },
  { name: 'Helicopter', nameVi: 'Trực Thăng', img: 'helicopter.svg', color: '', station: 'Helipad', stationVi: 'Bãi Trực Thăng', emoji: '🚁', group: 'aviation' },
  { name: 'Rocket', nameVi: 'Tên Lửa', img: 'rocket.svg', color: '', station: 'Launch Pad', stationVi: 'Bệ Phóng', emoji: '🚀', group: 'aviation' },
  { name: 'Bus', nameVi: 'Xe Buýt', img: 'bus.svg', color: '#3498db', station: 'Bus Stop', stationVi: 'Trạm Xe Buýt', emoji: '🚏', group: 'transport' },
  { name: 'School Bus', nameVi: 'Xe Buýt Trường', img: 'bus.svg', color: '#f1c40f', station: 'School', stationVi: 'Trường Học', emoji: '🏫', group: 'transport' },
  { name: 'Taxi', nameVi: 'Xe Taxi', img: 'car.svg', color: '#f1c40f', station: 'Hotel', stationVi: 'Khách Sạn', emoji: '🏨', group: 'transport' },
  { name: 'Train', nameVi: 'Tàu Hỏa', img: 'train.svg', color: '', station: 'Train Station', stationVi: 'Ga Tàu', emoji: '🚉', group: 'transport' },
  { name: 'Garbage Truck', nameVi: 'Xe Rác', img: 'truck.svg', color: '#2ecc71', station: 'Dump', stationVi: 'Bãi Rác', emoji: '♻️', group: 'construction' },
  { name: 'Cement Mixer', nameVi: 'Xe Bồn', img: 'truck.svg', color: '#95a5a6', station: 'Construction', stationVi: 'Công Trường', emoji: '🏗️', group: 'construction' },
  { name: 'Excavator', nameVi: 'Máy Xúc', img: 'tractor.svg', color: '#e67e22', station: 'Construction', stationVi: 'Công Trường', emoji: '🏗️', group: 'construction' },
  { name: 'Bulldozer', nameVi: 'Xe Ủi', img: 'tractor.svg', color: '#f39c12', station: 'Construction', stationVi: 'Công Trường', emoji: '🏗️', group: 'construction' },
  { name: 'Road Roller', nameVi: 'Xe Lu', img: 'tractor.svg', color: '#d35400', station: 'Road Work', stationVi: 'Làm Đường', emoji: '🛣️', group: 'construction' },
  { name: 'Boat', nameVi: 'Tàu Thuyền', img: 'boat.svg', color: '', station: 'Harbor', stationVi: 'Bến Cảng', emoji: '⚓', group: 'marine' },
  { name: 'Van', nameVi: 'Xe Tải Nhỏ', img: 'van.svg', color: '', station: 'Warehouse', stationVi: 'Nhà Kho', emoji: '📦', group: 'transport' },
  { name: 'Motorcycle', nameVi: 'Xe Máy', img: 'motorbike.svg', color: '', station: 'Garage', stationVi: 'Gara', emoji: '🔧', group: 'transport' },
  { name: 'Race Car', nameVi: 'Xe Đua', img: 'car.svg', color: '#e74c3c', station: 'Race Track', stationVi: 'Đường Đua', emoji: '🏁', group: 'transport' },
  { name: 'Tractor', nameVi: 'Máy Cày', img: 'tractor.svg', color: '#27ae60', station: 'Farm', stationVi: 'Nông Trại', emoji: '🌾', group: 'construction' }
];

class VehicleParking {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.lang = app.lang;
    
    // UI elements
    this.scoreVal = document.getElementById('score-val');
    this.score = 0;
    this.maxScore = 5;
    
    // State
    this.currentRound = 0;
    this.currentVehicle = null;
    this.stations = [];
    
    // Audio Context (will be initialized on first user interaction or reuse global if possible)
    this.audioCtx = null;
    this.initAudioContext();
  }
  
  initAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  start() {
    this.score = 0;
    if (this.scoreVal) this.scoreVal.textContent = `0 / ${this.maxScore}`;
    
    this.container.innerHTML = `
      <div id="vehicle-parking-container">
        <!-- Scenery -->
        <div class="vp-sky">
          <div class="vp-cloud cloud-1">☁️</div>
          <div class="vp-cloud cloud-2">☁️</div>
          <div class="vp-cloud cloud-3">☁️</div>
          <div class="vp-sun">☀️</div>
        </div>
        <div class="vp-cityscape">
          <span class="vp-bldg">🏙️</span>
          <span class="vp-bldg">🏢</span>
          <span class="vp-bldg">🏨</span>
          <span class="vp-bldg">🏫</span>
          <span class="vp-bldg">🏥</span>
        </div>
        <div class="vp-road"></div>

        <div class="vp-top-section" id="vp-top-section">
          <!-- Current vehicle displayed here -->
        </div>
        <div class="vp-stations-grid" id="vp-stations-grid">
          <!-- Stations displayed here -->
        </div>
      </div>
    `;
    this.topSection = document.getElementById('vp-top-section');
    this.stationsGrid = document.getElementById('vp-stations-grid');
    
    this.generateRound();
  }

  generateRound() {
    // Pick a random vehicle to park
    const shuffledVehicles = [...ALL_VEHICLES].sort(() => Math.random() - 0.5);
    this.currentVehicle = shuffledVehicles[0];
    
    // Pick 3-4 other random distinct stations
    this.stations = [this.currentVehicle];
    let index = 1;
    while(this.stations.length < 4 && index < shuffledVehicles.length) {
      const v = shuffledVehicles[index];
      // Ensure distinct stations
      if (!this.stations.find(s => s.station === v.station)) {
        this.stations.push(v);
      }
      index++;
    }
    
    // Shuffle stations
    this.stations.sort(() => Math.random() - 0.5);
    
    this.renderGameScreen();
  }

  renderGameScreen() {
    // Render vehicle
    const vName = this.lang === 'vi' ? this.currentVehicle.nameVi : this.currentVehicle.name;
    const filterCss = this.currentVehicle.color ? `style="filter: drop-shadow(0 0 5px ${this.currentVehicle.color});"` : '';
    
    this.topSection.innerHTML = `
      <div class="vp-vehicle-display anim-drive-in" id="vp-vehicle-display">
        <img src="img/vocab/${this.currentVehicle.img}" class="vp-vehicle-img" alt="${vName}" ${filterCss} draggable="false">
        <div class="vp-vehicle-name">${vName}</div>
      </div>
    `;
    
    // Render stations
    this.stationsGrid.innerHTML = '';
    this.stations.forEach(st => {
      const sName = this.lang === 'vi' ? st.stationVi : st.station;
      const card = document.createElement('div');
      card.className = 'vp-station-card';
      card.dataset.station = st.station;
      card.innerHTML = `
        <div class="vp-station-emoji">${st.emoji}</div>
        <div class="vp-station-name">${sName}</div>
      `;
      this.stationsGrid.appendChild(card);
    });
    
    this.setupDragDrop();
  }

  setupDragDrop() {
    if (this.dragHandlers) {
      document.removeEventListener('mousemove', this.dragHandlers.onMove);
      document.removeEventListener('mouseup', this.dragHandlers.onEnd);
      document.removeEventListener('touchmove', this.dragHandlers.onMove);
      document.removeEventListener('touchend', this.dragHandlers.onEnd);
      document.removeEventListener('touchcancel', this.dragHandlers.onEnd);
    }

    const vehicleEl = document.getElementById('vp-vehicle-display');
    const stationsEls = this.stationsGrid.querySelectorAll('.vp-station-card');
    
    let isDragging = false;
    let startX, startY;
    let baseTransform = '';
    
    const onStart = (e) => {
      if (e.type === 'touchstart') e.preventDefault();
      isDragging = true;
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      
      startX = clientX;
      startY = clientY;
      
      vehicleEl.style.zIndex = '100';
      vehicleEl.style.transition = 'none';
      vehicleEl.style.animation = 'none'; // Stop bounce
      // Pop up slightly when picked up
      vehicleEl.style.transform = 'scale(1.15) rotate(-3deg)';
      
      stationsEls.forEach(s => s.style.animation = 'stationPulse 1.5s infinite');
    };
    
    const onMove = (e) => {
      if (!isDragging) return;
      if (e.type === 'touchmove') e.preventDefault();
      
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - startX;
      const dy = clientY - startY;
      
      vehicleEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.15) rotate(-3deg)`;
      
      // Find the single station with the LARGEST overlap area
      const vRect = vehicleEl.getBoundingClientRect();
      let bestStation = null;
      let bestArea = 0;
      
      stationsEls.forEach(station => {
        const sRect = station.getBoundingClientRect();
        const area = this.overlapArea(vRect, sRect);
        if (area > bestArea) {
          bestArea = area;
          bestStation = station;
        }
      });
      
      // Only highlight the single best match
      stationsEls.forEach(station => {
        if (station === bestStation) {
          station.classList.add('highlight');
        } else {
          station.classList.remove('highlight');
        }
      });
    };
    
    const onEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;
      stationsEls.forEach(s => s.style.animation = '');
      
      // Find the best overlap station on drop
      const vRect = vehicleEl.getBoundingClientRect();
      let droppedStation = null;
      let bestArea = 0;
      
      stationsEls.forEach(station => {
        station.classList.remove('highlight');
        const sRect = station.getBoundingClientRect();
        const area = this.overlapArea(vRect, sRect);
        if (area > bestArea) {
          bestArea = area;
          droppedStation = station;
        }
      });
      
      if (droppedStation) {
        this.handleDrop(vehicleEl, droppedStation);
      } else {
        // Reset position with smooth transition
        vehicleEl.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        vehicleEl.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
        setTimeout(() => {
          if (!isDragging) {
            vehicleEl.style.transition = 'none';
            vehicleEl.style.animation = 'vehicleBounce 2s infinite ease-in-out';
          }
        }, 400);
      }
    };
    
    vehicleEl.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    
    vehicleEl.addEventListener('touchstart', onStart, {passive: false});
    document.addEventListener('touchmove', onMove, {passive: false});
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    
    this.dragHandlers = { onMove, onEnd };
  }
  
  /** Returns the overlap area (px²) between two DOMRects. 0 = no overlap. */
  overlapArea(rect1, rect2) {
    const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
    const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
    return overlapX * overlapY;
  }

  handleDrop(vehicleEl, stationEl) {
    const targetStation = stationEl.dataset.station;
    const isCorrect = targetStation === this.currentVehicle.station;
    
    // Animate vehicle shrinking into the station card
    const vRect = vehicleEl.getBoundingClientRect();
    const sRect = stationEl.getBoundingClientRect();
    
    // Calculate position to fly the vehicle into the station center
    const sCenterX = sRect.left + sRect.width / 2;
    const sCenterY = sRect.top + sRect.height / 2;
    const vCenterX = vRect.left + vRect.width / 2;
    const vCenterY = vRect.top + vRect.height / 2;
    
    // Current translate offset (from drag)
    const style = window.getComputedStyle(vehicleEl);
    const matrix = new DOMMatrix(style.transform);
    const curTx = matrix.m41;
    const curTy = matrix.m42;
    
    // Additional offset needed to reach station center
    const flyDx = curTx + (sCenterX - vCenterX);
    const flyDy = curTy + (sCenterY - vCenterY);
    
    // Scale down to fit inside the station card
    const targetScale = Math.min(sRect.width, sRect.height) / Math.max(vRect.width, vRect.height) * 0.7;
    
    vehicleEl.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    vehicleEl.style.transform = `translate(${flyDx}px, ${flyDy}px) scale(${targetScale}) rotate(0deg)`;
    
    // Briefly highlight the target station
    stationEl.classList.add('highlight');
    
    setTimeout(() => {
      stationEl.classList.remove('highlight');
      if (isCorrect) {
        this.onCorrect(vehicleEl, stationEl);
      } else {
        this.onWrong(vehicleEl);
      }
    }, 450);
  }

  onCorrect(vehicleEl, stationEl) {
    // Play vehicle sound then applause
    this.playGroupSound(this.currentVehicle.group);
    setTimeout(() => this.playApplause(), 1000);
    
    // Mark the station as "parked" visually
    stationEl.classList.add('highlight');
    stationEl.style.borderStyle = 'solid';
    stationEl.style.borderColor = '#4CAF50';
    stationEl.style.background = '#E8F5E9';
    
    // Fade out the vehicle in place
    vehicleEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    vehicleEl.style.opacity = '0';
    vehicleEl.style.transform += ' scale(0.3)';
    
    this.createConfetti(vehicleEl);
    
    this.score++;
    if (this.scoreVal) this.scoreVal.textContent = `${this.score} / ${this.maxScore}`;
    
    setTimeout(() => {
      if (this.score >= this.maxScore) {
        this.showWinScreen();
      } else {
        this.generateRound();
      }
    }, 1200);
  }

  onWrong(vehicleEl) {
    this.playCrash();
    this.playGlass();
    this.speakOops();
    
    vehicleEl.classList.add('anim-wrong-shake');
    setTimeout(() => {
      vehicleEl.classList.remove('anim-wrong-shake');
      vehicleEl.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      vehicleEl.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
      setTimeout(() => {
        if (this.currentVehicle) {
          vehicleEl.style.transition = 'none';
          vehicleEl.style.animation = 'vehicleBounce 2s infinite ease-in-out';
        }
      }, 400);
    }, 500);
  }
  
  createConfetti(el) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    for(let i=0; i<15; i++) {
      const conf = document.createElement('div');
      conf.className = 'vp-confetti';
      conf.style.left = (cx + (Math.random() - 0.5) * 100) + 'px';
      conf.style.top = cy + 'px';
      conf.style.backgroundColor = ['#ffeb3b', '#ff5722', '#4caf50', '#2196f3', '#e91e63'][Math.floor(Math.random() * 5)];
      document.body.appendChild(conf);
      setTimeout(() => conf.remove(), 2000);
    }
  }

  showWinScreen() {
    this.app.winGame(1);
    this.container.innerHTML = `
      <div style="text-align:center; padding-top: 50px;">
        <h1 style="font-size:3rem; color:#00838f;">🎉 Hoan Hô! 🎉</h1>
        <p style="font-size:1.5rem;">Bạn đã đỗ đúng tất cả các xe!</p>
        <button id="vp-replay-btn" style="margin-top:20px; padding: 15px 30px; font-size:1.2rem; border-radius:30px; background:#ff9800; color:white; border:none; box-shadow:0 5px 15px rgba(0,0,0,0.2);">Chơi Lại</button>
      </div>
    `;
    document.getElementById('vp-replay-btn').addEventListener('click', () => {
      this.start();
    });
  }

  updateLanguage(lang, T) {
    this.lang = lang;
    if (this.score < this.maxScore && this.currentVehicle) {
      // re-render the current screen to update languages
      this.renderGameScreen();
    }
  }

  destroy() {
    if (this.dragHandlers) {
      document.removeEventListener('mousemove', this.dragHandlers.onMove);
      document.removeEventListener('mouseup', this.dragHandlers.onEnd);
      document.removeEventListener('touchmove', this.dragHandlers.onMove);
      document.removeEventListener('touchend', this.dragHandlers.onEnd);
      document.removeEventListener('touchcancel', this.dragHandlers.onEnd);
    }
    
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
       // We can keep audioCtx alive or suspend it, but not close since it's heavy
    }
    this.container.innerHTML = '';
  }

  /* --- Audio Synths (Web Audio API) --- */
  
  playGroupSound(group) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    
    switch(group) {
      case 'emergency': this.playSiren(); break;
      case 'aviation': this.playTurbine(); break;
      case 'construction': this.playRumble(); break;
      case 'transport': this.playHonk(); break;
      case 'marine': this.playFoghorn(); break;
    }
  }
  
  playSiren() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.type = 'sine';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.3);
    osc.frequency.linearRampToValueAtTime(400, now + 0.6);
    osc.frequency.linearRampToValueAtTime(800, now + 0.9);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain.gain.setValueAtTime(0.5, now + 0.8);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    
    osc.start(now);
    osc.stop(now + 1.0);
  }
  
  playTurbine() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.type = 'sawtooth';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 1.0);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gain.gain.setValueAtTime(0.3, now + 0.8);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    
    osc.start(now);
    osc.stop(now + 1.0);
  }
  
  playRumble() {
    const bufferSize = this.audioCtx.sampleRate * 1.0;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    
    const gain = this.audioCtx.createGain();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.1);
    gain.gain.setValueAtTime(1, now + 0.8);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    
    noise.start(now);
  }
  
  playHonk() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.type = 'square';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.setValueAtTime(0.3, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }
  
  playFoghorn() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.type = 'sine';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(80, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.2);
    gain.gain.setValueAtTime(0.8, now + 1.2);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    
    osc.start(now);
    osc.stop(now + 1.5);
  }
  
  playApplause() {
    if (!this.audioCtx) return;
    const bufferSize = this.audioCtx.sampleRate * 1.5;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    
    const gain = this.audioCtx.createGain();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    
    noise.start(now);
  }
  
  playCrash() {
    if (!this.audioCtx) return;
    const bufferSize = this.audioCtx.sampleRate * 0.5;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    const now = this.audioCtx.currentTime;
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
    
    const gain = this.audioCtx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    noise.start(now);
  }
  
  playGlass() {
    if (!this.audioCtx) return;
    const bufferSize = this.audioCtx.sampleRate * 0.3;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    
    const gain = this.audioCtx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.start(now);
  }
  
  speakOops() {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Oops!');
      u.pitch = 1.8;
      u.rate = 1.5;
      window.speechSynthesis.speak(u);
    }
  }
}
