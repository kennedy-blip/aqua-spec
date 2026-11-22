/**
 * AQUA-SPECTRA — <aqua-purification-architect>
 * Module 4 · Survival Purification Architect
 * WHO/EPA chemical disinfection dosing, SODIS, and barometric altitude boil
 * curves — the module that matters when the grid is down.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement, consumeState } from '../components/base';
import { boilingPoint, disinfectionDose, type DisinfectantAgent, type DosePlan } from '../elixir/aquaChemistry';
import { store } from '../state/store';
import { saveBatch } from '../db/aquaDb';

type VolumeUnit = 'L' | 'gal' | 'qt';

const AGENTS: { id: string; label: string; sub: string; agent: DisinfectantAgent }[] = [
  { id: 'bleach525', label: 'Household bleach 5.25 %', sub: 'unscented, no additives', agent: { kind: 'bleach', pct: 5.25 } },
  { id: 'bleach6', label: 'Household bleach 6.0 %', sub: 'concentrated, unscented', agent: { kind: 'bleach', pct: 6 } },
  { id: 'bleach825', label: 'Household bleach 8.25 %', sub: 'ultra, unscented', agent: { kind: 'bleach', pct: 8.25 } },
  { id: 'aquatabs85', label: 'Aquatabs 8.5 mg NaDCC', sub: '1 tablet / 1.5 L', agent: { kind: 'aquatabs', mg: 8.5 } },
  { id: 'aquatabs17', label: 'Aquatabs 17 mg NaDCC', sub: '1 tablet / 3 L', agent: { kind: 'aquatabs', mg: 17 } },
  { id: 'iodine', label: 'Tincture of iodine 2 %', sub: 'cold-water alternate', agent: { kind: 'iodine', pct: 2 } },
];

@customElement('aqua-purification-architect')
export class PurificationArchitect extends AquaElement {
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
      color: #34d399;
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
    .grid2 {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.03fr);
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
    .knobs {
      display: grid;
      gap: 13px;
    }
    .agents {
      display: grid;
      gap: 7px;
    }
    .agent {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--aqa-hairline);
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
      cursor: pointer;
      text-align: left;
      transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .agent:hover {
      border-color: color-mix(in oklab, #34d399 50%, transparent);
      transform: translateX(2px);
    }
    .agent:active {
      transform: scale(0.98);
    }
    .agent[aria-pressed='true'] {
      border-color: color-mix(in oklab, #34d399 70%, transparent);
      background: color-mix(in oklab, #34d399 13%, transparent);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.16);
    }
    .agent .radio {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      border: 1.5px solid var(--aqa-ink-faint);
      flex: none;
      display: grid;
      place-items: center;
      transition: border-color 180ms;
    }
    .agent[aria-pressed='true'] .radio {
      border-color: #34d399;
    }
    .agent[aria-pressed='true'] .radio::after {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 8px #34d399;
    }
    .agent b {
      display: block;
      font-size: 11.5px;
      font-weight: 640;
    }
    .agent span {
      font-size: 9.8px;
      color: var(--aqa-ink-faint);
      font-family: var(--aqa-mono);
    }
    .unit-seg {
      display: inline-flex;
      gap: 2px;
      padding: 2px;
      border-radius: 999px;
      border: 1px solid var(--aqa-hairline);
      background: var(--aqa-glass-fill);
      margin-bottom: 8px;
    }
    .unit-seg button {
      border: 0;
      background: transparent;
      color: var(--aqa-ink-faint);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 5px 11px;
      border-radius: 999px;
      cursor: pointer;
      transition: all 160ms;
    }
    .unit-seg button[aria-pressed='true'] {
      background: color-mix(in oklab, #34d399 26%, transparent);
      color: var(--aqa-ink);
    }
    .dose-hero {
      display: grid;
      gap: 4px;
      padding: 16px;
      border-radius: 16px;
      background: linear-gradient(140deg, color-mix(in oklab, #34d399 16%, transparent), color-mix(in oklab, #06b6d4 9%, transparent));
      border: 1px solid color-mix(in oklab, #34d399 40%, transparent);
    }
    .dose-hero .big {
      font-family: var(--aqa-mono);
      font-size: 42px;
      font-weight: 730;
      letter-spacing: -0.05em;
      line-height: 1;
      color: #6ee7b7;
      font-variant-numeric: tabular-nums;
    }
    .dose-hero .big small {
      font-size: 13px;
      color: var(--aqa-ink-dim);
      letter-spacing: 0.09em;
      margin-left: 5px;
    }
    .dose-hero .sub {
      font-size: 11.5px;
      color: var(--aqa-ink-dim);
      font-family: var(--aqa-mono);
      line-height: 1.5;
    }
    .ki {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(108px, 1fr));
      gap: 8px;
      margin-top: 10px;
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
    .steps {
      counter-reset: step;
      display: grid;
      gap: 7px;
      margin-top: 12px;
    }
    .steps div {
      counter-increment: step;
      display: flex;
      gap: 9px;
      font-size: 11.5px;
      line-height: 1.5;
      color: var(--aqa-ink-dim);
    }
    .steps div::before {
      content: counter(step);
      flex: none;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: color-mix(in oklab, #34d399 22%, transparent);
      border: 1px solid color-mix(in oklab, #34d399 45%, transparent);
      color: #6ee7b7;
      font-size: 9.5px;
      font-weight: 700;
      display: grid;
      place-items: center;
      margin-top: 1px;
    }
    .warn {
      display: flex;
      gap: 10px;
      padding: 11px 13px;
      border-radius: 13px;
      border: 1px solid color-mix(in oklab, var(--aqa-warn) 50%, transparent);
      background: color-mix(in oklab, var(--aqa-warn) 11%, transparent);
      color: var(--aqa-ink-dim);
      font-size: 11.5px;
      line-height: 1.55;
      margin-top: 11px;
    }
    .warn aqua-icon {
      color: var(--aqa-warn);
      flex: none;
    }
    .timer {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .timer .ring {
      --pct: 0;
      width: 74px;
      height: 74px;
      border-radius: 50%;
      background: conic-gradient(#34d399 calc(var(--pct) * 1%), color-mix(in oklab, var(--aqa-ink) 12%, transparent) 0);
      display: grid;
      place-items: center;
      flex: none;
    }
    .timer .ring > div {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--aqa-bg);
      display: grid;
      place-content: center;
      text-align: center;
    }
    .timer .ring b {
      font-family: var(--aqa-mono);
      font-size: 15px;
      font-weight: 680;
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
      border-color: color-mix(in oklab, #34d399 55%, transparent);
      transform: translateY(-1px);
    }
    .btn:active {
      transform: scale(0.96);
    }
    .btn.primary {
      background: linear-gradient(120deg, color-mix(in oklab, #34d399 40%, transparent), color-mix(in oklab, #06b6d4 28%, transparent));
      border-color: color-mix(in oklab, #34d399 62%, transparent);
      box-shadow: 0 0 24px -10px rgba(52, 211, 153, 0.7);
    }
    .boil-profile {
      position: relative;
      height: 128px;
      margin: 6px 0 0;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(2, 10, 18, 0.4), rgba(2, 10, 18, 0.62));
      border: 1px solid var(--aqa-hairline);
      overflow: hidden;
    }
    .boil-profile svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .formula {
      font-family: var(--aqa-mono);
      font-size: 10.5px;
      color: var(--aqa-ink-faint);
      line-height: 1.7;
      padding: 10px 12px;
      border-radius: 11px;
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
      border-left: 2px solid color-mix(in oklab, #34d399 65%, transparent);
      overflow-x: auto;
      margin-top: 12px;
    }
    .formula b {
      color: #34d399;
      font-weight: 600;
    }
    .sodis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }
    .sodis div {
      padding: 10px 11px;
      border-radius: 12px;
      background: color-mix(in oklab, #f59e0b 8%, transparent);
      border: 1px solid color-mix(in oklab, #f59e0b 26%, transparent);
    }
    .sodis b {
      display: block;
      font-family: var(--aqa-mono);
      font-size: 15px;
      color: #fbbf24;
    }
    .sodis span {
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
    }
    .mono {
      font-family: var(--aqa-mono);
    }
    .gate {
      display: grid;
      gap: 10px;
      place-items: center;
      text-align: center;
      padding: 20px 14px;
      border-radius: 14px;
      border: 1px dashed color-mix(in oklab, #34d399 30%, transparent);
    }
    .gate p {
      max-width: 48ch;
      font-size: 11.5px;
      color: var(--aqa-ink-dim);
    }
  `;

  @state() private unit: VolumeUnit = 'L';
  @state() private volume = 4;
  @state() private ntu = 1;
  @state() private tempC = 18;
  @state() private elevation = 1200;
  @state() private agentId = 'bleach525';
  @state() private timerLeft = 0;
  @state() private timerTotal = 0;

  private timerHandle = 0;
  private stateCtl = consumeState(this, (s) => ({ scan: s.scan }));

  connectedCallback(): void {
    super.connectedCallback();
    const scan = this.stateCtl.value.scan;
    if (scan) this.ntu = scan.ntu;
  }

  disconnectedCallback(): void {
    window.clearInterval(this.timerHandle);
    super.disconnectedCallback();
  }

  private get litres(): number {
    return this.unit === 'L' ? this.volume : this.unit === 'gal' ? this.volume * 3.78541 : this.volume * 0.946353;
  }

  private get plan(): DosePlan {
    const a = AGENTS.find((x) => x.id === this.agentId)!.agent;
    return disinfectionDose({ litres: this.litres, ntu: this.ntu, tempC: this.tempC, agent: a });
  }

  private get boil() {
    return boilingPoint(this.elevation);
  }

  private startTimer(minutes: number): void {
    window.clearInterval(this.timerHandle);
    this.timerTotal = minutes * 60;
    this.timerLeft = minutes * 60;
    this.timerHandle = window.setInterval(() => {
      this.timerLeft = Math.max(0, this.timerLeft - 1);
      if (this.timerLeft === 0) {
        window.clearInterval(this.timerHandle);
        this.chime();
        this.toast('Contact time complete — your water is safe to drink.', 'ok');
      }
    }, 1000);
  }

  private chime(): void {
    this.vibrate([60, 80, 60, 80, 60]);
  }

  private async logBatch(): Promise<void> {
    const p = this.plan;
    await saveBatch({
      createdAt: Date.now(),
      litres: Math.round(this.litres * 100) / 100,
      ntu: this.ntu,
      tempC: this.tempC,
      elevationM: this.elevation,
      agent: p.agent,
      doseMl: p.ml,
      contactMin: p.contactMin,
      boilMin: this.boil.rollingBoilMin,
      notes: p.warning ?? '',
      sampleId: this.stateCtl.value.scan?.sampleId ?? 'manual',
    });
    store.update((s) => {
      s.syncQueue = s.syncQueue + 1;
      s.toast = { id: Date.now(), text: 'Purification batch written to the offline vault.', tone: 'ok' };
    });
  }

  private boilCurvePath(): string {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const elev = (i / 60) * 5500;
      const tb = 100 * (0.2304 * Math.log(101.325 * (1 - 2.25577e-5 * elev) ** 5.25588 / 101.325) + 1);
      const x = (i / 60) * 100;
      const y = 100 - ((tb - 70) / 32) * 100;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `M${pts.join(' L')}`;
  }

  private renderDose() {
    const p = this.plan;
    const safe = this.timerTotal === 0 ? 0 : ((this.timerTotal - this.timerLeft) / this.timerTotal) * 100;
    const mm = String(Math.floor(this.timerLeft / 60)).padStart(2, '0');
    const ss = String(this.timerLeft % 60).padStart(2, '0');

    return html`
      <aqua-card accent>
        <div class="section-title">Exact chemical disinfection dose</div>
        <div class="dose-hero">
          <div class="big">
            ${p.tablets ? p.tablets : p.drops}<small>${p.tablets ? 'tablets' : 'drops'}</small>
          </div>
          <div class="sub">
            ${p.agent} · ${p.ml > 0 ? `${p.ml.toFixed(2)} mL` : 'no liquid'} for ${this.litres.toFixed(2)} L<br />
            target ${p.targetMgPerL.toFixed(1)} mg/L free chlorine · ${p.contactMin} min contact
          </div>
        </div>

        <div class="steps">
          ${p.steps.map((s) => html`<div>${s}</div>`)}
        </div>

        ${p.warning
          ? html`<div class="warn"><aqua-icon name="alert" size="17"></aqua-icon><span>${p.warning}</span></div>`
          : null}

        <div class="timer">
          <div class="ring" style=${`--pct:${safe}`}>
            <div><b>${mm}:${ss}</b><span style="font-size:8px;letter-spacing:0.1em;color:var(--aqa-ink-faint)">CONTACT</span></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn primary" @click=${() => this.startTimer(p.contactMin)}>
              <aqua-icon name="timer" size="14"></aqua-icon> Start ${p.contactMin}-min timer
            </button>
            <button class="btn" @click=${() => void this.logBatch()}>
              <aqua-icon name="database" size="14"></aqua-icon> Log batch
            </button>
          </div>
        </div>
      </aqua-card>
    `;
  }

  render() {
    const boil = this.boil;
    const sodisHours = this.ntu <= 5 ? 6 : this.ntu <= 30 ? 10 : null;

    return html`
      <div class="head">
        <div>
          <h2>Survival <span>Purification</span> Architect</h2>
          <p>
            WHO/EPA emergency disinfection dosing with double-dose turbidity and cold-water rules, plus a barometric
            altitude boiling curve, SODIS exposure table and pasteurisation fallback.
          </p>
        </div>
      </div>

      <div class="grid2">
        <div class="stack">
          <aqua-card>
            <div class="section-title">Batch definition</div>
            <div class="unit-seg" role="group" aria-label="Volume unit">
              ${(['L', 'gal', 'qt'] as VolumeUnit[]).map(
                (u) => html`<button aria-pressed=${this.unit === u} @click=${() => this.switchUnit(u)}>${u === 'L' ? 'LITRES' : u === 'gal' ? 'GALLONS' : 'QUARTS'}</button>`,
              )}
            </div>
            <div class="knobs">
              <aqua-slider label="Water volume" unit=${this.unit} .value=${this.volume} min="0.2" max=${this.unit === 'L' ? 40 : this.unit === 'gal' ? 10 : 40} step="0.1" decimals="1"
                @slider-input=${(e: CustomEvent) => (this.volume = e.detail.value)}></aqua-slider>
              <aqua-slider label="Measured turbidity" unit="NTU" .value=${this.ntu} min="0.1" max="60" step="0.1" decimals="1"
                @slider-input=${(e: CustomEvent) => (this.ntu = e.detail.value)}></aqua-slider>
              <aqua-slider label="Water temperature" unit="°C" .value=${this.tempC} min="0" max="40" step="1" decimals="0"
                @slider-input=${(e: CustomEvent) => (this.tempC = e.detail.value)}></aqua-slider>
              <aqua-slider label="Elevation" unit="m" .value=${this.elevation} min="0" max="5500" step="50" decimals="0"
                @slider-input=${(e: CustomEvent) => (this.elevation = e.detail.value)}></aqua-slider>
            </div>
            <div class="ki">
              <div><span>Batch</span><b>${this.litres.toFixed(2)}</b><span>litres</span></div>
              <div><span>Turbidity rule</span><b>${this.ntu > 5 ? '×2' : '×1'}</b><span>${this.ntu > 5 ? 'sediment consumes Cl' : 'within clear-water band'}</span></div>
              <div><span>Temperature rule</span><b>${this.tempC < 10 ? '×2' : '×1'}</b><span>${this.tempC < 10 ? 'cold slows kill kinetics' : 'ambient kinetics'}</span></div>
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Disinfectant</div>
            <div class="agents">
              ${AGENTS.map(
                (a) => html`
                  <button class="agent" aria-pressed=${this.agentId === a.id} @click=${() => (this.agentId = a.id)}>
                    <span class="radio"></span>
                    <span style="flex:1"><b>${a.label}</b><span>${a.sub}</span></span>
                  </button>
                `,
              )}
            </div>
            <div class="formula">
              <b>Dose</b> = V · C<sub>target</sub> / (NaOCl% · 10) &nbsp;·&nbsp; C<sub>target</sub> = 2 mg/L (4 mg/L if NTU &gt; 5 or T &lt; 10 °C)<br />
              1 mL ≈ 20 drops of standard household bleach
            </div>
          </aqua-card>
        </div>

        <div class="stack">
          ${this.renderDose()}

          <aqua-card>
            <div class="section-title">Barometric altitude boiling curve</div>
            <div class="boil-profile">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Boiling point versus elevation">
                <defs>
                  <linearGradient id="boilFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#34d399" stop-opacity="0.42" />
                    <stop offset="100%" stop-color="#34d399" stop-opacity="0.02" />
                  </linearGradient>
                </defs>
                <path d=${`${this.boilCurvePath()} L100,100 L0,100 Z`} fill="url(#boilFill)" />
                <path d=${this.boilCurvePath()} fill="none" stroke="#34d399" stroke-width="0.7" vector-effect="non-scaling-stroke" />
                <line x1="0" y1=${100 - ((95 - 70) / 32) * 100} x2="100" y2=${100 - ((95 - 70) / 32) * 100} stroke="rgba(245,158,11,0.55)" stroke-width="0.5" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
                <line
                  x1=${(this.elevation / 5500) * 100}
                  y1="0"
                  x2=${(this.elevation / 5500) * 100}
                  y2="100"
                  stroke="#a5f3fc"
                  stroke-width="0.6"
                  vector-effect="non-scaling-stroke"
                />
                <circle cx=${(this.elevation / 5500) * 100} cy=${100 - ((boil.boilingC - 70) / 32) * 100} r="1.6" fill="#e0fbff" />
              </svg>
            </div>
            <div class="ki">
              <div><span>Boiling point</span><b>${boil.boilingC.toFixed(1)}</b><span>°C / ${boil.boilingF.toFixed(1)} °F</span></div>
              <div><span>Local pressure</span><b>${boil.pressureKpa.toFixed(1)}</b><span>kPa</span></div>
              <div><span>Rolling boil</span><b>${boil.rollingBoilMin}</b><span>minutes</span></div>
              <div><span>Pasteurise</span><b>${boil.pasteuriseMin ?? '—'}</b><span>min @ 70 °C</span></div>
            </div>
            <div class="formula">
              <b>P(h)</b> = 101.325·(1 − 2.25577e−5·h)<sup>5.25588</sup> kPa<br />
              <b>T<sub>b</sub></b> = 100·(P/101.325)<sup>0.2304</sup> °C &nbsp;≈ −1 °C per 285 m
            </div>
            <p style="font-size:11.5px;color:var(--aqa-ink-dim);margin-top:10px;line-height:1.55">${boil.note}</p>
          </aqua-card>

          <aqua-card>
            <div class="section-title">SODIS — solar disinfection</div>
            <div class="sodis">
              <div><span>Clear PET bottles</span><b>${sodisHours ?? 'pre-filter'}</b><span>hours in full sun</span></div>
              <div><span>Max depth</span><b>≤ 5</b><span>cm / 2 L bottle</span></div>
              <div><span>Cloud cover</span><b>×2</b><span>exposure time</span></div>
              <div><span>Turbidity gate</span><b>&lt; 30</b><span>NTU or pre-filter</span></div>
            </div>
            <div class="${sodisHours ? 'formula' : 'warn'}" style="margin-top:11px">
              ${sodisHours
                ? html`<b>SODIS viable</b> — ${this.ntu.toFixed(1)} NTU is within the 30 NTU optical window. Lay bottles flat on a reflective surface, cap up, and expose for ${sodisHours} h.`
                : html`<aqua-icon name="alert" size="16"></aqua-icon><span>Turbidity ${this.ntu.toFixed(1)} NTU exceeds the 30 NTU SODIS limit — sediment shields pathogens from UV-A. Pre-filter to &lt;30 NTU, or boil instead.</span>`}
            </div>
          </aqua-card>
        </div>
      </div>
    `;
  }

  private switchUnit(u: VolumeUnit): void {
    if (this.unit === u) return;
    const litres = this.litres;
    this.unit = u;
    this.volume = Math.round((u === 'L' ? litres : u === 'gal' ? litres / 3.78541 : litres / 0.946353) * 10) / 10;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-purification-architect': PurificationArchitect;
  }
}
