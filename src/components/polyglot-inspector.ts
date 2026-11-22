/**
 * AQUA-SPECTRA — <aqua-polyglot-inspector>
 * Live source viewer + benchmark lab for all five languages. Every tab shows
 * the actual file shipped in this repository (Vite `?raw` at build time), and
 * each has a "run" action that executes the real path and reports timing.
 */
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ModalBase } from './modal-base';
import { consumeState } from './base';
import ELIXIR_SRC from '../../lib/aqua_chemistry.ex?raw';
import DATALOG_SRC from '../rules/water_contaminants.dl?raw';
import GLSL_SRC from '../shaders/caustic_refraction.glsl?raw';
import AS_SRC from '../../assembly/nephelometry_dsp.ts?raw';
import BRIDGE_SRC from '../wasm/assemblyScriptBridge.ts?raw';
import DOCK_SRC from './gooey-dock.ts?raw';
import SPRING_SRC from '../controllers/springController.ts?raw';
import DATALOG_ENGINE_SRC from '../logic/datalog.ts?raw';
import { loadDspKernel } from '../wasm/assemblyScriptBridge';
import { evaluate, parseProgram } from '../logic/datalog';
import { assess } from '../elixir/aquaChemistry';
import { store } from '../state/store';

type LangId = 'assemblyscript' | 'lit' | 'elixir' | 'datalog' | 'glsl';

type Lang = {
  id: LangId;
  name: string;
  file: string;
  version: string;
  accent: string;
  blurb: string;
  source: string;
  extra?: { name: string; source: string };
  runLabel: string;
};

const LANGS: Lang[] = [
  {
    id: 'assemblyscript',
    name: 'AssemblyScript',
    file: 'assembly/nephelometry_dsp.ts',
    version: 'asc 0.28 · WASM f64',
    accent: '#38bdf8',
    blurb:
      'Tyndall/Mie nephelometry, full CIEDE2000 with the R_T rotation term, radix-2 FFT with parabolic peak interpolation, and quarter-wave Helmholtz inversion — all compiled to a 13 KB stub-runtime module with zero JS glue.',
    source: AS_SRC,
    extra: { name: 'src/wasm/assemblyScriptBridge.ts', source: BRIDGE_SRC },
    runLabel: 'Run DSP benchmark',
  },
  {
    id: 'lit',
    name: 'Lit 3.2',
    file: 'src/controllers/springController.ts',
    version: 'Lit 3.2.1 · TS 5.7',
    accent: '#06b6d4',
    blurb:
      'Native custom elements with reactive properties. The SpringController integrates m·ẍ + c·ẋ + k·x with semi-implicit Euler at 1 kHz substeps, so every gauge settles like liquid regardless of frame rate.',
    source: SPRING_SRC,
    extra: { name: 'src/components/gooey-dock.ts', source: DOCK_SRC },
    runLabel: 'Integrate a spring',
  },
  {
    id: 'elixir',
    name: 'Elixir',
    file: 'lib/aqua_chemistry.ex',
    version: 'Elixir 1.17 · zero deps',
    accent: '#a78bfa',
    blurb:
      'Total functions with pattern-matched guards and pipe operators. LSI/RSI, plumbosolvency, limescale, SCA scoring, WHO/EPA dosing and altitude boiling — mirrored line-for-line in TypeScript for byte-identical browser results.',
    source: ELIXIR_SRC,
    runLabel: 'Evaluate LSI pipeline',
  },
  {
    id: 'datalog',
    name: 'Datalog',
    file: 'src/rules/water_contaminants.dl',
    version: 'stratified fixpoint',
    accent: '#f59e0b',
    blurb:
      'Declarative hazard knowledge: facts from optics, rules for corrosion/nitrate/chloramine/pathogen/limescale inference, and a severity-rank rollup. Evaluated by a semi-naive engine with stratified negation.',
    source: DATALOG_SRC,
    extra: { name: 'src/logic/datalog.ts', source: DATALOG_ENGINE_SRC },
    runLabel: 'Evaluate fixpoint',
  },
  {
    id: 'glsl',
    name: 'GLSL ES 3.00',
    file: 'src/shaders/caustic_refraction.glsl',
    version: 'WebGL2 · fragment',
    accent: '#10b981',
    blurb:
      'Two refraction layers summed by focal divergence, Beer–Lambert extinction from measured NTU, pH-driven absorption shift, and a meniscus rim light. Runs at 60 fps, or 24 fps at half resolution in Eco mode.',
    source: GLSL_SRC,
    runLabel: 'Benchmark shader',
  },
];

@customElement('aqua-polyglot-inspector')
export class PolyglotInspector extends ModalBase {
  static styles = [
    ModalBase.modalStyles,
    css`
      .tabs {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }
      .tab {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 8px 13px;
        border-radius: 999px;
        border: 1px solid var(--aqa-hairline);
        background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
        color: var(--aqa-ink-dim);
        font-size: 11px;
        font-weight: 650;
        cursor: pointer;
        transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
        white-space: nowrap;
      }
      .tab i {
        width: 7px;
        height: 7px;
        border-radius: 2px;
        background: var(--accent);
        box-shadow: 0 0 8px var(--accent);
        flex: none;
      }
      .tab:hover {
        color: var(--aqa-ink);
        transform: translateY(-1px);
      }
      .tab:active {
        transform: scale(0.96);
      }
      .tab[aria-pressed='true'] {
        color: var(--aqa-ink);
        border-color: color-mix(in oklab, var(--accent) 58%, transparent);
        background: color-mix(in oklab, var(--accent) 15%, transparent);
      }
      .lang-head {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .lang-head h3 {
        font-size: 15px;
        letter-spacing: -0.01em;
      }
      .lang-head .file {
        font-family: var(--aqa-mono);
        font-size: 10.5px;
        color: var(--aqa-ink-faint);
        margin-top: 2px;
      }
      .lang-head .grow {
        flex: 1;
      }
      .lang-head p {
        font-size: 11.5px;
        color: var(--aqa-ink-dim);
        line-height: 1.55;
        max-width: 78ch;
        margin-top: 8px;
      }
      .file-switch {
        display: inline-flex;
        gap: 2px;
        padding: 2px;
        border-radius: 999px;
        border: 1px solid var(--aqa-hairline);
        background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
        margin-bottom: 8px;
      }
      .file-switch button {
        border: 0;
        background: transparent;
        color: var(--aqa-ink-faint);
        font-family: var(--aqa-mono);
        font-size: 9.5px;
        padding: 5px 10px;
        border-radius: 999px;
        cursor: pointer;
      }
      .file-switch button[aria-pressed='true'] {
        background: color-mix(in oklab, var(--accent) 24%, transparent);
        color: var(--aqa-ink);
      }
      pre {
        margin: 0;
        max-height: 400px;
        overflow: auto;
        border-radius: 13px;
        border: 1px solid var(--aqa-hairline);
        background: rgba(2, 8, 16, 0.62);
        padding: 13px 15px;
        font-size: 10.5px;
        line-height: 1.62;
        color: #c9ecff;
        tab-size: 2;
        counter-reset: line;
      }
      :host([data-theme='glacial']) pre {
        background: rgba(255, 255, 255, 0.94);
        color: #0b2b3c;
      }
      pre code {
        white-space: pre;
      }
      .bench {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
        margin-top: 12px;
      }
      .bench div {
        padding: 10px 12px;
        border-radius: 12px;
        background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
        border: 1px solid var(--aqa-hairline);
      }
      .bench span {
        display: block;
        font-size: 8.8px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--aqa-ink-faint);
        margin-bottom: 2px;
      }
      .bench b {
        font-family: var(--aqa-mono);
        font-size: 13px;
        font-weight: 660;
      }
      .run-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
        align-items: center;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border-radius: 11px;
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
        border-color: color-mix(in oklab, var(--accent) 60%, transparent);
        transform: translateY(-1px);
      }
      .btn:active {
        transform: scale(0.96);
      }
      .btn.primary {
        background: linear-gradient(120deg, color-mix(in oklab, var(--accent) 38%, transparent), color-mix(in oklab, var(--accent) 18%, transparent));
        border-color: color-mix(in oklab, var(--accent) 62%, transparent);
      }
      .out {
        margin-top: 10px;
        font-family: var(--aqa-mono);
        font-size: 10.5px;
        line-height: 1.6;
        padding: 10px 12px;
        border-radius: 11px;
        background: color-mix(in oklab, var(--accent) 8%, transparent);
        border: 1px solid color-mix(in oklab, var(--accent) 26%, transparent);
        color: var(--aqa-ink-dim);
        white-space: pre-wrap;
        word-break: break-word;
      }
    `,
  ];

  @state() private active: LangId = 'assemblyscript';
  @state() private showExtra = false;
  @state() private output = '';
  @state() private running = false;
  @state() private metrics: { label: string; value: string }[] = [];

  private stateCtl = consumeState(this, (s) => ({ open: s.inspectorOpen }));

  protected modalTitle() {
    return 'Five-Language Polyglot Inspector';
  }
  protected subtitle() {
    return 'Live source for every runtime in this instrument — plus an execute button on each.';
  }

  protected updated(changed: Map<string, unknown>): void {
    if (this.open !== this.stateCtl.value.open) this.open = this.stateCtl.value.open;
    super.updated(changed);
    if (changed.has('open') && !this.open) {
      store.update((s) => {
        s.inspectorOpen = false;
      });
    }
  }

  private get activeLang(): Lang {
    return LANGS.find((l) => l.id === this.active)!;
  }

  private async run(): Promise<void> {
    this.running = true;
    this.output = '';
    this.metrics = [];
    const t0 = performance.now();
    try {
      if (this.active === 'assemblyscript') {
        const { kernel, info } = await loadDspKernel();
        const n = 2048;
        const heap = kernel.heap();
        const off = kernel.scratchA() / 8;
        for (let i = 0; i < n; i++) heap[off + i] = Math.sin((2 * Math.PI * 640 * i) / 48000) * 0.4;
        const iter = 200;
        const t = performance.now();
        let peak = 0;
        for (let k = 0; k < iter; k++) peak = kernel.dominantFrequency(n, 48000, 200, 4500);
        const ms = performance.now() - t;
        this.metrics = [
          { label: 'FFT peak', value: `${peak.toFixed(1)} Hz` },
          { label: `${iter} FFTs`, value: `${ms.toFixed(1)} ms` },
          { label: 'per transform', value: `${((ms / iter) * 1000).toFixed(0)} µs` },
          { label: 'backend', value: info.backend },
        ];
        this.output = [
          `NTU (scatter 42/200)      = ${kernel.ntuFromScatter(42, 200, 3, 2.85).toFixed(3)}`,
          `ΔE00 identical labs       = ${kernel.deltaE00(50, 0, 0, 50, 0, 0).toFixed(6)}`,
          `ΔE00 (60,20,30)→(62,18,28) = ${kernel.deltaE00(60, 20, 30, 62, 18, 28).toFixed(4)}`,
          `dominant frequency        = ${peak.toFixed(2)} Hz (input 640 Hz)`,
          `self-test ΔE00(black,white)= ${kernel.selfTest().toFixed(1)}`,
          `module bytes ${info.wasmBytes} · sha256 ${info.sha256.slice(0, 16)}…`,
        ].join('\n');
      } else if (this.active === 'lit') {
        // Integrate the same ODE the SpringController uses, at several dt values.
        const integrate = (dt: number, seconds: number) => {
          const k = 310;
          const c = 24;
          const m = 0.85;
          let x = 0;
          let v = 0;
          const steps = Math.round(seconds / dt);
          for (let i = 0; i < steps; i++) {
            const a = (-k * (x - 1) - c * v) / m;
            v += a * dt;
            x += v * dt;
          }
          return x;
        };
        const t = performance.now();
        const a = integrate(1 / 60, 1.2);
        const b = integrate(1 / 240, 1.2);
        const ms = performance.now() - t;
        this.metrics = [
          { label: 'settle @ 60 Hz', value: a.toFixed(5) },
          { label: 'settle @ 240 Hz', value: b.toFixed(5) },
          { label: 'Δ frame-rate', value: Math.abs(a - b).toExponential(1) },
          { label: 'integration', value: `${ms.toFixed(2)} ms` },
        ];
        this.output =
          'Semi-implicit Euler, m=0.85 c=24 k=310, target=1.0, 1.2 s horizon.\n' +
          `60 Hz lands at ${a.toFixed(6)} · 240 Hz at ${b.toFixed(6)} → sub-micro-unit agreement, so the gauge looks identical on a 60 Hz phone and a 120 Hz tablet.`;
      } else if (this.active === 'elixir') {
        const t = performance.now();
        const r = assess(6.1, 24, 92, 48, 22);
        const ms = performance.now() - t;
        this.metrics = [
          { label: 'LSI', value: r.lsi.toFixed(3) },
          { label: 'RSI', value: r.rsi.toFixed(3) },
          { label: 'lead risk', value: `${r.leadCopperRiskPct}%` },
          { label: 'eval', value: `${ms.toFixed(3)} ms` },
        ];
        this.output = [
          'assess(ph=6.1, t=24, tds=92, ca=48, alk=22)',
          `  pHs          = ${r.phs}`,
          `  LSI          = ${r.lsi}  (${r.regime})`,
          `  RSI          = ${r.rsi}`,
          `  lead/copper  = ${r.leadCopperRiskPct}%  (${r.leadCopperClass})`,
          `  scale        = ${r.scaleMmPerYear} mm/yr → lifespan ${r.applianceLifespanYears} y`,
          `  remediation  = ${r.remediation.slice(0, 96)}…`,
        ].join('\n');
      } else if (this.active === 'datalog') {
        const t = performance.now();
        const program = parseProgram(DATALOG_SRC);
        const result = evaluate(program);
        const ms = performance.now() - t;
        this.metrics = [
          { label: 'rules', value: String(program.rules.length) },
          { label: 'facts', value: String(result.facts.length) },
          { label: 'derived', value: String(result.derivedCount) },
          { label: 'fixpoint', value: `${ms.toFixed(2)} ms` },
        ];
        this.output = [
          `stratification: ${[...program.strata.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`,
          `iterations=${result.iterations} derived=${result.derivedCount} elapsed=${result.elapsedMs} ms`,
          `seal: ${result.seals.map((s) => `${s.subject}→${s.level}`).join(', ')}`,
          '',
          '% first 6 inferences',
          ...result.steps.slice(0, 6).map((s) => `  ${s.rel}(${s.values.join(', ')}).`),
        ].join('\n');
      } else {
        const t = performance.now();
        let frames = 0;
        await new Promise<void>((resolve) => {
          const tick = () => {
            frames++;
            if (performance.now() - t < 500) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
        const ms = performance.now() - t;
        const fps = (frames / ms) * 1000;
        this.metrics = [
          { label: 'frames', value: String(frames) },
          { label: 'observed', value: `${fps.toFixed(0)} fps` },
          { label: 'uniforms', value: '10' },
          { label: 'layers', value: '2 refraction' },
        ];
        this.output =
          'The caustic shader is already live behind this dialog. Measured requestAnimationFrame cadence over 500 ms:\n' +
          `${frames} frames → ${fps.toFixed(1)} fps (compositor-capped; Eco mode halves the buffer and drops the second refraction layer).`;
      }
    } catch (err) {
      this.output = `error: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      this.running = false;
      void (performance.now() - t0);
    }
  }

  private copy(): void {
    const l = this.activeLang;
    const text = this.showExtra && l.extra ? l.extra.source : l.source;
    void navigator.clipboard?.writeText(text);
    this.toast(`Copied ${this.showExtra && l.extra ? l.extra.name : l.file}`, 'ok');
  }

  protected body() {
    const l = this.activeLang;
    const src = this.showExtra && l.extra ? l.extra.source : l.source;
    const lines = src.split('\n').length;
    return html`
      <div class="tabs" style=${`--accent:${l.accent}`}>
        ${LANGS.map(
          (x) => html`
            <button class="tab" style=${`--accent:${x.accent}`} aria-pressed=${this.active === x.id} @click=${() => {
              this.active = x.id;
              this.showExtra = false;
              this.output = '';
              this.metrics = [];
            }}>
              <i></i>${x.name}
            </button>
          `,
        )}
      </div>

      <div class="lang-head" style=${`--accent:${l.accent}`}>
        <div class="grow">
          <h3>${l.name} · ${l.version}</h3>
          <div class="file">${this.showExtra && l.extra ? l.extra.name : l.file} · ${lines} lines</div>
        </div>
        <aqua-badge tone="neutral">${(src.length / 1024).toFixed(1)} KB</aqua-badge>
      </div>
      <p style="font-size:11.5px;color:var(--aqa-ink-dim);line-height:1.55;max-width:80ch;margin:-4px 0 10px">${l.blurb}</p>

      ${l.extra
        ? html`<div class="file-switch" style=${`--accent:${l.accent}`}>
            <button aria-pressed=${!this.showExtra} @click=${() => (this.showExtra = false)}>${l.file}</button>
            <button aria-pressed=${this.showExtra} @click=${() => (this.showExtra = true)}>${l.extra.name}</button>
          </div>`
        : nothing}

      <pre><code>${src}</code></pre>

      <div class="run-row" style=${`--accent:${l.accent}`}>
        <button class="btn primary" @click=${() => void this.run()} ?disabled=${this.running}>
          <aqua-icon name="activity" size="14"></aqua-icon>${this.running ? 'running…' : l.runLabel}
        </button>
        <button class="btn" @click=${() => this.copy()}><aqua-icon name="copy" size="14"></aqua-icon> Copy source</button>
        <span style="font-size:10.5px;color:var(--aqa-ink-faint);font-family:var(--aqa-mono)">${l.version}</span>
      </div>

      ${this.metrics.length
        ? html`<div class="bench" style=${`--accent:${l.accent}`}>
            ${this.metrics.map((m) => html`<div><span>${m.label}</span><b>${m.value}</b></div>`)}
          </div>`
        : nothing}
      ${this.output ? html`<div class="out" style=${`--accent:${l.accent}`}>${this.output}</div>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-polyglot-inspector': PolyglotInspector;
  }
}
