/* Layered Web Audio engine. Context creation remains gesture-gated for iOS. */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicEnabled = false;
    this.dashboardActive = true;
    this.music = null;
    this.buffers = new Map();
    this.sampleUrls = {
      tap: 'audio/ui/tap.ogg',
      pop: 'audio/ui/pop.ogg',
      flip: 'audio/ui/flip.ogg',
      success: 'audio/ui/success.ogg',
    };
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : .72;
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 16;
    this.compressor.ratio.value = 4;
    this.dry = this.ctx.createGain();
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this._createImpulse(.75, 2.8);
    this.wet = this.ctx.createGain();
    this.wet.gain.value = .14;
    this.dry.connect(this.compressor);
    this.reverb.connect(this.wet);
    this.wet.connect(this.compressor);
    this.compressor.connect(this.master);
    this.master.connect(this.ctx.destination);
    this._loadSamples();
  }

  resume() {
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : .72, this.ctx.currentTime, .015);
    }
    if (this.muted) this._pauseMusic();
    else if (this.musicEnabled) this._startMusic();
    return this.muted;
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    if (this.musicEnabled && !this.muted) {
      this.resume();
      this._startMusic();
    } else {
      this._pauseMusic();
    }
    return this.musicEnabled;
  }

  setDashboardActive(active) {
    this.dashboardActive = Boolean(active);
    if (this.dashboardActive && this.musicEnabled && !this.muted) this._startMusic();
    else this._pauseMusic();
  }

  _startMusic() {
    if (!this.dashboardActive || !this.musicEnabled || this.muted) return;
    if (!this.music) {
      this.music = new Audio('audio/music/dashboard.ogg');
      this.music.loop = true;
      this.music.preload = 'none';
      this.music.volume = .13;
    }
    this.music.play().catch(() => {});
  }

  _pauseMusic() {
    this.music?.pause();
  }

  _createImpulse(seconds, decay) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * ((length - i) / length) ** decay;
      }
    }
    return impulse;
  }

  async _loadSamples() {
    if (this.loadingSamples) return;
    this.loadingSamples = true;
    await Promise.all(Object.entries(this.sampleUrls).map(async ([name, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.status);
        this.buffers.set(name, await this.ctx.decodeAudioData(await response.arrayBuffer()));
      } catch (error) {
        console.warn(`Optional sound unavailable: ${name}`, error);
      }
    }));
  }

  _ready() {
    if (this.muted) return false;
    this.resume();
    return Boolean(this.ctx);
  }

  _route(node, reverb = .1) {
    node.connect(this.dry);
    if (reverb > 0) {
      const send = this.ctx.createGain();
      send.gain.value = reverb;
      node.connect(send);
      send.connect(this.reverb);
    }
  }

  _sample(name, volume = .35) {
    const buffer = this.buffers.get(name);
    if (!buffer) return false;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = .98 + Math.random() * .04;
    gain.gain.value = volume * (.9 + Math.random() * .2);
    source.connect(gain);
    this._route(gain, .08);
    source.start();
    return true;
  }

  _voice(freq, {
    delay = 0, duration = .18, volume = .2, type = 'triangle',
    attack = .008, decay = .05, sustain = .55, release = .09,
    filter = 2600, glide = 1, reverb = .12, partials = [1, .28, .1],
  } = {}) {
    const now = this.ctx.currentTime + delay;
    const velocity = volume * (.88 + Math.random() * .24);
    const detune = 2 ** ((Math.random() * 2 - 1) / 12);
    const output = this.ctx.createGain();
    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(Math.max(120, filter * .5), now);
    tone.frequency.exponentialRampToValueAtTime(filter, now + Math.max(.01, attack + decay));
    output.gain.setValueAtTime(.0001, now);
    output.gain.exponentialRampToValueAtTime(velocity, now + attack);
    output.gain.exponentialRampToValueAtTime(Math.max(.0001, velocity * sustain), now + attack + decay);
    output.gain.setValueAtTime(Math.max(.0001, velocity * sustain), now + duration);
    output.gain.exponentialRampToValueAtTime(.0001, now + duration + release);
    tone.connect(output);
    this._route(output, reverb);

    partials.forEach((level, index) => {
      const oscillator = this.ctx.createOscillator();
      const partialGain = this.ctx.createGain();
      const startFreq = freq * (index + 1) * detune;
      oscillator.type = index ? 'sine' : type;
      oscillator.frequency.setValueAtTime(startFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, startFreq * glide), now + duration);
      partialGain.gain.value = level;
      oscillator.connect(partialGain);
      partialGain.connect(tone);
      oscillator.start(now);
      oscillator.stop(now + duration + release + .03);
    });
  }

  _noise(duration = .06, volume = .13, frequency = 1800) {
    const length = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 1.3;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    this._route(gain, .05);
    source.start();
  }

  playTap() {
    if (!this._ready()) return;
    if (!this._sample('tap', .18)) this._voice(520, { duration: .055, release: .035, volume: .12, glide: .72, filter: 1900 });
  }

  playPop() {
    if (!this._ready()) return;
    this._sample('pop', .34);
    this._voice(920, { duration: .07, release: .04, volume: .17, glide: .16, filter: 4200 });
    this._noise(.045, .08, 2600);
  }

  playSuccess() {
    if (!this._ready()) return;
    this._sample('success', .2);
    [[523.25, 0], [659.25, .075], [783.99, .15], [1046.5, .23]].forEach(([note, delay]) =>
      this._voice(note, { delay, duration: .16, release: .18, volume: .13, filter: 3600, reverb: .25 }));
  }

  playFail() {
    if (!this._ready()) return;
    this._voice(260, { duration: .34, release: .1, volume: .17, type: 'sawtooth', glide: .34, filter: 900, reverb: .06 });
  }

  playCheer() {
    if (!this._ready()) return;
    this._sample('success', .28);
    const scale = [659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
    for (let i = 0; i < 12; i++) this._voice(scale[i % scale.length], {
      delay: i * .055, duration: .09, release: .14, volume: .08, filter: 5000, reverb: .35,
    });
  }

  playCardFlip() {
    if (!this._ready()) return;
    if (!this._sample('flip', .22)) this._noise(.04, .16, 1900);
    else this._noise(.025, .045, 2400);
  }

  playMatch() {
    if (!this._ready()) return;
    [[523.25, 0], [659.25, .09], [880, .18]].forEach(([note, delay]) =>
      this._voice(note, { delay, duration: .17, release: .16, volume: .16, filter: 3400, reverb: .23 }));
  }

  playMismatch() {
    if (!this._ready()) return;
    this._voice(280, { duration: .32, release: .08, volume: .15, type: 'sawtooth', glide: .39, filter: 780, reverb: .04 });
  }

  playLevelComplete() {
    if (!this._ready()) return;
    this._sample('success', .38);
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((note, index) =>
      this._voice(note, { delay: index * .12, duration: index === 4 ? .52 : .15, release: .3, volume: .16, filter: 4100, reverb: .35 }));
  }

  playMiss() {
    if (!this._ready()) return;
    this._voice(210, { duration: .13, release: .06, volume: .13, glide: .35, filter: 700, reverb: .02 });
  }

  playPaint(intensity = .5) {
    if (!this._ready()) return;
    this._voice(190 + intensity * 170, { duration: .025, release: .025, volume: .025, filter: 1000, reverb: .02, partials: [1, .12] });
  }
}

const audio = new SoundEngine();
