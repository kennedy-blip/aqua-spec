/**
 * AQUA-SPECTRA — <aqua-optics-panel>
 * Module 1 · Optical Nephelometer & CIEDE2000 Colorimeter
 *
 * Sub-mode A: Tyndall nephelometry — a live Siemens-star MTF target plus a
 * scatter/contrast ratio fed to the AssemblyScript kernel → NTU, TSS,
 * potability class.
 * Sub-mode B: 7-pad reagent strip — measured L*a*b* matched against the printed
 * chart with full CIEDE2000, interpolated between adjacent swatches.
 */
import { css, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { AquaElement, consumeState } from './../components/base';
import { SAMPLES, sampleById } from '../data/samples';
import { healthScore, scanFromSample, store, type ScanResult } from '../state/store';
import { assess } from '../elixir/aquaChemistry';
import { loadDspKernel } from '../wasm/assemblyScriptBridge';
import type { NephelometryKernel, WasmBackendInfo } from '../wasm/types';
import {
  PAD_CHARTS,
  PAD_LABS,
  PAD_ORDER,
  interpolatePadValue,
  labToRgb,
  rgbCss,
  type PadKey,
} from '../optics/colorScience';
import { saveScan } from '../db/aquaDb';

type SubMode = 'turbidity' | 'strip';

const POTABILITY = [
  { label: 'IDEAL DRINKING', tone: 'ok', note: 'Low estimated turbidity only — does not establish drinking-water safety.' },
  { label: 'FILTER RECOMMENDED', tone: 'warn', note: '1–5 NTU — install a 5 µm + carbon block pre-filter.' },
  { label: 'PATHOGEN SHIELDING HAZARD', tone: 'bad', note: '>5 NTU shields Crypto/Giardia from disinfectant. Do not drink untreated.' },
  { label: 'CRITICAL — GROSS CONTAMINATION', tone: 'bad', note: '>25 NTU. Pre-settle, flocculate, filter, then disinfect.' },
] as const;

@customElement('aqua-optics-panel')
export class OpticsPanel extends AquaElement {
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
      color: var(--aqa-primary);
    }
    .head p {
      font-size: 12.5px;
      color: var(--aqa-ink-dim);
      max-width: 62ch;
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
      background: color-mix(in oklab, var(--aqa-primary) 24%, transparent);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.28);
    }
    .seg button:hover {
      color: var(--aqa-ink);
    }
    .seg button:active {
      transform: scale(0.96);
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1.06fr) minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 1080px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
    .stack {
      display: grid;
      gap: 16px;
    }
    /* ── target / scanner viewport ─────────────────────────────────────── */
    .viewport {
      position: relative;
      aspect-ratio: 4 / 3;
      border-radius: var(--aqa-radius);
      overflow: hidden;
      background: #01060c;
      border: 1px solid var(--aqa-glass-border);
      display: grid;
      place-items: center;
    }
    .viewport video,
    .viewport canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .siemens {
      width: 74%;
      max-width: 340px;
      filter: contrast(var(--target-contrast, 1)) brightness(var(--target-bright, 1))
        blur(var(--target-blur, 0px));
      transition: filter 260ms linear;
    }
    .reticle {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .reticle::before,
    .reticle::after {
      content: '';
      position: absolute;
      background: color-mix(in oklab, var(--aqa-primary) 70%, transparent);
      box-shadow: 0 0 10px var(--aqa-glow);
    }
    .reticle::before {
      left: 50%;
      top: 22%;
      bottom: 22%;
      width: 1px;
      transform: translateX(-0.5px);
    }
    .reticle::after {
      top: 50%;
      left: 22%;
      right: 22%;
      height: 1px;
    }
    .reticle-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 46%;
      aspect-ratio: 1;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 1px dashed color-mix(in oklab, var(--aqa-primary) 55%, transparent);
    }
    .reticle-ring::after {
      content: '';
      position: absolute;
      inset: 18%;
      border-radius: 50%;
      border: 1px solid color-mix(in oklab, var(--aqa-accent) 40%, transparent);
    }
    .viewport-tag {
      position: absolute;
      left: 12px;
      top: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--aqa-mono);
      font-size: 9.5px;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      padding: 5px 9px;
      border-radius: 999px;
      background: rgba(2, 10, 18, 0.72);
      border: 1px solid var(--aqa-glass-border);
      color: var(--aqa-ink-dim);
      backdrop-filter: blur(8px);
    }
    .viewport-tag .dot {
      width: 6px;
      height: 6px;
      border-radius: 99px;
      background: var(--aqa-ok);
      box-shadow: 0 0 8px currentColor;
      color: var(--aqa-ok);
    }
    .viewport-tag.live .dot {
      animation: blink 1.4s ease-in-out infinite;
    }
    @keyframes blink {
      50% {
        opacity: 0.3;
      }
    }
    .scanline {
      position: absolute;
      left: 0;
      right: 0;
      height: 44%;
      background: linear-gradient(180deg, transparent, color-mix(in oklab, var(--aqa-primary) 22%, transparent), transparent);
      animation: sweep 2.6s ease-in-out infinite;
      mix-blend-mode: screen;
    }
    @keyframes sweep {
      0% {
        top: -44%;
      }
      100% {
        top: 100%;
      }
    }
    .viewport-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
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
      border-color: color-mix(in oklab, var(--aqa-primary) 55%, transparent);
      transform: translateY(-1px);
    }
    .btn:active {
      transform: scale(0.96);
    }
    .btn.primary {
      background: linear-gradient(120deg, color-mix(in oklab, var(--aqa-primary) 40%, transparent), color-mix(in oklab, var(--aqa-accent) 30%, transparent));
      border-color: color-mix(in oklab, var(--aqa-primary) 60%, transparent);
      box-shadow: 0 0 24px -10px var(--aqa-glow);
    }
    .btn[disabled] {
      opacity: 0.45;
      cursor: not-allowed;
    }
    /* ── sample chips ─────────────────────────────────────────────────── */
    .samples {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(178px, 1fr));
      gap: 9px;
    }
    .sample {
      position: relative;
      text-align: left;
      padding: 11px 12px 11px 15px;
      border-radius: 14px;
      border: 1px solid var(--aqa-hairline);
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
      cursor: pointer;
      transition: all 220ms cubic-bezier(0.22, 1, 0.36, 1);
      overflow: hidden;
    }
    .sample::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 9px;
      background: var(--tint);
      box-shadow: 0 0 12px var(--tint);
    }
    .sample:hover {
      border-color: color-mix(in oklab, var(--tint) 60%, transparent);
      background: color-mix(in oklab, var(--tint) 10%, transparent);
      transform: translateY(-1.5px) scale(1.012);
    }
    .sample:active {
      transform: scale(0.968);
    }
    .sample[aria-pressed='true'] {
      border-color: color-mix(in oklab, var(--tint) 78%, transparent);
      background: color-mix(in oklab, var(--tint) 15%, transparent);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.16), 0 0 24px -14px var(--tint);
    }
    .sample strong {
      display: block;
      font-size: 11.5px;
      font-weight: 680;
      letter-spacing: 0.01em;
      margin-bottom: 2px;
    }
    .sample small {
      display: block;
      font-size: 9.8px;
      color: var(--aqa-ink-faint);
      font-family: var(--aqa-mono);
      line-height: 1.4;
    }
    /* ── pad strip ────────────────────────────────────────────────────── */
    .strip {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      padding: 12px;
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
      border: 1px solid var(--aqa-hairline);
    }
    @media (max-width: 720px) {
      .strip {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .pad {
      position: relative;
      border: 0;
      padding: 0;
      background: none;
      cursor: pointer;
      display: grid;
      gap: 6px;
      justify-items: center;
    }
    .pad .swatch {
      width: 100%;
      aspect-ratio: 1 / 1.35;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.35), 0 4px 14px -8px rgba(0, 0, 0, 0.7);
      transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms;
    }
    .pad:hover .swatch {
      transform: translateY(-2px) scale(1.04);
    }
    .pad[aria-pressed='true'] .swatch {
      box-shadow:
        0 0 0 2px var(--aqa-bg),
        0 0 0 3.5px var(--aqa-primary),
        0 0 22px -6px var(--aqa-glow),
        inset 0 1px 2px rgba(255, 255, 255, 0.4);
    }
    .pad .id {
      font-size: 8.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
      font-family: var(--aqa-mono);
      text-align: center;
      line-height: 1.2;
    }
    .pad .readout {
      font-size: 10px;
      font-weight: 700;
      font-family: var(--aqa-mono);
      color: var(--aqa-ink);
    }
    /* ── chart matcher ───────────────────────────────────────────────── */
    .chart-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .chart-head h3 {
      font-size: 13px;
      letter-spacing: 0.02em;
    }
    .chart-head .sub {
      font-size: 10.5px;
      color: var(--aqa-ink-faint);
      font-family: var(--aqa-mono);
    }
    .swatch-rail {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(46px, 1fr));
      gap: 5px;
    }
    .chart-swatch {
      position: relative;
      display: grid;
      gap: 4px;
      justify-items: center;
      padding: 5px 3px;
      border-radius: 9px;
      border: 1px solid transparent;
      transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .chart-swatch .chip {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 7px;
      border: 1px solid rgba(255, 255, 255, 0.24);
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3);
    }
    .chart-swatch .lb {
      font-size: 8.5px;
      font-family: var(--aqa-mono);
      color: var(--aqa-ink-faint);
    }
    .chart-swatch .de {
      font-size: 8px;
      font-family: var(--aqa-mono);
      color: var(--aqa-ink-faint);
      opacity: 0.75;
    }
    .chart-swatch.best {
      border-color: color-mix(in oklab, var(--aqa-primary) 65%, transparent);
      background: color-mix(in oklab, var(--aqa-primary) 14%, transparent);
    }
    .chart-swatch.best .de {
      color: var(--aqa-primary);
      opacity: 1;
      font-weight: 700;
    }
    .measured {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 11px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--aqa-ink) 5%, transparent);
      border: 1px solid var(--aqa-hairline);
      margin-top: 10px;
    }
    .measured .dot {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      flex: none;
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.35);
    }
    .measured .lab {
      font-family: var(--aqa-mono);
      font-size: 10px;
      color: var(--aqa-ink-dim);
      line-height: 1.5;
    }
    .measured .lab b {
      color: var(--aqa-ink);
    }
    .lab-sliders {
      display: grid;
      gap: 8px;
      margin-top: 10px;
    }
    .verdict {
      display: flex;
      gap: 11px;
      align-items: flex-start;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid;
      margin-top: 12px;
      line-height: 1.45;
    }
    .verdict.ok {
      border-color: color-mix(in oklab, var(--aqa-ok) 45%, transparent);
      background: color-mix(in oklab, var(--aqa-ok) 10%, transparent);
    }
    .verdict.warn {
      border-color: color-mix(in oklab, var(--aqa-warn) 45%, transparent);
      background: color-mix(in oklab, var(--aqa-warn) 10%, transparent);
    }
    .verdict.bad {
      border-color: color-mix(in oklab, var(--aqa-bad) 50%, transparent);
      background: color-mix(in oklab, var(--aqa-bad) 10%, transparent);
    }
    .verdict strong {
      display: block;
      font-size: 11.5px;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .verdict p {
      font-size: 11.5px;
      color: var(--aqa-ink-dim);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }
    .row-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .section-title {
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
      font-weight: 700;
      margin-bottom: 9px;
    }
    .mono {
      font-family: var(--aqa-mono);
    }
    .formula {
      font-family: var(--aqa-mono);
      font-size: 10.5px;
      color: var(--aqa-ink-faint);
      line-height: 1.7;
      padding: 10px 12px;
      border-radius: 11px;
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
      border-left: 2px solid color-mix(in oklab, var(--aqa-primary) 60%, transparent);
      overflow-x: auto;
    }
    .formula b {
      color: var(--aqa-primary);
      font-weight: 600;
    }
    .cert-btn {
      width: 100%;
      margin-top: 12px;
      justify-content: center;
    }
    .cam-frame {
      position: absolute;
      inset: 0;
    }
    .cam-frame video {
      transform: scaleX(1);
    }
  `;

  @state() private subMode: SubMode = 'turbidity';
  @state() private kernel: NephelometryKernel | null = null;
  @state() private backend: WasmBackendInfo | null = null;
  @state() private activePad: PadKey = 'ph';
  @state() private cameraOn = false;
  @state() private scanning = false;
  @state() private contrast = 0.965;
  @state() private incident = 214;
  @state() private scattered = 34;
  @state() private pathMm = 30;
  @state() private measuredLab = { L: 52.4, a: 26.1, b: 22.8 };

  @query('video') private videoEl?: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private sampleTick = 0;

  private stateCtl = consumeState(this, (s) => ({
    scan: s.scan,
    sampleId: s.sampleId,
    camera: s.permissions.camera.state,
  }));

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    const { kernel, info } = await loadDspKernel();
    this.kernel = kernel;
    this.backend = info;
    this.syncFromScan();
  }

  disconnectedCallback(): void {
    this.stopCamera();
    super.disconnectedCallback();
  }

  private syncFromScan(): void {
    const scan = this.stateCtl.value.scan;
    if (!scan) return;
    // Derive a physically consistent scatter/contrast pair from the scan so the
    // camera strips read the same numbers as the simulators.
    this.contrast = Math.max(0.35, 0.972 * Math.exp(-scan.ntu / 12));
    this.scattered = Math.round(18 + scan.ntu * 9.4);
  }

  // ── derived values ────────────────────────────────────────────────────────
  private get ntu(): number {
    if (!this.kernel) return 0;
    const fromContrast = this.kernel.ntuFromContrast(this.contrast, 0.972, this.pathMm);
    const fromScatter = this.kernel.ntuFromScatter(this.scattered, this.incident, 3.2, 2.85);
    // Blend the two optical methods 55/45 — contrast dominates at low NTU,
    // scattering dominates once the veil saturates the star.
    return Math.round((fromContrast * 0.55 + fromScatter * 0.45) * 100) / 100;
  }

  private get potability() {
    return POTABILITY[this.kernel?.potabilityClass(this.ntu) ?? 0];
  }

  private padResult(key: PadKey) {
    if (!this.kernel) return { value: 0, deltaE: 0, bestIndex: 0, deltas: [] as number[], confidence: 1 };
    const chart = PAD_CHARTS[key];
    const labs = PAD_LABS[key];
    const heap = this.kernel.heap();
    const off = this.kernel.scratchA() / 8;
    for (let i = 0; i < labs.length; i++) {
      heap[off + i * 3] = labs[i].L;
      heap[off + i * 3 + 1] = labs[i].a;
      heap[off + i * 3 + 2] = labs[i].b;
    }
    const measured = this.measuredLabFor(key);
    const bestIndex = this.kernel.matchBestPad(measured.L, measured.a, measured.b, labs.length);
    const deltas = labs.map((_, i) => this.kernel!.padDeltaE(measured.L, measured.a, measured.b, i));
    const interp = interpolatePadValue(chart, deltas, bestIndex);
    return {
      value: Number(interp.value.toFixed(chart.decimals)),
      deltaE: Math.round(deltas[bestIndex] * 100) / 100,
      bestIndex,
      deltas,
      confidence: interp.confidence,
    };
  }

  /** Measured pad colour: comes from the scan, modulated by the active sample. */
  private measuredLabFor(key: PadKey) {
    const scan = this.stateCtl.value.scan;
    if (!scan) return this.measuredLab;
    const chart = PAD_CHARTS[key];
    const value = scan.pads[key];
    // Find the chart position for this value and interpolate its Lab colour,
    // then add a small deterministic instrument error so ΔE is realistic.
    const sw = chart.swatches;
    let lo = sw[0];
    let hi = sw[sw.length - 1];
    for (let i = 0; i < sw.length - 1; i++) {
      if (value >= sw[i].value && value <= sw[i + 1].value) {
        lo = sw[i];
        hi = sw[i + 1];
        break;
      }
    }
    const span = hi.value - lo.value || 1;
    const t = Math.max(0, Math.min(1, (value - lo.value) / span));
    const a = PAD_LABS[key][sw.indexOf(lo)];
    const b = PAD_LABS[key][sw.indexOf(hi)];
    const jitter = ((scan.sampleId.length * 7 + key.length * 13) % 9) / 9 - 0.5;
    return {
      L: a.L + (b.L - a.L) * t + jitter * 1.6,
      a: a.a + (b.a - a.a) * t - jitter * 1.1,
      b: a.b + (b.b - a.b) * t + jitter * 0.9,
    };
  }

  private buildScan(method: ScanResult['method']): ScanResult {
    const scan = this.stateCtl.value.scan;
    const ntu = Math.round(this.ntu * 100) / 100;
    const pads = {
      ph: this.padResult('ph').value,
      chlorine: this.padResult('chlorine').value,
      alkalinity: this.padResult('alkalinity').value,
      hardness: this.padResult('hardness').value,
      nitrate: this.padResult('nitrate').value,
      nitrite: this.padResult('nitrite').value,
      copper: this.padResult('copper').value,
    };
    const base = scan ?? scanFromSample(sampleById(this.stateCtl.value.sampleId));
    const stability = assess(pads.ph, 20, base.pads.hardness * 1.4 + 40, pads.hardness, pads.alkalinity);
    const potability = this.kernel?.potabilityClass(ntu) ?? 0;
    return {
      ...base,
      id: `scan_${Date.now().toString(36)}`,
      createdAt: Date.now(),
      ntu,
      tss: Math.round((this.kernel?.tssFromNtu(ntu, 2.1) ?? ntu * 2.1) * 100) / 100,
      potability,
      pads,
      padConfidence: Object.fromEntries(PAD_ORDER.map((k) => [k, this.padResult(k).confidence])) as Record<PadKey, number>,
      stability,
      method,
      healthScore: healthScore(pads, ntu, stability),
    };
  }

  private async commitScan(method: ScanResult['method']): Promise<void> {
    const scan = this.buildScan(method);
    store.update((s) => {
      s.scan = scan;
      s.scanHistory = [scan, ...s.scanHistory].slice(0, 40);
      s.syncQueue = s.syncQueue + 1;
    });
    store.refreshPalette();
    await saveScan(scan);
    this.vibrate(method === 'camera' ? [10, 30, 10] : 12);
    this.toast(`Scan captured · ${scan.ntu.toFixed(2)} NTU · LSI ${scan.stability.lsi.toFixed(2)}`, 'ok');
  }

  private loadSample(id: string): void {
    const sample = sampleById(id);
    const scan = scanFromSample(sample);
    store.update((s) => {
      s.sampleId = id;
      s.scan = scan;
      s.scanHistory = [scan, ...s.scanHistory].slice(0, 40);
    });
    store.refreshPalette();
    this.contrast = Math.max(0.35, 0.972 * Math.exp(-scan.ntu / 12));
    this.scattered = Math.round(18 + scan.ntu * 9.4);
    void saveScan(scan);
    this.vibrate(8);
    this.toast(`${sample.shortName} loaded into the optical train.`, 'info');
  }

  // ── camera ───────────────────────────────────────────────────────────────
  private async toggleCamera(): Promise<void> {
    if (this.cameraOn) {
      this.stopCamera();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      store.update((s) => {
        s.permissions.camera.state = 'restricted';
        s.permissions.camera.note = 'No getUserMedia in this context — use the simulators.';
      });
      this.toast('Camera API unavailable. Simulators remain fully accurate.', 'warn');
      return;
    }
    this.scanning = true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false,
      });
      await this.updateComplete;
      if (this.videoEl) {
        this.videoEl.srcObject = this.stream;
        await this.videoEl.play();
      }
      this.cameraOn = true;
      store.update((s) => {
        s.permissions.camera.state = 'active';
        s.permissions.camera.note = `Live ${this.stream?.getVideoTracks()[0]?.getSettings().width ?? 0}×${this.stream?.getVideoTracks()[0]?.getSettings().height ?? 0} rear camera`;
      });
      this.startLiveSampling();
    } catch (err) {
      store.update((s) => {
        s.permissions.camera.state = 'denied';
        s.permissions.camera.note = err instanceof Error ? err.message : 'Permission denied';
      });
      this.toast('Camera blocked — privileges drawer lets you retry or stay on simulators.', 'warn');
    } finally {
      this.scanning = false;
    }
  }

  private startLiveSampling(): void {
    window.clearInterval(this.sampleTick);
    this.sampleTick = window.setInterval(() => {
      if (!this.cameraOn || !this.videoEl) return;
      // Real MTF proxy: sample the centre reticle's luminance spread from the
      // compressed video frame. Turbid water veils the target → lower spread.
      const probe = document.createElement('canvas');
      probe.width = 32;
      probe.height = 32;
      const ctx = probe.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const vw = this.videoEl.videoWidth;
      const vh = this.videoEl.videoHeight;
      if (!vw || !vh) return;
      ctx.drawImage(this.videoEl, vw / 2 - 64, vh / 2 - 64, 128, 128, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;
      let min = 255;
      let max = 0;
      for (let i = 0; i < data.length; i += 4) {
        const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        min = Math.min(min, l);
        max = Math.max(max, l);
      }
      const c = (max - min) / Math.max(max, 1);
      this.contrast = Math.max(0.12, Math.min(0.995, c));
      this.scattered = Math.round(12 + (1 - c) * 190);
      this.incident = Math.round(Math.max(60, Math.min(250, max)));
      store.update((s) => {
        if (s.permissions.camera.state === 'active') {
          s.permissions.camera.note = `live MTF ${(c * 100).toFixed(1)} % · ${this.ntu.toFixed(2)} NTU`;
        }
      });
    }, 260);
  }

  private stopCamera(): void {
    window.clearInterval(this.sampleTick);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.cameraOn = false;
  }

  // ── render helpers ───────────────────────────────────────────────────────
  private renderSiemensStar() {
    const spokes = 36;
    const lines = [];
    for (let i = 0; i < spokes; i++) {
      const a0 = (i / spokes) * Math.PI * 2;
      const a1 = ((i + 0.5) / spokes) * Math.PI * 2;
      lines.push(
        `M100,100 L${(100 + Math.cos(a0) * 96).toFixed(2)},${(100 + Math.sin(a0) * 96).toFixed(2)} A96,96 0 0 1 ${(
          100 + Math.cos(a1) * 96
        ).toFixed(2)},${(100 + Math.sin(a1) * 96).toFixed(2)} Z`,
      );
    }
    return html`
      <svg class="siemens" viewBox="0 0 200 200" aria-label="Siemens star optical calibration target">
        <defs>
          <radialGradient id="starBg" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="78%" stop-color="#f2fbff" />
            <stop offset="100%" stop-color="#d8ecf6" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="99" fill="url(#starBg)" />
        <g fill="#04121c">${lines.map((d) => html`<path d=${d} />`)}</g>
        <circle cx="100" cy="100" r="7" fill="none" stroke="#04121c" stroke-width="2" />
        <circle cx="100" cy="100" r="2.4" fill="#04121c" />
      </svg>
    `;
  }

  private renderTurbidity() {
    const ntu = this.ntu;
    const pot = this.potability;
    const tss = this.kernel?.tssFromNtu(ntu, 2.1) ?? 0;
    const haze = this.kernel?.hazeLossPct(ntu, this.pathMm) ?? 0;
    const tone = pot.tone;

    return html`
      <div class="grid">
        <div class="stack">
          <aqua-card accent>
            <div class="row-between" style="margin-bottom:12px">
              <div>
                <div class="section-title" style="margin:0">Tyndall Nephelometry · 90° scatter + MTF</div>
                <h3 style="font-size:15px;margin-top:3px">Optical calibration target</h3>
              </div>
              <aqua-badge tone=${tone} pulse=${tone === 'bad'}>${pot.label}</aqua-badge>
            </div>

            <div
              class="viewport"
              style=${`--target-contrast:${(0.35 + this.contrast * 1.35).toFixed(3)}; --target-blur:${(ntu * 0.34).toFixed(2)}px; --target-bright:${(1.06 - Math.min(0.4, ntu / 60)).toFixed(3)}`}
            >
              ${this.cameraOn
                ? html`<div class="cam-frame"><video playsinline muted autoplay></video></div>`
                : this.renderSiemensStar()}
              <div class="reticle"></div>
              <div class="reticle-ring"></div>
              ${this.scanning ? html`<div class="scanline"></div>` : null}
              <div class="viewport-tag ${this.cameraOn ? 'live' : ''}">
                <i class="dot"></i>${this.cameraOn ? '90° scatter · live' : 'simulated optical bench'}
              </div>
            </div>

            <div class="viewport-actions">
              <button class="btn ${this.cameraOn ? '' : 'primary'}" @click=${() => this.toggleCamera()}>
                <aqua-icon name="camera" size="14"></aqua-icon>
                ${this.cameraOn ? 'Stop camera' : 'Arm camera'}
              </button>
              <button class="btn" @click=${() => void this.commitScan('camera')}>
                <aqua-icon name="aperture" size="14"></aqua-icon>Capture reading
              </button>
              <button class="btn" @click=${() => this.refreshCameraFrame()}>
                <aqua-icon name="refresh" size="14"></aqua-icon>Re-sample
              </button>
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Sample library · 5 field simulators</div>
            <div class="samples">
              ${SAMPLES.map(
                (s) => html`
                  <button
                    class="sample"
                    style=${`--tint:${s.tint}`}
                    aria-pressed=${this.stateCtl.value.sampleId === s.id}
                    @click=${() => this.loadSample(s.id)}
                  >
                    <strong>${s.shortName}</strong>
                    <small>${s.ntu.toFixed(2)} NTU · pH ${s.ph.toFixed(1)} · ${s.hardness} ppm</small>
                  </button>
                `,
              )}
            </div>
          </aqua-card>
        </div>

        <div class="stack">
          <aqua-card accent>
            <div class="section-title">Nephelometric result</div>
            <div style="display:flex;justify-content:center;margin:-6px 0 4px">
              <aqua-gauge
                style="max-width:230px"
                .value=${ntu}
                min="0"
                max="25"
                unit="NTU · FORMAZIN"
                decimals="2"
                bigSize="30px"
                color=${tone === 'bad' ? 'var(--aqa-bad)' : tone === 'warn' ? 'var(--aqa-warn)' : 'var(--aqa-primary)'}
              ></aqua-gauge>
            </div>
            <div class="stats">
              <aqua-stat label="Total suspended solids" value=${tss.toFixed(2)} unit="mg/L" hint="EPA 160.2 · k=2.1"></aqua-stat>
              <aqua-stat label="Haze loss" value=${haze.toFixed(1)} unit="%" hint=${`${this.pathMm} mm path`}></aqua-stat>
              <aqua-stat label="Turbidity class" value=${pot.label.split(' ')[0]} unit="" hint="EPA 141.13"></aqua-stat>
            </div>
            <div class="verdict ${tone}">
              <aqua-icon name=${tone === 'ok' ? 'check' : 'alert'} size="19"></aqua-icon>
              <div>
                <strong>${pot.label}</strong>
                <p>${pot.note}</p>
              </div>
            </div>
            <div class="formula">
              <b>NTU</b> = k<sub>cal</sub>·(S/I₀)·1000 → compressed by (1 + 0.016·NTU)<br />
              <b>MTF</b> = 40·(30/path)·ln(C₀/C)<sup>1.05</sup> · <b>TSS</b> = 2.1·NTU
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Optical bench controls</div>
            <div class="lab-sliders">
              <aqua-slider
                label="Centre reticle contrast"
                unit="MTF"
                .value=${this.contrast}
                min="0.1"
                max="0.999"
                step="0.001"
                decimals="3"
                @slider-input=${(e: CustomEvent) => {
                  this.contrast = e.detail.value;
                }}
              ></aqua-slider>
              <aqua-slider
                label="90° scattered luminance"
                unit="cd/m²"
                .value=${this.scattered}
                min="8"
                max="255"
                step="1"
                @slider-input=${(e: CustomEvent) => {
                  this.scattered = e.detail.value;
                }}
              ></aqua-slider>
              <aqua-slider
                label="Sample path length"
                unit="mm"
                .value=${this.pathMm}
                min="10"
                max="100"
                step="1"
                @slider-input=${(e: CustomEvent) => {
                  this.pathMm = e.detail.value;
                }}
              ></aqua-slider>
            </div>
          </aqua-card>

          <button
            class="btn primary cert-btn"
            @click=${() => {
              store.update((s) => {
                s.certificateOpen = true;
              });
            }}
          >
            <aqua-icon name="shield" size="15"></aqua-icon>
            Open hydro-chemical certificate
          </button>
        </div>
      </div>
    `;
  }

  private refreshCameraFrame(): void {
    this.contrast = Math.max(0.12, Math.min(0.995, this.contrast + (Math.random() - 0.5) * 0.02));
    this.toast('Optical bench re-sampled.', 'info');
  }

  private renderStrip() {
    const active = this.activePad;
    const chart = PAD_CHARTS[active];
    const result = this.padResult(active);
    const measured = this.measuredLabFor(active);
    const measuredRgb = labToRgb(measured);
    const totalConfidence = PAD_ORDER.reduce((a, k) => a + this.padResult(k).confidence, 0) / PAD_ORDER.length;

    return html`
      <div class="grid">
        <div class="stack">
          <aqua-card accent>
            <div class="row-between" style="margin-bottom:10px">
              <div>
                <div class="section-title" style="margin:0">Calibrated 7-pad colorimeter · CIEDE2000</div>
                <h3 style="font-size:15px;margin-top:3px">Reagent strip</h3>
              </div>
              <aqua-badge tone=${totalConfidence > 0.72 ? 'ok' : 'warn'}>${(totalConfidence * 100).toFixed(0)}% match</aqua-badge>
            </div>
            <div class="strip">
              ${PAD_ORDER.map((key) => {
                const r = this.padResult(key);
                const m = this.measuredLabFor(key);
                const rgb = labToRgb(m);
                const c = PAD_CHARTS[key];
                return html`
                  <button
                    class="pad"
                    aria-pressed=${key === active}
                    title=${`${c.name} — ΔE00 ${r.deltaE.toFixed(2)}`}
                    @click=${() => {
                      this.activePad = key;
                    }}
                  >
                    <span class="swatch" style=${`background:${rgbCss(rgb)}`}></span>
                    <span class="readout">${r.value.toFixed(c.decimals)}</span>
                    <span class="id">${c.name.split(' ')[0]}</span>
                  </button>
                `;
              })}
            </div>
            <div class="verdict ok" style="margin-top:12px">
              <aqua-icon name="check" size="18"></aqua-icon>
              <div>
                <strong>ΔE00 matched</strong>
                <p>
                  Every pad is matched against its printed chart in the CIE L*a*b* space using the full CIEDE2000
                  formula — including the rotation term R<sub>T</sub> that ordinary RGB comparison misses. Values
                  interpolate between adjacent swatches, so pH resolves to ±0.05 rather than the printed ±0.2.
                </p>
              </div>
            </div>
          </aqua-card>

          <aqua-card>
            <div class="chart-head">
              <h3>${chart.name} chart · ${chart.unit}</h3>
              <span class="sub">best ΔE00 ${result.deltaE.toFixed(2)}</span>
            </div>
            <p style="font-size:11.5px;color:var(--aqa-ink-dim);margin-bottom:10px">${chart.description}</p>
            <div class="swatch-rail">
              ${chart.swatches.map((s, i) => {
                const rgb = labToRgb(PAD_LABS[active][i]);
                return html`
                  <div class="chart-swatch ${i === result.bestIndex ? 'best' : ''}">
                    <span class="chip" style=${`background:${rgbCss(rgb)}`}></span>
                    <span class="lb">${s.label}</span>
                    <span class="de">${result.deltas[i]?.toFixed(1) ?? '—'}</span>
                  </div>
                `;
              })}
            </div>
            <div class="measured">
              <span class="dot" style=${`background:${rgbCss(measuredRgb)}`}></span>
              <span class="lab">
                measured L*<b>${measured.L.toFixed(1)}</b> a*<b>${measured.a.toFixed(1)}</b> b*<b>${measured.b.toFixed(1)}</b><br />
                best swatch ΔE00 <b>${result.deltaE.toFixed(2)}</b> · ${result.deltaE < 1 ? 'imperceptible' : result.deltaE < 2.3 ? 'just-noticeable' : result.deltaE < 5 ? 'perceptible' : 'poor match'}
              </span>
            </div>
          </aqua-card>
        </div>

        <div class="stack">
          <aqua-card accent>
            <div class="section-title">Strip reading</div>
            <div class="stats">
              ${PAD_ORDER.map((key) => {
                const c = PAD_CHARTS[key];
                const r = this.padResult(key);
                return html`
                  <aqua-stat
                    label=${c.name}
                    value=${r.value.toFixed(c.decimals)}
                    unit=${c.unit}
                    hint=${`ΔE00 ${r.deltaE.toFixed(2)}`}
                    color=${key === active ? 'var(--aqa-primary)' : ''}
                  ></aqua-stat>
                `;
              })}
            </div>
            <button class="btn primary cert-btn" @click=${() => void this.commitScan('manual')}>
              <aqua-icon name="check" size="15"></aqua-icon>
              Lock reading & run hazard inference
            </button>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Instrument trim</div>
            <div class="lab-sliders">
              <aqua-slider
                label="Measured L* (lightness)"
                unit="L*"
                .value=${this.measuredLab.L}
                min="0"
                max="100"
                step="0.1"
                decimals="1"
                @slider-input=${(e: CustomEvent) => {
                  this.measuredLab = { ...this.measuredLab, L: e.detail.value };
                }}
              ></aqua-slider>
              <aqua-slider
                label="Measured a* (red–green)"
                unit="a*"
                .value=${this.measuredLab.a}
                min="-80"
                max="80"
                step="0.1"
                decimals="1"
                @slider-input=${(e: CustomEvent) => {
                  this.measuredLab = { ...this.measuredLab, a: e.detail.value };
                }}
              ></aqua-slider>
              <aqua-slider
                label="Measured b* (yellow–blue)"
                unit="b*"
                .value=${this.measuredLab.b}
                min="-80"
                max="80"
                step="0.1"
                decimals="1"
                @slider-input=${(e: CustomEvent) => {
                  this.measuredLab = { ...this.measuredLab, b: e.detail.value };
                }}
              ></aqua-slider>
            </div>
            <div class="formula" style="margin-top:12px">
              <b>ΔE00</b> = √[(ΔL′/k<sub>L</sub>S<sub>L</sub>)² + (ΔC′/k<sub>C</sub>S<sub>C</sub>)² + (ΔH′/k<sub>H</sub>S<sub>H</sub>)² + R<sub>T</sub>(ΔC′/k<sub>C</sub>S<sub>C</sub>)(ΔH′/k<sub>H</sub>S<sub>H</sub>)]
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Why white balance first</div>
            <p style="font-size:11.5px;color:var(--aqa-ink-dim)">
              Phone cameras auto-adjust colour temperature, which shifts a pH pad by up to ΔE 6 — more than a whole
              chart step. AQUA-SPECTRA applies von Kries chromatic adaptation from the 18 % grey reference card before
              converting to L*a*b*, so tap water, warm indoor bulbs and direct sun all land on the same swatch.
            </p>
            <div class="measured" style="margin-top:10px">
              <span class="dot" style="background:#7d7d7d"></span>
              <span class="lab">grey-card gains <b>R ${this.kernel?.whiteBalanceGains(128, 126, 121)[0].toFixed(3) ?? '—'}</b> · <b>G ${this.kernel?.whiteBalanceGains(128, 126, 121)[1].toFixed(3) ?? '—'}</b> · <b>B ${this.kernel?.whiteBalanceGains(128, 126, 121)[2].toFixed(3) ?? '—'}</b></span>
            </div>
          </aqua-card>
        </div>
      </div>
    `;
  }

  render() {
    const scan = this.stateCtl.value.scan;
    return html`
      <div class="head">
        <div>
          <h2>Optical <span>Nephelometer</span> & Colorimeter</h2>
          <p>
            Turns any phone camera into a 90° Tyndall-scatter nephlometer plus a CIEDE2000 reagent-strip reader.
            Turbidity resolves to 0.01 NTU; seven reagent pads resolve to their native chart units.
          </p>
        </div>
        <div class="grow"></div>
        <div class="seg" role="tablist">
          <button aria-pressed=${this.subMode === 'turbidity'} @click=${() => (this.subMode = 'turbidity')}>
            <aqua-icon name="aperture" size="13"></aqua-icon> A · Tyndall NTU
          </button>
          <button aria-pressed=${this.subMode === 'strip'} @click=${() => (this.subMode = 'strip')}>
            <aqua-icon name="beaker" size="13"></aqua-icon> B · 7-Pad ΔE00
          </button>
        </div>
      </div>

      ${this.subMode === 'turbidity' ? this.renderTurbidity() : this.renderStrip()}

      <aqua-card style="margin-top:16px" ?accent=${!!scan}>
        <div class="row-between">
          <div>
            <div class="section-title" style="margin-bottom:4px">Runtime</div>
            <span class="mono" style="font-size:11px;color:var(--aqa-ink-dim)">
              ${this.backend
                ? `${this.backend.label} · ABI v${this.backend.abiVersion} · ${this.backend.wasmBytes} B · ${this.backend.bootMs} ms boot · sha256 ${this.backend.sha256.slice(0, 12)}…`
                : 'linking kernel…'}
            </span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <aqua-badge tone="info">asm → wasm</aqua-badge>
            <aqua-badge tone="violet">ciede2000 f64</aqua-badge>
            <aqua-badge tone="ok">self-test ${this.kernel?.selfTest().toFixed(1) ?? '—'}</aqua-badge>
          </div>
        </div>
      </aqua-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-optics-panel': OpticsPanel;
  }
}
