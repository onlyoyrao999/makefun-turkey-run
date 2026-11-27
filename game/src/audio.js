// All sound is synthesized with WebAudio: no audio files, nothing to fetch,
// nothing the offline game cannot play. Created lazily on the first user
// gesture (browsers block audio before one); screenshot mode never starts it.
export class SoundBank {
  constructor() {
    this.context = null;
    this.musicTimer = null;
    this.muted = false;
    this.musicOn = false;
    this.musicStep = 0;
  }

  /** Call from a user gesture. Safe to call repeatedly; safe with no gesture. */
  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return true;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      this.context = new Ctor();
      return true;
    } catch {
      return false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.context) this.context.suspend();
    if (!this.muted && this.context) void this.context.resume();
    return this.muted;
  }

  tone(freq, seconds, type, volume, when = 0, slideTo = null) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + seconds);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(this.context.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  noise(seconds, volume, when = 0, lowpass = 1200) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start(t0);
  }

  /** The turkey's gobble: three quick low honks. */
  gobble() {
    this.tone(180, 0.09, 'sawtooth', 0.16, 0, 120);
    this.tone(170, 0.09, 'sawtooth', 0.16, 0.11, 110);
    this.tone(200, 0.16, 'sawtooth', 0.18, 0.22, 90);
  }

  jump() {
    this.tone(280, 0.16, 'sine', 0.2, 0, 620);
  }

  doubleJump() {
    this.tone(420, 0.14, 'sine', 0.18, 0, 880);
  }

  corn() {
    this.tone(880, 0.07, 'triangle', 0.2);
    this.tone(1318, 0.12, 'triangle', 0.18, 0.06);
  }

  golden() {
    this.tone(660, 0.08, 'triangle', 0.2);
    this.tone(880, 0.08, 'triangle', 0.2, 0.07);
    this.tone(1320, 0.16, 'triangle', 0.2, 0.14);
  }

  feather() {
    this.tone(520, 0.3, 'sine', 0.14, 0, 1040);
  }

  chili() {
    this.tone(220, 0.1, 'square', 0.12, 0, 440);
    this.tone(440, 0.12, 'square', 0.1, 0.09, 880);
  }

  thud() {
    this.noise(0.22, 0.3, 0, 500);
    this.tone(90, 0.22, 'sine', 0.3, 0, 45);
  }

  knife() {
    this.tone(1400, 0.18, 'sawtooth', 0.08, 0, 300);
  }

  smash() {
    this.noise(0.16, 0.28, 0, 900);
    this.tone(160, 0.14, 'square', 0.16, 0, 70);
  }

  caught() {
    this.tone(392, 0.18, 'sawtooth', 0.16, 0, 370);
    this.tone(311, 0.18, 'sawtooth', 0.16, 0.18, 290);
    this.tone(233, 0.4, 'sawtooth', 0.18, 0.36, 110);
  }

  fanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => this.tone(freq, 0.22, 'triangle', 0.2, i * 0.13));
    this.tone(1319, 0.5, 'triangle', 0.2, 0.55);
  }

  // A cheerful little banjo-ish loop: plucked melody over a two-note bass.
  // Scheduled a bar at a time so it keeps time without a worker.
  startMusic() {
    if (!this.context || this.musicOn) return;
    this.musicOn = true;
    const melody = [659, 784, 880, 784, 659, 587, 523, 587, 659, 784, 988, 880, 784, 659, 587, 0];
    const bass = [131, 98, 131, 98, 165, 131, 98, 131];
    const stepSeconds = 0.21;
    const tick = () => {
      if (!this.musicOn) return;
      const i = this.musicStep;
      const note = melody[i % melody.length];
      if (note) this.tone(note, 0.18, 'triangle', 0.07);
      if (i % 2 === 0) this.tone(bass[(i / 2) % bass.length], 0.3, 'sine', 0.09);
      this.musicStep += 1;
      this.musicTimer = window.setTimeout(tick, stepSeconds * 1000);
    };
    tick();
  }

  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
