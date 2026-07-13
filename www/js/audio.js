/* Web Audio API Sound Synthesizer Engine */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) return;
    // Lazy initialize context on user interaction
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Soft bubble pop for tapping buttons
  playTap() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Popping balloons sound (sharp pop)
  playPop() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Uplifting sound for correct answer
  playSuccess() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playNote = (freq, delay, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.linearRampToValueAtTime(0.01, now + delay + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    // Major Arpeggio (C5, E5, G5, C6)
    playNote(523.25, 0, 0.15);     // C5
    playNote(659.25, 0.08, 0.15);  // E5
    playNote(783.99, 0.16, 0.15);  // G5
    playNote(1046.50, 0.24, 0.3);  // C6
  }

  // Boing/Down slide for wrong answer
  playFail() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  // Magic sparkles for game completion
  playCheer() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Play multiple random high notes in quick succession
    for (let i = 0; i < 15; i++) {
      const delay = i * 0.05;
      const freq = 800 + Math.random() * 800;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.linearRampToValueAtTime(0.01, now + delay + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    }
  }

  // Subtle audio feedback when painting
  playPaint(intensity = 0.5) {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200 + intensity * 150, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }
}

// Global Sound Instance
const audio = new SoundEngine();
