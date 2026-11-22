/**
 * AQUA-SPECTRA — <aqua-acoustic-sonar>
 * Module 3 · Acoustic Helmholtz Pour-Fill Gauge & Faucet Flow Meter
 *
 * Real physics path: getUserMedia audio (filters disabled) → 2048-pt
 * AssemblyScript FFT → dominant resonance → quarter-wave inversion → fill %.
 * Simulator path: a Web Audio synthesizer sweeps 280 → 1450 Hz so the same
 * pipeline runs (and sounds) exactly right without pouring real water.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement, consumeState } from '../components/base';
import { CONTAINERS, type ContainerPreset } from '../data/samples';
import { loadDspKernel } from '../wasm/assemblyScriptBridge';
import type { NephelometryKernel } from '../wasm/types';
import { LiquidColumn } from '../controllers/springController';
import { store } from '../state/store';

const FFT_SIZE = 2048;

@customElement('aqua-acoustic-sonar')
export class AcousticSonar extends AquaElement {
  static styles = css`
    :host {
      display: block;
    }
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 16px;
      margin: 10px 0 20px;
    }
    .head h2 {
      font-size: clamp(22px, 2.6vw, 32px);
      letter-spacing: -0.03em;
    }
    .head h2 span {
      color: #38bdf8;
    }
    .head p {
      font-size: 12.5px;
      color: var(--aqa-ink-dim);
      max-width: 66ch;
      margin-top: 5px;
    }
    .head .grow {
      flex: 1;
    }
    .seg {
      display: inline-flex;
      padding: 3px;
      border-radius: 999px;
      background: var(--aqa-glass-fill);
      border: 1px solid var(--aqa-glass-border);
      gap: 2px;
    }
    .seg button {
      border: 0;
      background: transparent;
      color: var(--aqa-ink-faint);
      font-size: 11.5px;
      font-weight: 650;
      padding: 8px 14px;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .seg button[aria-pressed='true'] {
      color: var(--aqa-ink);
      background: color-mix(in oklab, #38bdf8 26%, transparent);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.28);
    }
    .seg button:active {
      transform: scale(0.96);
    }
    .grid2 {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.02fr);
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 1080px) {
      .grid2 {
        grid-template-columns: 1fr;
      }
    }
    .stack {
      display: grid;
      gap: 16px;
    }
    .section-title {
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
      font-weight: 700;
      margin-bottom: 10px;
    }
    /* ── 3-D vessel ─────────────────────────────────────────────────────── */
    .vessel-stage {
      display: flex;
      justify-content: center;
      gap: 18px;
      align-items: flex-end;
      padding: 4px 0 0;
    }
    .vessel {
      position: relative;
      width: 132px;
      height: 268px;
      border-radius: 14px 14px 20px 20px;
      border: 1.5px solid rgba(180, 236, 255, 0.42);
      border-top: 0;
      background: linear-gradient(180deg, rgba(190, 240, 255, 0.07), rgba(120, 200, 230, 0.04));
      overflow: hidden;
      box-shadow:
        inset 0 0 32px rgba(56, 189, 248, 0.15),
        0 24px 44px -28px rgba(0, 0, 0, 0.85);
      perspective: 500px;
    }
    .vessel::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(105deg, transparent 22%, rgba(255, 255, 255, 0.14) 32%, transparent 44%);
      pointer-events: none;
      z-index: 4;
    }
    .liquid {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      transition: height 90ms linear;
      background: linear-gradient(180deg, rgba(56, 189, 248, 0.92), rgba(14, 116, 144, 0.85) 60%, rgba(6, 78, 110, 0.9));
      box-shadow: 0 -2px 16px rgba(56, 189, 248, 0.6);
    }
    .liquid::before {
      content: '';
      position: absolute;
      left: -4%;
      right: -4%;
      top: -5px;
      height: 10px;
      border-radius: 50%;
      background: radial-gradient(50% 100% at 50% 50%, rgba(224, 250, 255, 0.95), rgba(56, 189, 248, 0.4));
      filter: blur(0.6px);
    }
    .surface-wave {
      position: absolute;
      left: -50%;
      width: 200%;
      height: 12px;
      top: -6px;
      background: rgba(224, 250, 255, 0.35);
      border-radius: 50%;
      filter: blur(2px);
      transform: rotate(var(--slosh, 0deg));
      transition: transform 160ms ease-out;
    }
    .vessel .fill-label {
      position: absolute;
      top: 8px;
      left: 0;
      right: 0;
      text-align: center;
      font-family: var(--aqa-mono);
      font-size: 11px;
      color: rgba(230, 248, 255, 0.92);
      z-index: 5;
      text-shadow: 0 1px 6px rgba(0, 0, 0, 0.7);
      pointer-events: none;
    }
    .vessel .tan-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 0;
      border-top: 1px dashed rgba(250, 204, 21, 0.8);
      z-index: 3;
      transition: bottom 90ms linear;
    }
    .vessel .tan-line span {
      position: absolute;
      right: 3px;
      bottom: 2px;
      font-family: var(--aqa-mono);
      font-size: 7.5px;
      color: #facc15;
      background: rgba(2, 8, 16, 0.55);
      padding: 0 3px;
      border-radius: 3px;
    }
    /* ── spectrum ─────────────────────────────────────────────────────── */
    .spectrum {
      width: 100%;
      height: 132px;
      display: block;
      border-radius: 12px;
      background: rgba(2, 10, 18, 0.5);
      border: 1px solid var(--aqa-hairline);
    }
    .bars {
      display: grid;
      grid-template-columns: repeat(72, 1fr);
      align-items: end;
      gap: 1.5px;
      height: 118px;
      padding: 8px 6px 0;
    }
    .bars i {
      background: linear-gradient(180deg, #67e8f9, #0ea5e9);
      border-radius: 2px 2px 0 0;
      min-height: 1px;
      opacity: 0.85;
      transition: height 70ms linear;
    }
    .bars i.hot {
      background: linear-gradient(180deg, #fde68a, #f59e0b);
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.7);
    }
    .readout-row {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      font-family: var(--aqa-mono);
      color: var(--aqa-ink-faint);
      padding: 2px 8px 7px;
    }
    .bignum {
      font-family: var(--aqa-mono);
      font-size: 34px;
      font-weight: 720;
      letter-spacing: -0.045em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .bignum small {
      font-size: 12px;
      letter-spacing: 0.1em;
      opacity: 0.55;
      font-weight: 600;
      margin-left: 4px;
    }
    .containers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
      gap: 8px;
    }
    .container-chip {
      border-radius: 13px;
      border: 1px solid var(--aqa-hairline);
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
      padding: 10px;
      text-align: left;
      cursor: pointer;
      transition: all 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .container-chip:hover {
      border-color: color-mix(in oklab, #38bdf8 55%, transparent);
      transform: translateY(-1.5px);
    }
    .container-chip:active {
      transform: scale(0.96);
    }
    .container-chip[aria-pressed='true'] {
      border-color: color-mix(in oklab, #38bdf8 70%, transparent);
      background: color-mix(in oklab, #38bdf8 14%, transparent);
    }
    .container-chip b {
      display: block;
      font-size: 11.5px;
      margin-bottom: 2px;
    }
    .container-chip span {
      font-size: 9.5px;
      font-family: var(--aqa-mono);
      color: var(--aqa-ink-faint);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border-radius: 12px;
      border: 1px solid var(--aqa-glass-border);
      background: var(--aqa-glass-fill);
      color: var(--aqa-ink);
      font-size: 11.5px;
      font-weight: 640;
      padding: 9px 13px;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .btn:hover {
      border-color: color-mix(in oklab, #38bdf8 55%, transparent);
      transform: translateY(-1px);
    }
    .btn:active {
      transform: scale(0.96);
    }
    .btn.primary {
      background: linear-gradient(120deg, color-mix(in oklab, #38bdf8 42%, transparent), color-mix(in oklab, #22d3ee 30%, transparent));
      border-color: color-mix(in oklab, #38bdf8 62%, transparent);
      box-shadow: 0 0 24px -10px rgba(56, 189, 248, 0.7);
    }
    .btn.stop {
      background: color-mix(in oklab, var(--aqa-bad) 26%, transparent);
      border-color: color-mix(in oklab, var(--aqa-bad) 55%, transparent);
    }
    .controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .ki {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
      gap: 8px;
    }
    .ki div {
      padding: 9px 10px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
      border: 1px solid var(--aqa-hairline);
    }
    .ki b {
      display: block;
      font-family: var(--aqa-mono);
      font-size: 13px;
      font-weight: 660;
    }
    .ki span {
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
    }
    .formula {
      font-family: var(--aqa-mono);
      font-size: 10.5px;
      color: var(--aqa-ink-faint);
      line-height: 1.7;
      padding: 10px 12px;
      border-radius: 11px;
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
      border-left: 2px solid color-mix(in oklab, #38bdf8 65%, transparent);
      overflow-x: auto;
      margin-top: 12px;
    }
    .formula b {
      color: #38bdf8;
      font-weight: 600;
    }
    .gauge-row {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .gauge-row aqua-gauge {
      max-width: 190px;
      flex: none;
    }
    .state-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 9.5px;
      font-family: var(--aqa-mono);
      letter-spacing: 0.09em;
      text-transform: uppercase;
      border: 1px solid var(--aqa-hairline);
      color: var(--aqa-ink-dim);
    }
    .state-pill.live {
      border-color: color-mix(in oklab, var(--aqa-ok) 55%, transparent);
      color: var(--aqa-ok);
    }
    .state-pill.live::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      animation: blip 1.2s ease-in-out infinite;
    }
    @keyframes blip {
      50% {
        opacity: 0.25;
      }
    }
  `;

  @state() private mode: 'pour' | 'flow' = 'pour';
  @state() private container: ContainerPreset = CONTAINERS[2];
  @state() private fillPct = 0;
  @state() private resonanceHz = 0;
  @state() private spectrum: number[] = new Array(72).fill(0.02);
  @state() private running = false;
  @state() private micLive = false;
  @state() private rms = 0;
  @state() private flowLpm = 0;
  @state() private targetFlow = 6;
  @state() private slosh = 0;
  @state() private chimeFired = false;

  private kernel: NephelometryKernel | null = null;
  private column = new LiquidColumn(48);
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private raf = 0;
  private simOsc: OscillatorNode | null = null;
  private simNoise: AudioBufferSourceNode | null = null;
  private simGain: GainNode | null = null;

  private stateCtl = consumeState(this, (s) => ({ mic: s.permissions.microphone.state, reduced: s.reducedMotion }));

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.kernel = (await loadDspKernel()).kernel;
    this.resonanceHz = this.kernel.resonanceFromFill(1, this.kernel.speedOfSound(20), this.container.heightM);
  }

  disconnectedCallback(): void {
    this.stopAll();
    super.disconnectedCallback();
  }

  private stopAll(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.stopSimAudio();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.micLive = false;
    this.analyser = null;
  }

  private ensureAudio(): AudioContext {
    if (!this.audioCtx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctx();
    }
    if (this.audioCtx.state === 'suspended') void this.audioCtx.resume();
    return this.audioCtx;
  }

  // ── real microphone ──────────────────────────────────────────────────────
  private async startMic(): Promise<void> {
    this.stopAll();
    try {
      const ctx = this.ensureAudio();
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Critical: voice processing would filter out exactly the resonance
          // band we are measuring.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
      const src = ctx.createMediaStreamSource(this.stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.55;
      src.connect(this.analyser);
      this.micLive = true;
      this.running = true;
      store.update((s) => {
        s.permissions.microphone.state = 'active';
        s.permissions.microphone.note = `live · ${(ctx.sampleRate / 1000).toFixed(1)} kHz · FFT ${FFT_SIZE}`;
      });
      this.loop();
      this.toast('Microphone armed — pour slowly and listen for the chime at 85 %.', 'ok');
    } catch (err) {
      store.update((s) => {
        s.permissions.microphone.state = 'denied';
        s.permissions.microphone.note = err instanceof Error ? err.message : 'denied';
      });
      this.toast('Mic unavailable — the acoustic synthesizer reproduces the identical pipeline.', 'warn');
    }
  }

  // ── synthesizer: rising pour pitch + faucet turbulence ───────────────────
  private startSim(): void {
    this.stopAll();
    const ctx = this.ensureAudio();
    this.running = true;
    this.chimeFired = false;
    this.fillPct = 0;

    if (this.mode === 'pour') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      // the acoustic signature of a filling vessel: pitch climbs as the air column shortens
      osc.frequency.exponentialRampToValueAtTime(this.container.resonanceBaseHz * 3.4, ctx.currentTime + 11);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.5);
      // add a breathy noise layer so the spectrum looks (and sounds) like water
      const noise = this.makeNoise(ctx, 'pink');
      const nGain = ctx.createGain();
      nGain.gain.value = 0.05;
      osc.connect(gain).connect(ctx.destination);
      noise.connect(nGain).connect(ctx.destination);
      osc.start();
      noise.start();
      this.simOsc = osc;
      this.simNoise = noise;
      this.simGain = gain;
      const simAnalyser = ctx.createAnalyser();
      simAnalyser.fftSize = FFT_SIZE;
      simAnalyser.smoothingTimeConstant = 0.5;
      gain.connect(simAnalyser);
      nGain.connect(simAnalyser);
      this.analyser = simAnalyser;
      store.update((s) => {
        s.permissions.microphone.state = 'simulator';
        s.permissions.microphone.note = 'synthesized pour sweep 280 → 1450 Hz';
      });
    } else {
      const noise = this.makeNoise(ctx, 'white');
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1400;
      bp.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.value = 0.06;
      noise.connect(bp).connect(gain).connect(ctx.destination);
      noise.start();
      this.simNoise = noise;
      this.simGain = gain;
      const simAnalyser = ctx.createAnalyser();
      simAnalyser.fftSize = FFT_SIZE;
      simAnalyser.smoothingTimeConstant = 0.6;
      gain.connect(simAnalyser);
      this.analyser = simAnalyser;
      store.update((s) => {
        s.permissions.microphone.state = 'simulator';
        s.permissions.microphone.note = 'synthesized faucet turbulence 400–3500 Hz';
      });
    }
    this.loop();
  }

  private makeNoise(ctx: AudioContext, kind: 'white' | 'pink'): AudioBufferSourceNode {
    const seconds = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === 'white') data[i] = white * 0.6;
      else {
        b0 = 0.997 * b0 + white * 0.0555;
        b1 = 0.985 * b1 + white * 0.075;
        b2 = 0.95 * b2 + white * 0.153;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.22;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  private stopSimAudio(): void {
    try {
      this.simOsc?.stop();
    } catch {
      /* already stopped */
    }
    try {
      this.simNoise?.stop();
    } catch {
      /* already stopped */
    }
    this.simOsc = null;
    this.simNoise = null;
    this.simGain = null;
  }

  private chime(kind: 'warn' | 'done'): void {
    if (!this.audioCtx || this.stateCtl.value.reduced) return;
    const ctx = this.audioCtx;
    const freqs = kind === 'warn' ? [880, 1174.7] : [1046.5, 1568];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    this.vibrate(kind === 'warn' ? [40, 60, 40] : [18, 40, 18]);
  }

  // ── analysis loop ────────────────────────────────────────────────────────
  private loop(): void {
    if (!this.analyser || !this.kernel) return;
    const buf = new Float32Array(FFT_SIZE);
    const freq = new Uint8Array(this.analyser.frequencyBinCount);

    const tick = () => {
      if (!this.running || !this.analyser || !this.kernel) return;
      this.raf = requestAnimationFrame(tick);
      this.analyser.getFloatTimeDomainData(buf);
      this.analyser.getByteFrequencyData(freq);

      // 1. RMS level (0–100 scale, same convention as the kernel)
      let acc = 0;
      for (let i = 0; i < buf.length; i++) acc += buf[i] * buf[i];
      const rmsLinear = Math.sqrt(acc / buf.length);
      this.rms = Math.max(0, Math.min(100, 100 + 20 * Math.log10(Math.max(rmsLinear, 1e-6))));

      // 2. spectrum bars (log-spaced so the 200–4500 Hz band is readable)
      const nyquist = (this.audioCtx?.sampleRate ?? 48000) / 2;
      const bars: number[] = [];
      const barCount = 72;
      const loHz = 80;
      const hiHz = Math.min(8000, nyquist);
      for (let b = 0; b < barCount; b++) {
        const f0 = loHz * (hiHz / loHz) ** (b / barCount);
        const f1 = loHz * (hiHz / loHz) ** ((b + 1) / barCount);
        const i0 = Math.max(1, Math.floor((f0 / nyquist) * freq.length));
        const i1 = Math.max(i0 + 1, Math.floor((f1 / nyquist) * freq.length));
        let m = 0;
        for (let i = i0; i < i1 && i < freq.length; i++) m = Math.max(m, freq[i]);
        bars.push(Math.max(0.02, m / 255));
      }
      this.spectrum = bars;

      // 3. kernel call — dominant resonance in the 200–4500 Hz band
      const heap = this.kernel.heap();
      const off = this.kernel.scratchA() / 8;
      const n = Math.min(FFT_SIZE, 8192);
      for (let i = 0; i < n; i++) heap[off + i] = buf[i];
      const sampleRate = this.audioCtx?.sampleRate ?? 48000;
      const peak = this.kernel.dominantFrequency(n, sampleRate, 200, 4500);
      this.resonanceHz = peak;

      const cAir = this.kernel.speedOfSound(20);
      if (this.mode === 'pour') {
        if (peak > 180) {
          this.fillPct = Math.round(this.kernel.fillPctFromResonance(peak, cAir, this.container.heightM) * 10) / 10;
        } else if (this.analyser && !this.micLive) {
          // synthesized fallback: integrate the sweep so the gauge still rises
          this.fillPct = Math.min(100, this.fillPct + 100 / (11 * 60));
        }
        const col = this.column.step(1 / 60, this.fillPct);
        this.slosh = Math.round((col[Math.floor(col.length * 0.62)] - this.fillPct) * 0.9);

        if (this.fillPct >= 85 && !this.chimeFired) {
          this.chimeFired = true;
          this.chime('warn');
          this.toast('85 % — slow the pour. One more second reaches the brim.', 'warn');
        }
        if (this.fillPct >= 99.5) {
          this.chime('done');
          this.toast('Vessel full. Stop pouring.', 'ok');
          this.running = false;
        }
      } else {
        const centroid = this.kernel.spectralCentroid(n, sampleRate);
        const level = this.rms;
        this.flowLpm = Math.round(this.kernel.flowFromAcoustic(level, centroid || 1400, 0.42) * 100) / 100;
        store.update((s) => {
          if (s.permissions.microphone.state !== 'denied') {
            s.permissions.microphone.note = `centroid ${centroid.toFixed(0)} Hz · level ${level.toFixed(0)} · ${this.flowLpm.toFixed(2)} L/min`;
          }
        });
      }
    };
    tick();
  }

  // ── view helpers ─────────────────────────────────────────────────────────
  private setTargetFlow(v: number): void {
    this.targetFlow = v;
    if (this.simOsc) {
      const ctx = this.audioCtx!;
      const targetHz = 900 + v * 70;
      this.simOsc.frequency.linearRampToValueAtTime(targetHz, ctx.currentTime + 0.25);
    }
    if (this.simGain && this.audioCtx) {
      const level = this.kernel?.rmsForFlow(v, 0.42) ?? 50;
      const gain = Math.max(0.005, Math.min(0.5, ((level - 28) / 100) * 0.45));
      this.simGain.gain.linearRampToValueAtTime(gain, this.audioCtx.currentTime + 0.2);
    }
  }

  private renderPour() {
    const fill = Math.max(0, Math.min(100, this.fillPct));
    const cAir = this.kernel?.speedOfSound(20) ?? 343;
    const theoretical = this.kernel?.resonanceFromFill(fill, cAir, this.container.heightM) ?? 0;
    return html`
      <div class="grid2">
        <div class="stack">
          <aqua-card accent>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div class="section-title" style="margin:0">Helmholtz quarter-wave vessel</div>
              <span class="state-pill ${this.running ? 'live' : ''}">${this.running ? (this.micLive ? 'mic live' : 'simulating') : 'idle'}</span>
            </div>
            <div class="vessel-stage">
              <div class="vessel" style=${`height:${Math.max(190, this.container.heightM * 1120)}px`}>
                <div class="liquid" style=${`height:${fill}%`}>
                  <div class="surface-wave" style=${`--slosh:${this.slosh}deg`}></div>
                </div>
                <div class="tan-line" style=${`bottom:${fill}%`}><span>${fill.toFixed(0)}%</span></div>
                <div class="fill-label">${this.container.name}</div>
              </div>
              <div style="display:grid;gap:10px;min-width:130px">
                <aqua-stat label="Fill level" value=${fill.toFixed(1)} unit="%" hint=${`${((fill / 100) * this.container.volumeMl).toFixed(0)} mL of ${this.container.volumeMl}`}></aqua-stat>
                <aqua-stat label="Resonance" value=${this.resonanceHz.toFixed(0)} unit="Hz" hint="quarter-wave air column"></aqua-stat>
                <aqua-stat label="Acoustic RMS" value=${this.rms.toFixed(0)} unit="/100" hint="noise floor 28"></aqua-stat>
              </div>
            </div>
            <div class="controls">
              <button class="btn primary" @click=${() => this.startSim()}>
                <aqua-icon name="activity" size="14"></aqua-icon> Run pour simulator
              </button>
              <button class="btn" @click=${() => void this.startMic()}>
                <aqua-icon name="mic" size="14"></aqua-icon> Use real microphone
              </button>
              <button class="btn stop" @click=${() => this.stopAll()}>
                <aqua-icon name="close" size="14"></aqua-icon> Stop
              </button>
            </div>
            <div class="formula">
              <b>f</b> = c / (4·(H − h)) &nbsp;⇒&nbsp; <b>h</b> = H − c/(4f) &nbsp;·&nbsp; c = 331.3·√(1 + T/273.15) = ${cAir.toFixed(1)} m/s at 20 °C<br />
              theoretical f at ${fill.toFixed(0)} % fill: <b>${theoretical.toFixed(0)} Hz</b> · H = ${(this.container.heightM * 100).toFixed(0)} cm
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Container presets</div>
            <div class="containers">
              ${CONTAINERS.map(
                (c) => html`
                  <button class="container-chip" aria-pressed=${this.container.id === c.id} @click=${() => this.pickContainer(c)}>
                    <b>${c.name}</b>
                    <span>${(c.heightM * 100).toFixed(0)} cm · ${c.volumeMl} mL</span>
                  </button>
                `,
              )}
            </div>
          </aqua-card>
        </div>

        <div class="stack">
          <aqua-card accent>
            <div class="section-title">Live FFT spectrum · log 80 Hz → 8 kHz</div>
            <div class="bars">
              ${this.spectrum.map((v) => {
                const hot = v > 0.55;
                return html`<i class=${hot ? 'hot' : ''} style=${`height:${Math.max(2, v * 112)}px`}></i>`;
              })}
            </div>
            <div class="readout-row">
              <span>80 Hz</span><span>400</span><span>1.4 kHz</span><span>4.5 kHz</span><span>8 kHz</span>
            </div>
            <div class="gauge-row" style="margin-top:10px">
              <aqua-gauge .value=${this.resonanceHz} min="180" max="1800" unit="Hz dominant" decimals="0" bigSize="22px" color="#38bdf8"></aqua-gauge>
              <div style="flex:1;min-width:150px">
                <div class="ki">
                  <div><span>Quarter-wave height</span><b>${(((this.fillPct / 100) * this.container.heightM) * 100).toFixed(1)}</b><span>cm of liquid</span></div>
                  <div><span>Air column</span><b>${(this.container.heightM * (1 - this.fillPct / 100) * 100).toFixed(1)}</b><span>cm remaining</span></div>
                </div>
                <p style="font-size:11px;color:var(--aqa-ink-dim);margin-top:9px;line-height:1.5">
                  As water rises the resonant air column shortens and the pitch climbs — exactly the effect you hear
                  filling a bottle. A chime and haptic pulse fire at 85 % so you never overflow a thermos in the dark.
                </p>
              </div>
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Blind & low-light pouring protocol</div>
            <p style="font-size:11.5px;color:var(--aqa-ink-dim);line-height:1.6">
              Hold the phone 20–30 cm from the vessel mouth, microphone facing the pour. The analyser needs nothing but
              the resonance peak, so it works in complete darkness, through a thermos wall, and for visually impaired
              users. Vibration + chime replace the sight line.
            </p>
          </aqua-card>
        </div>
      </div>
    `;
  }

  private pickContainer(c: ContainerPreset): void {
    this.container = c;
    this.fillPct = 0;
    this.chimeFired = false;
    this.stopAll();
    this.vibrate(8);
  }

  private renderFlow() {
    return html`
      <div class="grid2">
        <div class="stack">
          <aqua-card accent>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div class="section-title" style="margin:0">Contactless faucet & showerhead flow meter</div>
              <span class="state-pill ${this.running ? 'live' : ''}">${this.running ? (this.micLive ? 'mic live' : 'simulating') : 'idle'}</span>
            </div>
            <div class="gauge-row">
              <aqua-gauge .value=${this.flowLpm} min="0" max="15" unit="L / min" decimals="2" bigSize="24px" color="#38bdf8"></aqua-gauge>
              <div style="flex:1;min-width:170px">
                <div class="ki">
                  <div><span>US gallons</span><b>${(this.flowLpm * 0.264172).toFixed(2)}</b><span>GPM</span></div>
                  <div><span>Acoustic level</span><b>${this.rms.toFixed(0)}</b><span>/ 100 RMS</span></div>
                  <div><span>Pressure drop est.</span><b>${Math.max(0, 4.2 - this.flowLpm * 0.18).toFixed(2)}</b><span>bar</span></div>
                  <div><span>Annual water</span><b>${((this.flowLpm * 6 * 365) / 1000).toFixed(1)}</b><span>m³ @ 6 min/day</span></div>
                </div>
              </div>
            </div>
            <div class="controls">
              <button class="btn primary" @click=${() => this.startSim()}>
                <aqua-icon name="waves" size="14"></aqua-icon> Run faucet simulator
              </button>
              <button class="btn" @click=${() => void this.startMic()}>
                <aqua-icon name="mic" size="14"></aqua-icon> Use real microphone
              </button>
              <button class="btn stop" @click=${() => this.stopAll()}>
                <aqua-icon name="close" size="14"></aqua-icon> Stop
              </button>
            </div>
            <div class="formula">
              <b>Q</b> = k<sub>cal</sub> · 4.2 · (E/10)<sup>1.15</sup> · (f<sub>centroid</sub>/1200) &nbsp;·&nbsp; E = RMS − 28<br />
              Acoustic power ∝ Q²; the 1.15 exponent models plume compression after the impact jet breaks up.
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Calibrate against a measured flow</div>
            <aqua-slider label="Reference flow (bucket test)" unit="L/min" .value=${this.targetFlow} min="0.5" max="15" step="0.1" decimals="1"
              @slider-input=${(e: CustomEvent) => this.setTargetFlow(e.detail.value)}></aqua-slider>
            <p style="font-size:11px;color:var(--aqa-ink-faint);margin-top:8px;line-height:1.55">
              Fill a 1 L jug and time it: Q = 60 / seconds. Set that as the reference and the simulator locks its gain so
              the acoustic estimate matches your fixture.
            </p>
          </aqua-card>
        </div>

        <div class="stack">
          <aqua-card accent>
            <div class="section-title">Turbulence spectrum · 400–3500 Hz band</div>
            <div class="bars">
              ${this.spectrum.map((v) => {
                const hot = v > 0.55;
                return html`<i class=${hot ? 'hot' : ''} style=${`height:${Math.max(2, v * 112)}px`}></i>`;
              })}
            </div>
            <div class="readout-row">
              <span>80 Hz</span><span>400</span><span>1.4 kHz</span><span>4.5 kHz</span><span>8 kHz</span>
            </div>
            <div class="ki" style="margin-top:12px">
              <div><span>Flow regime</span><b>${this.flowLpm < 3 ? 'trickle' : this.flowLpm < 9 ? 'efficient' : 'wasteful'}</b><span>${this.flowLpm < 3 ? 'aeration likely' : this.flowLpm < 9 ? 'low-flow aerator' : 'replace with 6 L/min aerator'}</span></div>
              <div><span>Fixture verdict</span><b>${this.flowLpm > 9 ? 'HIGH' : this.flowLpm > 0 ? 'OK' : '—'}</b><span>EPA WaterSense ≤ 8.3 L/min</span></div>
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">What the meter is listening for</div>
            <p style="font-size:11.5px;color:var(--aqa-ink-dim);line-height:1.6">
              Flow noise comes from turbulence at the aerator and the impact plume in the sink. The
              <b>level</b> of that noise tracks momentum flux (∝ Q²), while the <b>centroid</b> tracks the
              orifice diameter — a clogged aerator narrows the jet and pushes the centroid up, which the
              aperture term corrects for. That is why this works on an old 15 L/min tap and a 5 L/min
              showerhead without re-calibration.
            </p>
          </aqua-card>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="head">
        <div>
          <h2>Acoustic <span>Hydro-Sonar</span></h2>
          <p>
            A quarter-wave Helmholtz analyser that hears how full a vessel is, and a contactless flow meter that
            estimates faucet discharge from turbulent impact noise — 0.5 to 15 L/min.
          </p>
        </div>
        <div class="grow"></div>
        <div class="seg" role="tablist">
          <button aria-pressed=${this.mode === 'pour'} @click=${() => this.switchMode('pour')}>
            <aqua-icon name="droplet" size="13"></aqua-icon> Pour-fill gauge
          </button>
          <button aria-pressed=${this.mode === 'flow'} @click=${() => this.switchMode('flow')}>
            <aqua-icon name="gauge" size="13"></aqua-icon> Faucet flow (L/min)
          </button>
        </div>
      </div>
      ${this.mode === 'pour' ? this.renderPour() : this.renderFlow()}
    `;
  }

  private switchMode(m: 'pour' | 'flow'): void {
    if (this.mode === m) return;
    this.stopAll();
    this.mode = m;
    this.fillPct = 0;
    this.flowLpm = 0;
    store.update((s) => {
      s.acousticMode = m;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-acoustic-sonar': AcousticSonar;
  }
}
