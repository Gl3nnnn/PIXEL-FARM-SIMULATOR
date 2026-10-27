import { loadSettings, saveSettings } from './save';
import type { Settings } from '../types';

type SfxName =
  | 'click'
  | 'plant'
  | 'water'
  | 'till'
  | 'harvest'
  | 'coin'
  | 'error'
  | 'level'
  | 'sleep'
  | 'craft'
  | 'animal';

const MELODY = [0, 4, 7, 12, 7, 4, 9, 5, 0, 7, 12, 9, 4, 7, 5, 2];

export class AudioManager {
  settings: Settings = loadSettings();
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;

  init(): void {
    if (this.ctx) return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.settings.volume;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
      if (this.settings.music) this.startMusic();
    } catch {
      /* audio unsupported */
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    slideTo?: number,
    dest?: AudioNode
  ): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(dest ?? this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private noteFreq(semitone: number): number {
    return 261.63 * Math.pow(2, semitone / 12);
  }

  play(name: SfxName): void {
    if (!this.settings.sfx) return;
    this.init();
    this.resume();
    if (!this.ctx) return;
    switch (name) {
      case 'click':
        this.tone(660, 0.06, 'square', 0.06);
        break;
      case 'plant':
        this.tone(420, 0.09, 'triangle', 0.14, 620);
        this.tone(620, 0.12, 'sine', 0.08, 880);
        break;
      case 'water':
        this.tone(900, 0.14, 'sine', 0.09, 500);
        this.tone(1200, 0.1, 'sine', 0.05, 700);
        break;
      case 'till':
        this.tone(160, 0.16, 'square', 0.1, 90);
        this.tone(90, 0.1, 'triangle', 0.12, 60);
        break;
      case 'harvest':
        this.tone(540, 0.1, 'triangle', 0.13, 720);
        this.tone(760, 0.12, 'sine', 0.1, 980);
        this.tone(980, 0.16, 'sine', 0.07, 1200);
        break;
      case 'coin':
        this.tone(1040, 0.08, 'square', 0.09);
        this.tone(1560, 0.14, 'square', 0.07);
        break;
      case 'error':
        this.tone(220, 0.16, 'sawtooth', 0.07, 150);
        break;
      case 'level':
        [0, 4, 7, 12].forEach((semi, i) => {
          window.setTimeout(() => this.tone(this.noteFreq(semi + 12), 0.22, 'triangle', 0.12), i * 90);
        });
        break;
      case 'sleep':
        this.tone(400, 0.5, 'sine', 0.07, 180);
        break;
      case 'craft':
        this.tone(300, 0.09, 'square', 0.09, 380);
        this.tone(520, 0.14, 'triangle', 0.1, 700);
        break;
      case 'animal':
        this.tone(700, 0.08, 'sine', 0.09, 900);
        this.tone(900, 0.1, 'triangle', 0.06, 700);
        break;
    }
  }

  startMusic(): void {
    if (!this.ctx || this.musicTimer !== null) return;
    this.settings.music = true;
    this.musicTimer = window.setInterval(() => this.musicStep(), 460);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.settings.music = false;
  }

  private musicStep(): void {
    if (!this.ctx || !this.musicGain || document.hidden) return;
    if (this.ctx.state === 'suspended') return;
    const semitone = MELODY[this.step % MELODY.length];
    const freq = this.noteFreq(semitone + 12);
    this.tone(freq, 0.5, 'triangle', 0.09, undefined, this.musicGain);
    if (this.step % 4 === 0) {
      this.tone(this.noteFreq(semitone - 12), 0.7, 'sine', 0.1, undefined, this.musicGain);
    }
    this.step += 1;
  }

  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    if (this.master) this.master.gain.value = this.settings.volume;
    saveSettings(this.settings);
  }

  setSfx(enabled: boolean): void {
    this.settings.sfx = enabled;
    saveSettings(this.settings);
  }

  setMusic(enabled: boolean): void {
    if (enabled) {
      this.init();
      this.startMusic();
    } else {
      this.stopMusic();
    }
    saveSettings(this.settings);
  }
}

export const audio = new AudioManager();
