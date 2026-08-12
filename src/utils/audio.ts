// Web Audio API Synthesizer for Crapless Craps
import {
  WIN_ATS_B64,
  WIN_SMALL_TALL_B64,
  getAtsBytes,
  getSmallTallBytes,
  getAtsBlobUrl,
  getSmallTallBlobUrl,
} from './audioData';

// Module-level persistent AudioContext reference across remounts & re-evaluations
let sharedAudioContext: AudioContext | null = null;

if (typeof window !== 'undefined') {
  const globalObj = window as unknown as Record<string, unknown>;
  if (globalObj.__CRAPS_AUDIO_CONTEXT__) {
    sharedAudioContext = globalObj.__CRAPS_AUDIO_CONTEXT__ as AudioContext;
  }
}

function base64ToArrayBuffer(base64DataUrl: string): ArrayBuffer {
  try {
    const base64 = base64DataUrl.includes(',') ? base64DataUrl.split(',')[1] : base64DataUrl;
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error('Failed to convert base64 to ArrayBuffer:', e);
    return new ArrayBuffer(0);
  }
}

interface GlobalAudioCache {
  atsAudioBuffer: AudioBuffer | null;
  smallTallAudioBuffer: AudioBuffer | null;
  m1AudioBuffer: AudioBuffer | null;
  m10AudioBuffer: AudioBuffer | null;
  rawAtsArrayBuffer: ArrayBuffer | null;
  rawSmallTallArrayBuffer: ArrayBuffer | null;
  rawM1ArrayBuffer: ArrayBuffer | null;
  rawM10ArrayBuffer: ArrayBuffer | null;
  atsAudioElement: HTMLAudioElement | null;
  smallTallAudioElement: HTMLAudioElement | null;
  m1AudioElement: HTMLAudioElement | null;
  m10AudioElement: HTMLAudioElement | null;
  decodedContext: AudioContext | null;
  isPreloadingAts: boolean;
  isPreloadingSmallTall: boolean;
  isPreloadingM1: boolean;
  isPreloadingM10: boolean;
}

function getGlobalCache(): GlobalAudioCache {
  if (typeof window === 'undefined') {
    return {
      atsAudioBuffer: null,
      smallTallAudioBuffer: null,
      m1AudioBuffer: null,
      m10AudioBuffer: null,
      rawAtsArrayBuffer: null,
      rawSmallTallArrayBuffer: null,
      rawM1ArrayBuffer: null,
      rawM10ArrayBuffer: null,
      atsAudioElement: null,
      smallTallAudioElement: null,
      m1AudioElement: null,
      m10AudioElement: null,
      decodedContext: null,
      isPreloadingAts: false,
      isPreloadingSmallTall: false,
      isPreloadingM1: false,
      isPreloadingM10: false,
    };
  }
  const globalObj = window as unknown as Record<string, unknown>;
  if (!globalObj.__CRAPS_AUDIO_CACHE__) {
    globalObj.__CRAPS_AUDIO_CACHE__ = {
      atsAudioBuffer: null,
      smallTallAudioBuffer: null,
      m1AudioBuffer: null,
      m10AudioBuffer: null,
      rawAtsArrayBuffer: null,
      rawSmallTallArrayBuffer: null,
      rawM1ArrayBuffer: null,
      rawM10ArrayBuffer: null,
      atsAudioElement: null,
      smallTallAudioElement: null,
      m1AudioElement: null,
      m10AudioElement: null,
      decodedContext: null,
      isPreloadingAts: false,
      isPreloadingSmallTall: false,
      isPreloadingM1: false,
      isPreloadingM10: false,
    };
  }
  return globalObj.__CRAPS_AUDIO_CACHE__ as GlobalAudioCache;
}

class SoundManager {
  private get ctx(): AudioContext | null {
    if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
      return sharedAudioContext;
    }
    return null;
  }

  private get atsAudioBuffer(): AudioBuffer | null {
    return getGlobalCache().atsAudioBuffer;
  }
  private set atsAudioBuffer(val: AudioBuffer | null) {
    getGlobalCache().atsAudioBuffer = val;
  }

  private get smallTallAudioBuffer(): AudioBuffer | null {
    return getGlobalCache().smallTallAudioBuffer;
  }
  private set smallTallAudioBuffer(val: AudioBuffer | null) {
    getGlobalCache().smallTallAudioBuffer = val;
  }

  private get rawAtsArrayBuffer(): ArrayBuffer | null {
    return getGlobalCache().rawAtsArrayBuffer;
  }
  private set rawAtsArrayBuffer(val: ArrayBuffer | null) {
    getGlobalCache().rawAtsArrayBuffer = val;
  }

  private get rawSmallTallArrayBuffer(): ArrayBuffer | null {
    return getGlobalCache().rawSmallTallArrayBuffer;
  }
  private set rawSmallTallArrayBuffer(val: ArrayBuffer | null) {
    getGlobalCache().rawSmallTallArrayBuffer = val;
  }

  private get rawM1ArrayBuffer(): ArrayBuffer | null {
    return getGlobalCache().rawM1ArrayBuffer;
  }
  private set rawM1ArrayBuffer(val: ArrayBuffer | null) {
    getGlobalCache().rawM1ArrayBuffer = val;
  }

  private get rawM10ArrayBuffer(): ArrayBuffer | null {
    return getGlobalCache().rawM10ArrayBuffer;
  }
  private set rawM10ArrayBuffer(val: ArrayBuffer | null) {
    getGlobalCache().rawM10ArrayBuffer = val;
  }

  private get m1AudioBuffer(): AudioBuffer | null {
    return getGlobalCache().m1AudioBuffer;
  }
  private set m1AudioBuffer(val: AudioBuffer | null) {
    getGlobalCache().m1AudioBuffer = val;
  }

  private get m10AudioBuffer(): AudioBuffer | null {
    return getGlobalCache().m10AudioBuffer;
  }
  private set m10AudioBuffer(val: AudioBuffer | null) {
    getGlobalCache().m10AudioBuffer = val;
  }

  private get atsAudioElement(): HTMLAudioElement | null {
    return getGlobalCache().atsAudioElement;
  }
  private set atsAudioElement(val: HTMLAudioElement | null) {
    getGlobalCache().atsAudioElement = val;
  }

  private get smallTallAudioElement(): HTMLAudioElement | null {
    return getGlobalCache().smallTallAudioElement;
  }
  private set smallTallAudioElement(val: HTMLAudioElement | null) {
    getGlobalCache().smallTallAudioElement = val;
  }

  private get m1AudioElement(): HTMLAudioElement | null {
    return getGlobalCache().m1AudioElement;
  }
  private set m1AudioElement(val: HTMLAudioElement | null) {
    getGlobalCache().m1AudioElement = val;
  }

  private get m10AudioElement(): HTMLAudioElement | null {
    return getGlobalCache().m10AudioElement;
  }
  private set m10AudioElement(val: HTMLAudioElement | null) {
    getGlobalCache().m10AudioElement = val;
  }

  private get decodedContext(): AudioContext | null {
    return getGlobalCache().decodedContext;
  }
  private set decodedContext(val: AudioContext | null) {
    getGlobalCache().decodedContext = val;
  }

  private get isPreloadingAts(): boolean {
    return getGlobalCache().isPreloadingAts;
  }
  private set isPreloadingAts(val: boolean) {
    getGlobalCache().isPreloadingAts = val;
  }

  private get isPreloadingSmallTall(): boolean {
    return getGlobalCache().isPreloadingSmallTall;
  }
  private set isPreloadingSmallTall(val: boolean) {
    getGlobalCache().isPreloadingSmallTall = val;
  }

  private enabled: boolean = true;
  private currentFunkTimeout: number | null = null;
  private currentAtsAudio: HTMLAudioElement | null = null;
  private atsBufferSource: AudioBufferSourceNode | null = null;
  private funkOscillators: OscillatorNode[] = [];
  private allPlacedIndex: number = 0;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.cachedVoices = window.speechSynthesis.getVoices();
        };
        this.cachedVoices = window.speechSynthesis.getVoices();
      }
      this.ensureRawArrayBuffers();
      this.initAudioElements();
      this.preloadAtsAudio();
      (window as unknown as Record<string, unknown>).getAtsAudioDiagnostics = () => this.getAtsAudioDiagnostics();

      // Global user gesture listener to warm up AudioContext, unlock media, and decode buffers
      const unlockAudio = () => {
        this.warmBoot();
      };
      window.addEventListener('pointerdown', unlockAudio, { capture: true, passive: true });
      window.addEventListener('keydown', unlockAudio, { capture: true, passive: true });
      window.addEventListener('touchstart', unlockAudio, { capture: true, passive: true });
    }
  }

  private ensureRawArrayBuffers() {
    if (!this.rawAtsArrayBuffer || this.rawAtsArrayBuffer.byteLength === 0) {
      const bytes = getAtsBytes();
      this.rawAtsArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
    if (!this.rawSmallTallArrayBuffer || this.rawSmallTallArrayBuffer.byteLength === 0) {
      const bytes = getSmallTallBytes();
      this.rawSmallTallArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
    this.ensureMilestoneArrayBuffers();
  }

  private ensureMilestoneArrayBuffers() {
    if (typeof window === 'undefined') return;
    if (!this.rawM1ArrayBuffer) {
      fetch('/milestone_1m.mp3')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.arrayBuffer();
        })
        .then((buf) => {
          if (buf && buf.byteLength > 0) {
            this.rawM1ArrayBuffer = buf;
            this.decodeAllRawBuffers();
          }
        })
        .catch((e) => console.warn('Milestone 1M audio fetch skipped/failed:', e));
    }
    if (!this.rawM10ArrayBuffer) {
      fetch('/milestone_10m.mp3')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.arrayBuffer();
        })
        .then((buf) => {
          if (buf && buf.byteLength > 0) {
            this.rawM10ArrayBuffer = buf;
            this.decodeAllRawBuffers();
          }
        })
        .catch((e) => console.warn('Milestone 10M audio fetch skipped/failed:', e));
    }
  }

  /** Diagnostic log method requested by user to inspect ATS audio state */
  public getAtsAudioDiagnostics() {
    const diag = {
      audioContext: {
        exists: !!this.ctx,
        state: this.ctx ? this.ctx.state : 'null/not-initialized',
        sampleRate: this.ctx ? this.ctx.sampleRate : null,
      },
      winAts13Sec: {
        src: 'WIN_ATS_B64 (Embedded Base64)',
        bufferLoaded: !!this.atsAudioBuffer,
        bufferDurationSec: this.atsAudioBuffer ? Math.round(this.atsAudioBuffer.duration * 100) / 100 : null,
        rawBufferBytes: this.rawAtsArrayBuffer ? this.rawAtsArrayBuffer.byteLength : 0,
        elementExists: !!this.atsAudioElement,
        readyState: this.atsAudioElement ? this.atsAudioElement.readyState : null,
      },
      smallOrTall8Sec: {
        src: 'WIN_SMALL_TALL_B64 (Embedded Base64)',
        bufferLoaded: !!this.smallTallAudioBuffer,
        bufferDurationSec: this.smallTallAudioBuffer ? Math.round(this.smallTallAudioBuffer.duration * 100) / 100 : null,
        rawBufferBytes: this.rawSmallTallArrayBuffer ? this.rawSmallTallArrayBuffer.byteLength : 0,
        elementExists: !!this.smallTallAudioElement,
        readyState: this.smallTallAudioElement ? this.smallTallAudioElement.readyState : null,
      },
      soundManagerEnabled: this.enabled,
    };
    console.log('=== [ATS Audio Diagnostic Report] ===', JSON.stringify(diag, null, 2));
    return diag;
  }

  public warmBoot() {
    this.initCtx();
    this.initAudioElements();
    this.unlockMediaElements();
    this.ensureRawArrayBuffers();

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.decodeAllRawBuffers();
        }).catch(() => {});
      } else if (this.ctx.state === 'running') {
        this.decodeAllRawBuffers();
      }
    }
  }

  private unlockMediaElements() {
    [this.atsAudioElement, this.smallTallAudioElement, this.m1AudioElement, this.m10AudioElement].forEach((elem) => {
      if (elem && elem.paused) {
        elem.volume = 0;
        const p = elem.play();
        if (p !== undefined) {
          p.then(() => {
            elem.pause();
            elem.currentTime = 0;
            elem.volume = 0.612;
          }).catch(() => {});
        }
      }
    });
  }

  private decodeAllRawBuffers() {
    this.ensureRawArrayBuffers();
    if (this.ctx && (this.ctx.state === 'running' || this.ctx.state === 'suspended')) {
      if (this.rawSmallTallArrayBuffer && (!this.smallTallAudioBuffer || this.decodedContext !== this.ctx)) {
        this.decodeAudioBuffer(this.rawSmallTallArrayBuffer.slice(0))
          .then((decoded) => {
            if (decoded) {
              this.smallTallAudioBuffer = decoded;
              this.decodedContext = this.ctx;
              console.log('Successfully decoded win_small_tall AudioBuffer');
            }
          })
          .catch((e) => console.warn('Decode small/tall error in warmBoot:', e));
      }
      if (this.rawAtsArrayBuffer && (!this.atsAudioBuffer || this.decodedContext !== this.ctx)) {
        this.decodeAudioBuffer(this.rawAtsArrayBuffer.slice(0))
          .then((decoded) => {
            if (decoded) {
              this.atsAudioBuffer = decoded;
              this.decodedContext = this.ctx;
              console.log('Successfully decoded win_ats AudioBuffer');
            }
          })
          .catch((e) => console.warn('Decode ats error in warmBoot:', e));
      }
      if (this.rawM1ArrayBuffer && (!this.m1AudioBuffer || this.decodedContext !== this.ctx)) {
        this.decodeAudioBuffer(this.rawM1ArrayBuffer.slice(0))
          .then((decoded) => {
            if (decoded) {
              this.m1AudioBuffer = decoded;
              this.decodedContext = this.ctx;
              console.log('Successfully decoded milestone_1m AudioBuffer');
            }
          })
          .catch((e) => console.warn('Decode M1 error in warmBoot:', e));
      }
      if (this.rawM10ArrayBuffer && (!this.m10AudioBuffer || this.decodedContext !== this.ctx)) {
        this.decodeAudioBuffer(this.rawM10ArrayBuffer.slice(0))
          .then((decoded) => {
            if (decoded) {
              this.m10AudioBuffer = decoded;
              this.decodedContext = this.ctx;
              console.log('Successfully decoded milestone_10m AudioBuffer');
            }
          })
          .catch((e) => console.warn('Decode M10 error in warmBoot:', e));
      }
    }
  }

  private initAudioElements() {
    if (typeof window === 'undefined') return;
    if (!this.atsAudioElement) {
      this.atsAudioElement = new Audio(getAtsBlobUrl());
      this.atsAudioElement.preload = 'auto';
      this.atsAudioElement.load();
    }
    if (!this.smallTallAudioElement) {
      this.smallTallAudioElement = new Audio(getSmallTallBlobUrl());
      this.smallTallAudioElement.preload = 'auto';
      this.smallTallAudioElement.load();
    }
    if (!this.m1AudioElement) {
      this.m1AudioElement = new Audio('/milestone_1m.mp3');
      this.m1AudioElement.preload = 'auto';
      this.m1AudioElement.load();
    }
    if (!this.m10AudioElement) {
      this.m10AudioElement = new Audio('/milestone_10m.mp3');
      this.m10AudioElement.preload = 'auto';
      this.m10AudioElement.load();
    }
  }

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (sharedAudioContext && sharedAudioContext.state === 'closed') {
      sharedAudioContext = null;
    }
    if (!sharedAudioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioContext = new AudioCtx();
        (window as unknown as Record<string, unknown>).__CRAPS_AUDIO_CONTEXT__ = sharedAudioContext;
      }
    }
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
  }

  private decodeAudioBuffer(buffer: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.ctx) {
        reject(new Error('No AudioContext available'));
        return;
      }
      if (!buffer || buffer.byteLength === 0) {
        reject(new Error('Empty ArrayBuffer provided for audio decoding'));
        return;
      }
      try {
        const res = this.ctx.decodeAudioData(
          buffer,
          (decoded) => resolve(decoded),
          (err) => reject(err)
        );
        if (res && typeof (res as Promise<AudioBuffer>).then === 'function') {
          (res as Promise<AudioBuffer>).then(resolve).catch(reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  public async getDecodedAtsBuffer(): Promise<AudioBuffer | null> {
    this.initCtx();
    if (!this.ctx) return null;

    if (this.atsAudioBuffer && this.decodedContext === this.ctx) {
      return this.atsAudioBuffer;
    }

    this.ensureRawArrayBuffers();
    if (!this.rawAtsArrayBuffer || this.rawAtsArrayBuffer.byteLength === 0) {
      return null;
    }

    try {
      const decoded = await this.decodeAudioBuffer(this.rawAtsArrayBuffer.slice(0));
      if (decoded) {
        this.atsAudioBuffer = decoded;
        this.decodedContext = this.ctx;
        return decoded;
      }
    } catch (e) {
      console.warn('Failed to decode ATS AudioBuffer for current AudioContext:', e);
    }
    return null;
  }

  public async getDecodedSmallTallBuffer(): Promise<AudioBuffer | null> {
    this.initCtx();
    if (!this.ctx) return null;

    if (this.smallTallAudioBuffer && this.decodedContext === this.ctx) {
      return this.smallTallAudioBuffer;
    }

    this.ensureRawArrayBuffers();
    if (!this.rawSmallTallArrayBuffer || this.rawSmallTallArrayBuffer.byteLength === 0) {
      return null;
    }

    try {
      const decoded = await this.decodeAudioBuffer(this.rawSmallTallArrayBuffer.slice(0));
      if (decoded) {
        this.smallTallAudioBuffer = decoded;
        this.decodedContext = this.ctx;
        return decoded;
      }
    } catch (e) {
      console.warn('Failed to decode Small/Tall AudioBuffer for current AudioContext:', e);
    }
    return null;
  }

  public async getDecodedM1Buffer(): Promise<AudioBuffer | null> {
    this.initCtx();
    if (!this.ctx) return null;

    if (this.m1AudioBuffer && this.decodedContext === this.ctx) {
      return this.m1AudioBuffer;
    }

    this.ensureRawArrayBuffers();
    if (!this.rawM1ArrayBuffer || this.rawM1ArrayBuffer.byteLength === 0) {
      return null;
    }

    try {
      const decoded = await this.decodeAudioBuffer(this.rawM1ArrayBuffer.slice(0));
      if (decoded) {
        this.m1AudioBuffer = decoded;
        this.decodedContext = this.ctx;
        return decoded;
      }
    } catch (e) {
      console.warn('Failed to decode M1 AudioBuffer for current AudioContext:', e);
    }
    return null;
  }

  public async getDecodedM10Buffer(): Promise<AudioBuffer | null> {
    this.initCtx();
    if (!this.ctx) return null;

    if (this.m10AudioBuffer && this.decodedContext === this.ctx) {
      return this.m10AudioBuffer;
    }

    this.ensureRawArrayBuffers();
    if (!this.rawM10ArrayBuffer || this.rawM10ArrayBuffer.byteLength === 0) {
      return null;
    }

    try {
      const decoded = await this.decodeAudioBuffer(this.rawM10ArrayBuffer.slice(0));
      if (decoded) {
        this.m10AudioBuffer = decoded;
        this.decodedContext = this.ctx;
        return decoded;
      }
    } catch (e) {
      console.warn('Failed to decode M10 AudioBuffer for current AudioContext:', e);
    }
    return null;
  }

  private preloadAtsAudio() {
    this.ensureRawArrayBuffers();
    this.initCtx();
    if (this.ctx) {
      this.decodeAllRawBuffers();
    }
  }

  public toggleSound(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopFunkJam();
    }
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // 1. Soothing organic chip placement sound (soft wood/marble tap)
  public playChip() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.20, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 2. Play dice roll sound (punchy warm single-note bass thud)
  public playDiceRoll() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Tonal bass oscillator (sine + triangle character for punch and body)
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Punchy initial pitch sweep: 170Hz -> 60Hz for solid kick impact
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

    // Filter opens brighter at attack (1400Hz) to give crisp initial punch then settles (500Hz)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.08);

    // Louder peak volume (0.65) with punchy 4ms attack and natural 0.28s body decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.30);
  }

  // 3. Ultra-soothing single-note win sound (headache-safe warm mellow tone)
  public playWin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Pure, warm sine wave note at A4 (440 Hz)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);

    // Warm lowpass filter to eliminate any sharp edges
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, now);

    // Soft, smooth envelope: 12ms gentle attack, smooth exponential decay over 0.35s
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  // 4. Soothing 808 Double Bass Kick sound for 7-Out
  public playSevenOut() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const play808Thump = (startTime: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, startTime);
      osc.frequency.exponentialRampToValueAtTime(36, startTime + 0.22);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.30);
    };

    const now = this.ctx.currentTime;
    play808Thump(now);
    play808Thump(now + 0.18); // Double kick thump!
  }

  // 5. British Horn Fanfare for ATS Small or Tall hit
  public playHornFanfare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // Regal brass fanfare notes (D4, F#4, A4, D5, A4, D5)
    const fanfareNotes = [
      { freq: 293.66, dur: 0.12, delay: 0 },
      { freq: 369.99, dur: 0.12, delay: 130 },
      { freq: 440.00, dur: 0.12, delay: 260 },
      { freq: 587.33, dur: 0.35, delay: 390 },
      { freq: 440.00, dur: 0.12, delay: 780 },
      { freq: 587.33, dur: 0.50, delay: 920 },
    ];

    fanfareNotes.forEach((n) => {
      setTimeout(() => {
        if (!this.ctx || !this.enabled) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(n.freq, now);
        osc2.frequency.setValueAtTime(n.freq * 1.002, now); // subtle chorus

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(1000, now + n.dur);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.dur + 0.05);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + n.dur + 0.06);
        osc2.stop(now + n.dur + 0.06);
      }, n.delay);
    });
  }

  // 6. WIN ALL Victory Audio Track (13-second MP3: win_ats.mp3)
  public async playAllFunkJam() {
    if (!this.enabled) return;
    this.stopFunkJam(); // Clear any previous instance
    this.initCtx();

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume error:', e);
      }
    }

    // 1. Web Audio Buffer Source (zero latency, context-aware)
    const buffer = await this.getDecodedAtsBuffer();
    if (this.ctx && buffer) {
      try {
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.612, this.ctx.currentTime);
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        this.atsBufferSource = source;
        console.log('Successfully playing WIN ALL (13s MP3: win_ats.mp3) via Web Audio API Buffer');
        return;
      } catch (e) {
        console.warn('Web Audio buffer playback error for ALL:', e);
      }
    }

    // 2. Pre-unlocked HTML Audio Fallback
    console.warn('Falling back to HTMLAudioElement for WIN ALL');
    this.playFallbackAudioTrack('ats', 0.612);
  }

  // 6b. WIN SMALL or TALL Audio Track (8-second MP3: win_small_tall.mp3)
  public async playSmallTallWin() {
    if (!this.enabled) return;
    this.stopFunkJam(); // Clear any previous instance
    this.initCtx();

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume error:', e);
      }
    }

    // 1. Web Audio Buffer Source (zero latency, context-aware)
    const buffer = await this.getDecodedSmallTallBuffer();
    if (this.ctx && buffer) {
      try {
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.612, this.ctx.currentTime);
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        this.atsBufferSource = source;
        console.log('Successfully playing Small/Tall (8s MP3: win_small_tall.mp3) via Web Audio API Buffer');
        return;
      } catch (e) {
        console.warn('Web Audio buffer playback error for Small/Tall:', e);
      }
    }

    // 2. Pre-unlocked HTML Audio Fallback
    console.warn('Falling back to HTMLAudioElement for Small/Tall');
    this.playFallbackAudioTrack('small_tall', 0.612);
  }

  // 6c. $1 Million Bankroll Milestone Audio Track (milestone_1m.mp3)
  public async playMilestone1M() {
    if (!this.enabled) return;
    this.stopFunkJam(); // Clear any previous instance
    this.initCtx();

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume error:', e);
      }
    }

    // 1. Web Audio Buffer Source (zero latency, context-aware)
    const buffer = await this.getDecodedM1Buffer();
    if (this.ctx && buffer) {
      try {
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        this.atsBufferSource = source;
        console.log('Successfully playing $1M Milestone (milestone_1m.mp3) via Web Audio API Buffer');
        return;
      } catch (e) {
        console.warn('Web Audio buffer playback error for $1M Milestone:', e);
      }
    }

    // 2. Pre-unlocked HTML Audio Fallback
    console.warn('Falling back to HTMLAudioElement for $1M Milestone');
    this.playFallbackAudioTrack('m1', 0.7);
  }

  // 6d. $10 Million Bankroll Milestone Audio Track (milestone_10m.mp3)
  public async playMilestone10M() {
    if (!this.enabled) return;
    this.stopFunkJam(); // Clear any previous instance
    this.initCtx();

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume error:', e);
      }
    }

    // 1. Web Audio Buffer Source (zero latency, context-aware)
    const buffer = await this.getDecodedM10Buffer();
    if (this.ctx && buffer) {
      try {
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        this.atsBufferSource = source;
        console.log('Successfully playing $10M Milestone (milestone_10m.mp3) via Web Audio API Buffer');
        return;
      } catch (e) {
        console.warn('Web Audio buffer playback error for $10M Milestone:', e);
      }
    }

    // 2. Pre-unlocked HTML Audio Fallback
    console.warn('Falling back to HTMLAudioElement for $10M Milestone');
    this.playFallbackAudioTrack('m10', 0.7);
  }

  private playFallbackAudioTrack(track: 'ats' | 'small_tall' | 'm1' | 'm10', vol: number) {
    try {
      const audio =
        track === 'small_tall'
          ? this.smallTallAudioElement
          : track === 'm1'
          ? this.m1AudioElement
          : track === 'm10'
          ? this.m10AudioElement
          : this.atsAudioElement;
      if (audio) {
        audio.currentTime = 0;
        audio.volume = vol;
        this.currentAtsAudio = audio;
        const promise = audio.play();
        if (promise !== undefined) {
          promise.catch((err) => {
            console.warn(`HTML Audio play fallback failed for ${track}:`, err);
            const blobUrl =
              track === 'small_tall'
                ? getSmallTallBlobUrl()
                : track === 'm1'
                ? '/milestone_1m.mp3'
                : track === 'm10'
                ? '/milestone_10m.mp3'
                : getAtsBlobUrl();
            const fresh = new Audio(blobUrl);
            fresh.volume = vol;
            this.currentAtsAudio = fresh;
            fresh.play().catch((e) => console.warn(`Fresh retry failed for ${track}:`, e));
          });
        }
      }
    } catch (e) {
      console.warn(`Fallback audio exception for ${track}:`, e);
    }
  }

  // 6b. 12-Second Disappointed Sarcastic Tune (Sad Trombone / Price Is Right / Melancholic Slow Groove) when MAKE 'EM ALL hits with NO BET
  public playAllDisappointedJam() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopFunkJam(); // Clear any previous running jam

    const bpm = 78;
    const beatSec = 60 / bpm;
    const totalDuration = 12; // 12 seconds long (halved from 24s)

    // Sad D Minor Low Bassline (D1, F1, Eb1, D1)
    const sadBassRiff = [36.71, 43.65, 38.89, 36.71];

    // Sarcastic "Wah-Wah" Sad Trombone Descending Pitch Notes (F4 -> E4 -> Eb4 -> D4)
    const sadHornNotes = [349.23, 329.63, 311.13, 293.66];

    let currentStep = 0;
    const totalSteps = Math.floor(totalDuration / (beatSec / 2));

    const playDisappointedStep = () => {
      if (!this.ctx || !this.enabled || currentStep >= totalSteps) return;
      const now = this.ctx.currentTime;

      // Heavy 808 Kick on step 0, 4, 8, 12...
      if (currentStep % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(100, now);
        kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.25);
        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.25);
      }

      // Muted Snare / Rimshot on step 2, 6...
      if (currentStep % 4 === 2) {
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
      }

      // Low Plodding Sad Bass
      const bassFreq = sadBassRiff[Math.floor(currentStep / 2) % sadBassRiff.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(280, now);
      bassGain.gain.setValueAtTime(0.22, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + beatSec * 0.6);
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + beatSec * 0.6);

      // Sarcastic "Wah-Wah-Wah-Waaaaah" Sad Horn Slide
      if (currentStep % 2 === 0) {
        const hornIdx = Math.floor(currentStep / 2) % 4;
        const startFreq = sadHornNotes[hornIdx];
        const hornOsc = this.ctx.createOscillator();
        const hornGain = this.ctx.createGain();
        const hornFilter = this.ctx.createBiquadFilter();

        hornOsc.type = 'sawtooth';
        hornOsc.frequency.setValueAtTime(startFreq, now);
        // Pitch bend down for classic sad trombone effect
        hornOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.94, now + beatSec * 0.8);

        // "Wah" filter envelope
        hornFilter.type = 'lowpass';
        hornFilter.Q.setValueAtTime(4.0, now);
        hornFilter.frequency.setValueAtTime(250, now);
        hornFilter.frequency.exponentialRampToValueAtTime(1100, now + beatSec * 0.3);
        hornFilter.frequency.exponentialRampToValueAtTime(300, now + beatSec * 0.8);

        hornGain.gain.setValueAtTime(0.001, now);
        hornGain.gain.linearRampToValueAtTime(0.16, now + 0.08);
        hornGain.gain.exponentialRampToValueAtTime(0.001, now + beatSec * 0.8);

        hornOsc.connect(hornFilter);
        hornFilter.connect(hornGain);
        hornGain.connect(this.ctx.destination);
        hornOsc.start(now);
        hornOsc.stop(now + beatSec * 0.8);
      }

      currentStep++;
      this.currentFunkTimeout = window.setTimeout(playDisappointedStep, (beatSec / 2) * 1000);
    };

    playDisappointedStep();
  }

  // Crowd saying "AWWWWWW" sound for when Small or Tall hits but player has NO bets on ATS
  public playCrowdSigh() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 2.4;

    // Multi-voice pitches simulating a mixed crowd saying "Awwww" (male & female voices)
    const crowdVoices = [
      { basePitch: 120, detune: -8, vol: 0.08 },
      { basePitch: 138, detune: 5, vol: 0.08 },
      { basePitch: 165, detune: -12, vol: 0.07 },
      { basePitch: 196, detune: 7, vol: 0.07 },
      { basePitch: 235, detune: -5, vol: 0.06 },
      { basePitch: 275, detune: 10, vol: 0.05 },
    ];

    // Formant 1 (F1: ~750Hz -> 480Hz) for "Ah" -> "Aw/Oh" transition
    // Formant 2 (F2: ~1150Hz -> 800Hz)
    crowdVoices.forEach((voice) => {
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const voiceGain = this.ctx.createGain();

      // Formant filters for realistic vocal tract resonant peaks
      const f1 = this.ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.Q.setValueAtTime(3.5, now);
      f1.frequency.setValueAtTime(780, now);
      f1.frequency.exponentialRampToValueAtTime(460, now + duration * 0.85);

      const f2 = this.ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.Q.setValueAtTime(4.0, now);
      f2.frequency.setValueAtTime(1180, now);
      f2.frequency.exponentialRampToValueAtTime(750, now + duration * 0.85);

      // Warm rich saw/triangle voice tone
      osc.type = 'sawtooth';
      const startPitch = voice.basePitch * Math.pow(2, voice.detune / 1200);
      osc.frequency.setValueAtTime(startPitch, now);
      // Gentle disappointed inflection curve: steady then sliding down
      osc.frequency.setValueAtTime(startPitch * 1.02, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(startPitch * 0.72, now + duration * 0.9);

      // Vocal envelope: swell attack -> sustained "aww" -> smooth fade out
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(voice.vol, now + 0.18);
      voiceGain.gain.setValueAtTime(voice.vol, now + duration * 0.5);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(f1);
      osc.connect(f2);
      f1.connect(voiceGain);
      f2.connect(voiceGain);
      voiceGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });

    // Breath/Air noise component for realistic group vocal resonance
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.Q.setValueAtTime(2.0, now);
    noiseFilter.frequency.setValueAtTime(850, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(500, now + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  public stopFunkJam() {
    if (this.currentFunkTimeout !== null) {
      clearTimeout(this.currentFunkTimeout);
      this.currentFunkTimeout = null;
    }
    if (this.atsBufferSource) {
      try {
        this.atsBufferSource.stop();
        this.atsBufferSource.disconnect();
      } catch (e) {
        // ignore
      }
      this.atsBufferSource = null;
    }
    if (this.currentAtsAudio) {
      try {
        this.currentAtsAudio.pause();
        this.currentAtsAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAtsAudio = null;
    }
  }

  // 7. Family Feud / Game Show "X" Wrong Answer Buzzer for illegal Come bet on comeout roll
  public playRejectComeVoice() {
    this.playBuzzer();
  }

  public playBuzzer() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.55;

    // Dual detuned square/sawtooth oscillators for classic harsh game-show buzzer sound
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'sawtooth';

    // Low dissonant fundamental frequencies (classic Family Feud wrong answer buzz)
    osc1.frequency.setValueAtTime(135, now);
    osc2.frequency.setValueAtTime(143, now); // ~8Hz beating frequency for harsh buzz
    osc3.frequency.setValueAtTime(270, now); // Octave accent

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);

    // Envelope: quick attack, solid sustain, sharp cutoff
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.015);
    gain.gain.setValueAtTime(0.25, now + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    osc3.stop(now + duration);
  }

  // Helper to synthesize a Seinfeld-style slap bass note (bright, popping, crisp, zero dull thuds)
  private playSlapBassNote(freq: number, startTime: number, duration: number, isPop: boolean = true) {
    if (!this.ctx) return;

    const now = startTime;

    // 1. Primary Slap String Oscillator: Sawtooth provides the metallic funk bass bite
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';

    // Quick initial pitch bend to emulate string fret-slap twang
    osc.frequency.setValueAtTime(freq * 1.15, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.025);

    // 2. Harmonic Resonant Layer (Sawtooth 1 octave higher for bright pluck texture)
    const harmOsc = this.ctx.createOscillator();
    harmOsc.type = 'sawtooth';
    harmOsc.frequency.setValueAtTime(freq * 2, now);

    // 3. Bright Resonant Lowpass Filter Sweep (Always high cut-off to guarantee clear bright pops)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(6.0, now); // High resonance for signature funky "pop/wah"

    const startFilter = Math.max(freq * 14, 4500);
    const endFilter = Math.max(freq * 3.5, 1400); // Keep filter open so note stays bright and clear

    filter.frequency.setValueAtTime(startFilter, now);
    filter.frequency.exponentialRampToValueAtTime(endFilter, now + Math.min(duration * 0.65, 0.12));

    // 4. Clean Master Gain Envelope (Zero clipping, instant attack, smooth exponential decay)
    const gain = this.ctx.createGain();
    const peakGain = 0.28;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    harmOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    harmOsc.start(now);
    osc.stop(now + duration + 0.02);
    harmOsc.stop(now + duration + 0.02);

    // 5. Perceptual High Slap/Pop Attack Transient (Crisp metallic finger-pop snap)
    const popOsc = this.ctx.createOscillator();
    const popFilter = this.ctx.createBiquadFilter();
    const popGain = this.ctx.createGain();

    popOsc.type = 'square';
    popOsc.frequency.setValueAtTime(2200, now);
    popOsc.frequency.exponentialRampToValueAtTime(250, now + 0.02);

    popFilter.type = 'bandpass';
    popFilter.frequency.setValueAtTime(3200, now);
    popFilter.Q.setValueAtTime(3.0, now);

    popGain.gain.setValueAtTime(0.0001, now);
    popGain.gain.linearRampToValueAtTime(0.20, now + 0.001);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    popOsc.connect(popFilter);
    popFilter.connect(popGain);
    popGain.connect(this.ctx.destination);

    popOsc.start(now);
    popOsc.stop(now + 0.025);
  }

  // 8. Place chip on ATS ALL box: 3 alternating Seinfeld-style slap-bass lines
  public playAllPlacedVoice() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + 0.01;
    const idx = this.allPlacedIndex;
    this.allPlacedIndex = (this.allPlacedIndex + 1) % 3;

    if (idx === 0) {
      // Seinfeld Riff 1: Classic Bounce (E3 -> E4 -> G4 -> Bb4 -> E3)
      this.playSlapBassNote(164.81, now, 0.18, true);
      this.playSlapBassNote(329.63, now + 0.09, 0.18, true);
      this.playSlapBassNote(392.00, now + 0.20, 0.18, true);
      this.playSlapBassNote(466.16, now + 0.31, 0.20, true);
      this.playSlapBassNote(164.81, now + 0.44, 0.22, true);
    } else if (idx === 1) {
      // Seinfeld Riff 2: Funky Walk-up (A3 -> C4 -> D4 -> Eb4 -> E4 -> A3)
      this.playSlapBassNote(220.00, now, 0.16, true);
      this.playSlapBassNote(261.63, now + 0.09, 0.16, true);
      this.playSlapBassNote(293.66, now + 0.18, 0.16, true);
      this.playSlapBassNote(311.13, now + 0.26, 0.16, true);
      this.playSlapBassNote(329.63, now + 0.33, 0.18, true);
      this.playSlapBassNote(220.00, now + 0.44, 0.22, true);
    } else {
      // Seinfeld Riff 3: High Octave Pop Fill (E3 -> G4 -> E5 -> D5 -> B4 -> E3)
      this.playSlapBassNote(164.81, now, 0.18, true);
      this.playSlapBassNote(392.00, now + 0.10, 0.16, true);
      this.playSlapBassNote(659.25, now + 0.19, 0.18, true);
      this.playSlapBassNote(587.33, now + 0.29, 0.16, true);
      this.playSlapBassNote(493.88, now + 0.38, 0.16, true);
      this.playSlapBassNote(164.81, now + 0.48, 0.22, true);
    }
  }

  // 9. Place chip on Hops Matrix: Slap bass note ascending cleanly from low to high across all 21 hop pairs
  public playHopSlapSound(d1: number, d2: number) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const minD = Math.min(d1, d2);
    const maxD = Math.max(d1, d2);

    // All 21 unique dice pair combinations ordered logically from lowest sum to highest sum
    const hopPairs: [number, number][] = [
      [1, 1], // Sum 2 (Hard 2)
      [1, 2], // Sum 3
      [1, 3], // Sum 4
      [2, 2], // Sum 4 (Hard 4)
      [1, 4], // Sum 5
      [2, 3], // Sum 5
      [1, 5], // Sum 6
      [2, 4], // Sum 6
      [3, 3], // Sum 6 (Hard 6)
      [1, 6], // Sum 7 (1-6)
      [2, 5], // Sum 7 (2-5)
      [3, 4], // Sum 7 (3-4)
      [2, 6], // Sum 8
      [3, 5], // Sum 8
      [4, 4], // Sum 8 (Hard 8)
      [3, 6], // Sum 9
      [4, 5], // Sum 9
      [4, 6], // Sum 10
      [5, 5], // Sum 10 (Hard 10)
      [5, 6], // Sum 11 (Yo 11)
      [6, 6]  // Sum 12 (Hard 12)
    ];

    // Dedicated 21-note bright, snappy chromatic funk slap-pop bass scale (C3 = 130.81Hz up to Ab4 = 415.30Hz)
    const hopNotes: Array<{ freq: number; isPop: boolean }> = [
      { freq: 130.81, isPop: true }, // [1,1] C3 - Bright slap pop
      { freq: 138.59, isPop: true }, // [1,2] C#3
      { freq: 146.83, isPop: true }, // [1,3] D3
      { freq: 155.56, isPop: true }, // [2,2] Eb3 (Hard 4)
      { freq: 164.81, isPop: true }, // [1,4] E3
      { freq: 174.61, isPop: true }, // [2,3] F3
      { freq: 185.00, isPop: true }, // [1,5] F#3
      { freq: 196.00, isPop: true }, // [2,4] G3
      { freq: 207.65, isPop: true }, // [3,3] Ab3 (Hard 6)
      { freq: 220.00, isPop: true }, // [1,6] A3 (Hop 7: 1-6)
      { freq: 233.08, isPop: true }, // [2,5] Bb3 (Hop 7: 2-5)
      { freq: 246.94, isPop: true }, // [3,4] B3 (Hop 7: 3-4)
      { freq: 261.63, isPop: true }, // [2,6] C4
      { freq: 277.18, isPop: true }, // [3,5] C#4
      { freq: 293.66, isPop: true }, // [4,4] D4 (Hard 8)
      { freq: 311.13, isPop: true }, // [3,6] Eb4
      { freq: 329.63, isPop: true }, // [4,5] E4
      { freq: 349.23, isPop: true }, // [4,6] F4
      { freq: 369.99, isPop: true }, // [5,5] F#4 (Hard 10)
      { freq: 392.00, isPop: true }, // [5,6] G4 (Yo 11)
      { freq: 415.30, isPop: true }, // [6,6] Ab4 (Hard 12) - High snapping pop
    ];

    let index = hopPairs.findIndex(([a, b]) => a === minD && b === maxD);
    if (index < 0) index = 0;

    const note = hopNotes[index] || { freq: 130.81, isPop: true };
    const now = this.ctx.currentTime + 0.01;
    this.playSlapBassNote(note.freq, now, 0.22, note.isPop);
  }

  // 10. Sustained Miami Bass Boom for Hard 4
  public playKickBoom() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub 808-style sine wave with fast pitch drop into sustained sub frequency (38Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    const subFilter = this.ctx.createBiquadFilter();

    subOsc.type = 'sine';
    // Initial punch pitch sweep from 160Hz down to 38Hz in 80ms, then sustained sub pitch
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.08);

    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(240, now);

    // Deep sustained Miami bass gain envelope (~1.0s long boom)
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.65, now + 0.006);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 1.10);

    // Second harmonic layer (triangle wave) for analog saturation rumble weight
    const harmOsc = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harmOsc.type = 'triangle';
    harmOsc.frequency.setValueAtTime(320, now);
    harmOsc.frequency.exponentialRampToValueAtTime(76, now + 0.08);

    harmGain.gain.setValueAtTime(0.0001, now);
    harmGain.gain.linearRampToValueAtTime(0.25, now + 0.006);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    harmOsc.connect(subFilter);
    harmOsc.connect(harmGain);
    harmGain.connect(this.ctx.destination);

    harmOsc.start(now);
    harmOsc.stop(now + 0.90);

    // Punchy top kick transient
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(90, now + 0.02);

    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.linearRampToValueAtTime(0.30, now + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.025);
  }

  // 11. Good Acoustic Snare Hit for Hard 6
  public playSnare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Tonal Body (Drumshell resonance)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(210, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(120, now + 0.07);

    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.linearRampToValueAtTime(0.35, now + 0.002);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.14);

    // 2. Snare Wires Noise (Crisp snappy crack)
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.30, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.20);
  }

  // 12. Closed Hi-Hat Hit for Hard 8
  public playClosedHiHat() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Metallic square oscillator cluster + filtered noise for crisp "chick"
    const freqs = [4150, 5870, 7100, 8400];
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.20, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, now);

    filter.connect(gain);
    gain.connect(this.ctx.destination);

    freqs.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + 0.07);
    });

    // High frequency noise layer
    const bufferSize = this.ctx.sampleRate * 0.07;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(8500, now);

    noise.connect(noiseFilter);
    noiseFilter.connect(gain);
    noise.start(now);
    noise.stop(now + 0.07);
  }

  // 13. Nice Sounding Cymbal Crash/Wash for Hard 10
  public playCymbal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Metallic tone ring (inharmonic square wave cluster)
    const freqs = [3200, 4850, 6120, 7540, 9150];
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(0.25, now + 0.004);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.70);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(4500, now);

    highpass.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    freqs.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(highpass);
      osc.start(now);
      osc.stop(now + 0.72);
    });

    // Shimmering noise wash
    const bufferSize = this.ctx.sampleRate * 0.75;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(5500, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.22, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.75);
  }

  // 14. Play distinct acoustic drum sound for each All-Day Hardway bet
  public playHardwayDrumSound(type: string) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    if (type === 'HARD_4') {
      this.playKickBoom();
    } else if (type === 'HARD_6') {
      this.playSnare();
    } else if (type === 'HARD_8') {
      this.playClosedHiHat();
    } else if (type === 'HARD_10') {
      this.playCymbal();
    } else {
      this.playChip();
    }
  }

  // 15. Low-pitched computer beep-boop sound for Any 7 bet
  public playAny7Sound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Beep 1: 340Hz (lower pitch beep)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter1 = this.ctx.createBiquadFilter();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(340, now);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(1400, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.22, now + 0.003);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.08);

    // Boop 2: 220Hz (even lower pitch boop)
    const t2 = now + 0.085;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    const filter2 = this.ctx.createBiquadFilter();

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(220, t2);

    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(1100, t2);

    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.linearRampToValueAtTime(0.25, t2 + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.12);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(t2);
    osc2.stop(t2 + 0.13);
  }

  // 16. Higher-pitched rapid "compute" beep-boop sound for Any Craps bet
  public playAnyCrapsSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Rapid 3-tone retro sci-fi computing sequence (1050Hz -> 1480Hz -> 1850Hz)
    const tones = [
      { freq: 1050, start: now, duration: 0.045, gainVal: 0.18 },
      { freq: 1480, start: now + 0.045, duration: 0.045, gainVal: 0.20 },
      { freq: 1850, start: now + 0.09, duration: 0.08, gainVal: 0.22 },
    ];

    tones.forEach(({ freq, start, duration, gainVal }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, start);
      filter.Q.setValueAtTime(3.0, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(gainVal, start + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.01);
    });
  }
}

let instance: SoundManager;
if (typeof window !== 'undefined') {
  const globalObj = window as unknown as Record<string, unknown>;
  if (!globalObj.__CRAPS_SOUND_MANAGER__) {
    globalObj.__CRAPS_SOUND_MANAGER__ = new SoundManager();
  }
  instance = globalObj.__CRAPS_SOUND_MANAGER__ as SoundManager;
} else {
  instance = new SoundManager();
}

export const soundManager = instance;

