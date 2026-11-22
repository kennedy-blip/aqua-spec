/**
 * AQUA-SPECTRA — <aqua-chemistry-lab>
 * Module 2 · Elixir Langelier Corrosion Lab
 *
 * Every number here is computed by src/elixir/aquaChemistry.ts, the
 * line-for-line deterministic mirror of lib/aqua_chemistry.ex. The panel shows
 * the five driving terms so an engineer can audit the index by hand.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement, consumeState } from '../components/base';
import { assess, ammoniaRisk, scaScore, type StabilityReport, type DescaleRecipe } from '../elixir/aquaChemistry';
import { store } from '../state/store';

@customElement('aqua-chemistry-lab')
export class ChemistryLab extends AquaElement {
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
      color: #a78bfa;
    }
    .head p {
      font-size: 12.5px;
      color: var(--aqa-ink-dim);
      max-width: 64ch;
      margin-top: 5px;
    }
    .head .grow {
      flex: 1;
    }
    .grid2 {
      display: grid;
      grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
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
    .lsi-hero {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 16px;
      align-items: center;
    }
    @media (max-width: 620px) {
      .lsi-hero {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
      }
    }
    .spectrum {
      position: relative;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(90deg, #ef4444 0%, #f59e0b 22%, #10b981 50%, #8b5cf6 78%, #6366f1 100%);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
      margin: 14px 0 6px;
    }
    .spectrum .needle {
      position: absolute;
      top: -7px;
      bottom: -7px;
      width: 3px;
      border-radius: 3px;
      background: #ffffff;
      box-shadow: 0 0 14px 1px rgba(255, 255, 255, 0.9);
      transform: translateX(-50%);
      transition: left 300ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .spectrum .needle::after {
      content: '';
      position: absolute;
      left: 50%;
      top: -5px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #fff;
      transform: translateX(-50%);
      box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.75);
    }
    .spectrum-labels {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
      font-family: var(--aqa-mono);
    }
    .bignum {
      font-family: var(--aqa-mono);
      font-size: 40px;
      font-weight: 720;
      letter-spacing: -0.05em;
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
    .ki {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
      gap: 8px;
      margin-top: 12px;
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
    .riskbar {
      height: 9px;
      border-radius: 99px;
      background: color-mix(in oklab, var(--aqa-ink) 10%, transparent);
      overflow: hidden;
      margin-top: 8px;
    }
    .riskbar i {
      display: block;
      height: 100%;
      border-radius: inherit;
      transition: width 340ms cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: 0 0 14px -2px currentColor;
    }
    .verdict {
      display: flex;
      gap: 11px;
      align-items: flex-start;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid;
      margin-top: 12px;
      line-height: 1.5;
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
      margin-bottom: 3px;
    }
    .verdict p {
      font-size: 11.5px;
      color: var(--aqa-ink-dim);
    }
    .recipe {
      padding: 12px 14px;
      border-radius: 14px;
      background: color-mix(in oklab, var(--aqa-primary) 8%, transparent);
      border: 1px dashed color-mix(in oklab, var(--aqa-primary) 40%, transparent);
      font-size: 11.5px;
      line-height: 1.55;
      color: var(--aqa-ink-dim);
      margin-top: 10px;
    }
    .recipe b {
      color: var(--aqa-ink);
    }
    .tabs {
      display: inline-flex;
      padding: 3px;
      gap: 2px;
      border-radius: 999px;
      background: var(--aqa-glass-fill);
      border: 1px solid var(--aqa-glass-border);
    }
    .tabs button {
      border: 0;
      background: transparent;
      color: var(--aqa-ink-faint);
      font-size: 11px;
      font-weight: 650;
      padding: 7px 13px;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .tabs button[aria-pressed='true'] {
      color: var(--aqa-ink);
      background: color-mix(in oklab, #8b5cf6 30%, transparent);
    }
    .tabs button:active {
      transform: scale(0.95);
    }
    .sca {
      display: grid;
      gap: 8px;
      margin-top: 10px;
    }
    .sca-row {
      display: grid;
      grid-template-columns: 108px 1fr 64px;
      gap: 9px;
      align-items: center;
      font-size: 11px;
    }
    .sca-row .bar {
      height: 7px;
      border-radius: 99px;
      background: color-mix(in oklab, var(--aqa-ink) 9%, transparent);
      overflow: hidden;
      position: relative;
    }
    .sca-row .bar i {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: 99px;
      background: var(--aqa-primary);
      box-shadow: 0 0 10px -2px var(--aqa-primary);
    }
    .sca-row .bar .band {
      position: absolute;
      top: 0;
      bottom: 0;
      background: color-mix(in oklab, var(--aqa-ok) 30%, transparent);
      border-left: 1px solid color-mix(in oklab, var(--aqa-ok) 70%, transparent);
      border-right: 1px solid color-mix(in oklab, var(--aqa-ok) 70%, transparent);
    }
    .sca-row b {
      font-family: var(--aqa-mono);
      font-size: 11px;
      text-align: right;
    }
    .sca-row b.low,
    .sca-row b.high {
      color: var(--aqa-warn);
    }
    .grade {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      padding: 11px 13px;
      border-radius: 14px;
      border: 1px solid var(--aqa-hairline);
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
    }
    .grade .score {
      font-family: var(--aqa-mono);
      font-size: 27px;
      font-weight: 700;
      letter-spacing: -0.04em;
    }
    .grade small {
      display: block;
      font-size: 9.5px;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
    }
    .ammonia-ring {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    ul.advice {
      margin: 8px 0 0;
      padding-left: 17px;
      font-size: 11.5px;
      color: var(--aqa-ink-dim);
      line-height: 1.6;
    }
    ul.advice li {
      margin-bottom: 4px;
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
      border-left: 2px solid color-mix(in oklab, #8b5cf6 65%, transparent);
      overflow-x: auto;
      margin-top: 12px;
    }
    .formula b {
      color: #a78bfa;
      font-weight: 600;
    }
    .gate {
      display: grid;
      gap: 10px;
      place-items: center;
      text-align: center;
      padding: 34px 18px;
    }
    .gate aqua-icon {
      color: #a78bfa;
    }
    .gate p {
      font-size: 12px;
      color: var(--aqa-ink-dim);
      max-width: 46ch;
    }
  `;

  @state() private ph = 7.4;
  @state() private tempC = 20;
  @state() private tds = 180;
  @state() private hardness = 120;
  @state() private alkalinity = 65;
  @state() private tab: 'lsi' | 'sca' | 'ammonia' = 'lsi';
  @state() private ammoniaTotal = 0.25;
  @state() private ammoniaPh = 8.1;
  @state() private ammoniaTemp = 26;

  private stateCtl = consumeState(this, (s) => ({ scan: s.scan, role: s.role }));

  connectedCallback(): void {
    super.connectedCallback();
    this.applyScan();
  }

  private applyScan(): void {
    const scan = this.stateCtl.value.scan;
    if (!scan) return;
    this.ph = scan.pads.ph;
    this.alkalinity = scan.pads.alkalinity;
    this.hardness = scan.pads.hardness;
    this.tds = scan.pads.hardness * 1.4 + 40;
    this.ammoniaPh = Math.min(9, Math.max(6, scan.pads.ph + 0.6));
  }

  protected updated(): void {
    // First render after a scan change pulls the strip values in.
    const scan = this.stateCtl.value.scan;
    if (scan && this.lastSynced !== scan.id) {
      this.lastSynced = scan.id;
      this.applyScan();
    }
  }
  private lastSynced: string | null = null;

  private get report(): StabilityReport {
    return assess(this.ph, this.tempC, this.tds, this.hardness, this.alkalinity);
  }

  private get ammonia() {
    return ammoniaRisk(this.ammoniaTotal, this.ammoniaPh, this.ammoniaTemp);
  }

  private get sca() {
    return scaScore({
      ph: this.ph,
      tds: this.tds,
      alkalinity: this.alkalinity,
      hardness: this.hardness,
      sodium: Math.max(2, this.tds * 0.04),
      chloride: Math.max(4, this.tds * 0.08),
    });
  }

  private tone(r: StabilityReport): 'ok' | 'warn' | 'bad' {
    if (r.regime === 'balanced') return 'ok';
    return r.severity === 'critical' || r.severity === 'high' ? 'bad' : 'warn';
  }

  private recipeText(r: DescaleRecipe): string {
    return `${r.plan}${r.citricGPerL ? ` · ${r.citricGPerL} g/L citric acid · ${r.minutes} min` : ''}`;
  }

  private gate() {
    return this.hasRole('specialist')
      ? null
      : html`
          <aqua-card accent>
            <div class="gate">
              <aqua-icon name="lock" size="30"></aqua-icon>
              <h3 style="font-size:16px">Water Quality Specialist tier</h3>
              <p>
                The Langelier/Ryznar pipe-corrosion lab, SCA espresso architect and unionized ammonia calculator are
                Pro instruments. Your current tier is ${this.stateCtl.value.role === 'household' ? 'Household & Hiker' : 'Director'}.
              </p>
              <button
                class="tabs"
                style="border:0"
                @click=${() =>
                  store.update((s) => {
                    s.privilegesOpen = true;
                  })}
              >
                <span style="padding:7px 14px;font-size:11.5px;font-weight:650;display:inline-flex;gap:6px;align-items:center">
                  <aqua-icon name="key" size="13"></aqua-icon> Unlock in privileges drawer
                </span>
              </button>
            </div>
          </aqua-card>
        `;
  }

  private renderLsi() {
    const r = this.report;
    const tone = this.tone(r);
    const needlePct = Math.max(0, Math.min(100, ((r.lsi + 2) / 4) * 100));
    const risk = r.leadCopperRiskPct;
    const riskColor = risk >= 70 ? 'var(--aqa-bad)' : risk >= 40 ? 'var(--aqa-warn)' : 'var(--aqa-ok)';

    return html`
      <div class="grid2">
        <div class="stack">
          <aqua-card accent>
            <div class="section-title">Water chemistry inputs</div>
            <div class="knobs">
              <aqua-slider label="pH" unit="SU" .value=${this.ph} min="5" max="9.5" step="0.05" decimals="2"
                @slider-input=${(e: CustomEvent) => (this.ph = e.detail.value)}></aqua-slider>
              <aqua-slider label="Water temperature" unit="°C" .value=${this.tempC} min="1" max="95" step="1" decimals="0"
                @slider-input=${(e: CustomEvent) => (this.tempC = e.detail.value)}></aqua-slider>
              <aqua-slider label="Total dissolved solids" unit="ppm" .value=${this.tds} min="20" max="1500" step="5" decimals="0"
                @slider-input=${(e: CustomEvent) => (this.tds = e.detail.value)}></aqua-slider>
              <aqua-slider label="Calcium hardness" unit="ppm CaCO₃" .value=${this.hardness} min="5" max="800" step="5" decimals="0"
                @slider-input=${(e: CustomEvent) => (this.hardness = e.detail.value)}></aqua-slider>
              <aqua-slider label="Total alkalinity" unit="ppm CaCO₃" .value=${this.alkalinity} min="5" max="500" step="5" decimals="0"
                @slider-input=${(e: CustomEvent) => (this.alkalinity = e.detail.value)}></aqua-slider>
            </div>
            <div class="formula">
              <b>LSI</b> = pH − pH<sub>s</sub> &nbsp;·&nbsp; <b>RSI</b> = 2·pH<sub>s</sub> − pH<br />
              <b>pH<sub>s</sub></b> = (9.3 + A + B) − (C + D) &nbsp;·&nbsp; A=(log₁₀TDS−1)/10 &nbsp; B=−13.12·log₁₀(°C+273)+34.55<br />
              C = log₁₀(Ca) − 0.4 &nbsp;·&nbsp; D = log₁₀(Alk)
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Driving terms — audit the index by hand</div>
            <div class="ki">
              <div><span>A · TDS</span><b>${r.drivingTerms.a.toFixed(3)}</b></div>
              <div><span>B · temp</span><b>${r.drivingTerms.b.toFixed(3)}</b></div>
              <div><span>C · hardness</span><b>${r.drivingTerms.c.toFixed(3)}</b></div>
              <div><span>D · alkalinity</span><b>${r.drivingTerms.d.toFixed(3)}</b></div>
              <div><span>pH<sub>s</sub> result</span><b style="color:#a78bfa">${r.phs.toFixed(3)}</b></div>
            </div>
          </aqua-card>
        </div>

        <div class="stack">
          <aqua-card accent>
            <div class="lsi-hero">
              <aqua-gauge
                .value=${r.lsi}
                min="-3"
                max="3"
                unit="LSI"
                decimals="2"
                bigSize="28px"
                color=${tone === 'bad' ? 'var(--aqa-bad)' : tone === 'warn' ? 'var(--aqa-warn)' : 'var(--aqa-ok)'}
              ></aqua-gauge>
              <div>
                <div class="bignum" style=${`color:${tone === 'bad' ? 'var(--aqa-bad)' : tone === 'warn' ? 'var(--aqa-warn)' : 'var(--aqa-ok)'}`}>
                  ${r.regime === 'corrosive' ? 'CORROSIVE' : r.regime === 'scale' ? 'SCALE-FORMING' : 'BALANCED'}
                </div>
                <div style="font-size:11.5px;color:var(--aqa-ink-dim);margin-top:6px;line-height:1.5">
                  LSI <b class="mono">${r.lsi > 0 ? '+' : ''}${r.lsi.toFixed(2)}</b> · RSI <b class="mono">${r.rsi.toFixed(2)}</b>
                  ${r.regime === 'corrosive' ? ' — water dissolves the CaCO₃ passivation film.' : r.regime === 'scale' ? ' — CaCO₃ precipitates on hot surfaces.' : ' — neither dissolves nor precipitates scale.'}
                </div>
              </div>
            </div>

            <div class="spectrum">
              <div class="needle" style=${`left:${needlePct}%`}></div>
            </div>
            <div class="spectrum-labels">
              <span>−2.0 corrosive</span><span>−0.5</span><span>0.0 equilibrium</span><span>+0.5</span><span>+2.0 scale</span>
            </div>

            <div class="verdict ${tone}">
              <aqua-icon name=${tone === 'ok' ? 'check' : 'alert'} size="19"></aqua-icon>
              <div>
                <strong>${r.verdict === 'optimal' ? 'Pipe-stable water' : r.verdict === 'acceptable' ? 'Within tolerance' : 'Action required'}</strong>
                <p>
                  ${r.regime === 'corrosive'
                    ? 'Water is under-saturated in calcium carbonate. Lead solder, brass fittings and copper pipe walls are actively dissolving into the drinking water.'
                    : r.regime === 'scale'
                      ? 'Water is super-saturated. Calcium carbonate will crystallise on heating elements, reducing thermal efficiency and flow.'
                      : 'The CaCO₃ film is stable: metals stay passivated and no scale crystallises.'}
                </p>
              </div>
            </div>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Plumbosolvency — lead & copper risk</div>
            <div style="display:flex;align-items:baseline;gap:8px">
              <span class="bignum" style=${`color:${riskColor}`}>${risk.toFixed(0)}<small>%</small></span>
              <aqua-badge tone=${risk >= 70 ? 'bad' : risk >= 40 ? 'warn' : 'ok'}>${r.leadCopperClass}</aqua-badge>
            </div>
            <div class="riskbar"><i style=${`width:${risk}%;background:${riskColor};color:${riskColor}`}></i></div>
            <p style="font-size:11.5px;color:var(--aqa-ink-dim);margin-top:10px;line-height:1.55">${r.remediation}</p>
          </aqua-card>

          <aqua-card>
            <div class="section-title">Appliance limescale lifecycle</div>
            <div class="ki">
              <div><span>Scale growth</span><b style="color:${r.scaleMmPerYear > 0.5 ? 'var(--aqa-warn)' : 'var(--aqa-ink)'}">${r.scaleMmPerYear.toFixed(2)}</b><span>mm / year @ 65 °C</span></div>
              <div><span>Class</span><b>${r.scaleClass}</b></div>
              <div><span>Heater lifespan</span><b>${r.applianceLifespanYears.toFixed(1)}</b><span>years</span></div>
            </div>
            <div class="recipe">
              <b>${r.descaleRecipe.urgency.toUpperCase()}</b> — ${this.recipeText(r.descaleRecipe)}
            </div>
          </aqua-card>
        </div>
      </div>
    `;
  }

  private renderSca() {
    const s = this.sca;
    const rows = [
      { key: 'pH', val: this.ph, lo: 6.5, hi: 7.5, min: 5.5, max: 8.5, dec: 2 },
      { key: 'TDS', val: this.tds, lo: 75, hi: 250, min: 0, max: 500, dec: 0 },
      { key: 'Alkalinity', val: this.alkalinity, lo: 40, hi: 70, min: 0, max: 200, dec: 0 },
      { key: 'Hardness', val: this.hardness, lo: 50, hi: 175, min: 0, max: 400, dec: 0 },
    ];
    return html`
      <div class="grid2">
        <aqua-card accent>
          <div class="section-title">SCA target matrix — specialty coffee water</div>
          <div class="sca">
            ${rows.map((row) => {
              const pct = (v: number) => Math.max(0, Math.min(100, ((v - row.min) / (row.max - row.min)) * 100));
              const state = row.val < row.lo ? 'low' : row.val > row.hi ? 'high' : 'ok';
              return html`
                <div class="sca-row">
                  <span>${row.key}</span>
                  <span class="bar">
                    <i class="band" style=${`left:${pct(row.lo)}%;width:${pct(row.hi) - pct(row.lo)}%`}></i>
                    <i style=${`left:${pct(row.val)}%;width:3px;transform:translateX(-1.5px)`}></i>
                  </span>
                  <b class=${state}>${row.val.toFixed(row.dec)}</b>
                </div>
              `;
            })}
          </div>
          <div class="grade">
            <span class="score" style=${`color:${s.score >= 75 ? 'var(--aqa-ok)' : s.score >= 40 ? 'var(--aqa-warn)' : 'var(--aqa-bad)'}`}>${s.score}</span>
            <div>
              <small>SCA score / 100</small>
              <strong style="text-transform:uppercase;letter-spacing:0.08em;font-size:11px">${s.grade.replace('_', ' ')}</strong>
            </div>
          </div>
        </aqua-card>

        <aqua-card>
          <div class="section-title">Barista corrections</div>
          ${s.advice.length === 0
            ? html`<p style="font-size:12px;color:var(--aqa-ok)">Every parameter sits inside the SCA window — this is Gold Cup water. Protect it with a 5 µm carbon block only.</p>`
            : html`<ul class="advice">
                ${s.advice.map((a) => html`<li>${a}</li>`)}
              </ul>`}
          <div class="formula">
            <b>SCA band</b>: pH 6.5–7.5 · TDS 75–250 · alkalinity 40–70 · hardness 50–175 · Na ≤ 10 · Cl ≤ 30 mg/L
          </div>
          <div class="recipe">
            <b>Why alkalinity dominates</b> — bicarbonate scavenges the acids that carry fruit acidity. Above 70 ppm
            espresso goes flat and chalky; below 40 ppm it turns sharp and hollow. Hardness mostly protects the boiler,
            but above 175 ppm it scales the element within a season.
          </div>
        </aqua-card>
      </div>
    `;
  }

  private renderAmmonia() {
    const a = this.ammonia;
    const bandTone = a.band === 'safe' ? 'ok' : a.band === 'caution' ? 'warn' : 'bad';
    return html`
      <div class="grid2">
        <aqua-card accent>
          <div class="section-title">Unionized ammonia (NH₃) toxicity</div>
          <div class="knobs">
            <aqua-slider label="Total ammonia nitrogen" unit="mg/L NH₃-N" .value=${this.ammoniaTotal} min="0" max="5" step="0.01" decimals="2"
              @slider-input=${(e: CustomEvent) => (this.ammoniaTotal = e.detail.value)}></aqua-slider>
            <aqua-slider label="Aquarium pH" unit="SU" .value=${this.ammoniaPh} min="6" max="9.5" step="0.05" decimals="2"
              @slider-input=${(e: CustomEvent) => (this.ammoniaPh = e.detail.value)}></aqua-slider>
            <aqua-slider label="Aquarium temperature" unit="°C" .value=${this.ammoniaTemp} min="15" max="32" step="0.5" decimals="1"
              @slider-input=${(e: CustomEvent) => (this.ammoniaTemp = e.detail.value)}></aqua-slider>
          </div>
          <div class="formula">
            <b>f</b> = 1 / (1 + 10<sup>pKa − pH</sup>) &nbsp;·&nbsp; pKa = 9.25 − 0.018·(T − 25)<br />
            <b>NH₃-N</b> = total-N × f
          </div>
        </aqua-card>

        <aqua-card>
          <div class="section-title">Free toxic fraction</div>
          <div class="ammonia-ring">
            <aqua-gauge .value=${a.freeNh3} min="0" max="0.6" unit="mg/L NH₃" decimals="3" bigSize="24px"
              color=${bandTone === 'bad' ? 'var(--aqa-bad)' : bandTone === 'warn' ? 'var(--aqa-warn)' : 'var(--aqa-ok)'}></aqua-gauge>
            <div style="flex:1;min-width:160px">
              <aqua-badge tone=${bandTone}>${a.band}</aqua-badge>
              <div class="ki" style="margin-top:10px">
                <div><span>Unionized fraction</span><b>${(a.fraction * 100).toFixed(2)}%</b></div>
                <div><span>Water change</span><b>${a.waterChangePct === 0 ? 'none' : `${a.waterChangePct.toFixed(0)}%`}</b></div>
              </div>
            </div>
          </div>
          <div class="verdict ${bandTone}">
            <aqua-icon name=${bandTone === 'ok' ? 'check' : 'alert'} size="18"></aqua-icon>
            <div>
              <strong>${a.band} zone</strong>
              <p>${a.advice}</p>
            </div>
          </div>
        </aqua-card>
      </div>
    `;
  }

  render() {
    const gate = this.gate();
    if (gate) {
      return html`
        <div class="head">
          <div>
            <h2>Elixir <span>LSI</span> Corrosion & Chemistry Lab</h2>
            <p>Langelier & Ryznar indices, plumbosolvency scoring, scale projection, SCA coffee targets, NH₃ toxicity.</p>
          </div>
        </div>
        ${gate}
      `;
    }
    return html`
      <div class="head">
        <div>
          <h2>Elixir <span>LSI</span> Corrosion & Chemistry Lab</h2>
          <p>
            Langelier saturation chemistry, plumbosolvency lead/copper scoring, appliance limescale projection, the SCA
            espresso matrix and unionized ammonia toxicity — all mirrored line-for-line from the Elixir module.
          </p>
        </div>
        <div class="grow"></div>
        <div class="tabs" role="tablist">
          <button aria-pressed=${this.tab === 'lsi'} @click=${() => (this.tab = 'lsi')}><aqua-icon name="flask" size="12"></aqua-icon> LSI / RSI</button>
          <button aria-pressed=${this.tab === 'sca'} @click=${() => (this.tab = 'sca')}><aqua-icon name="beaker" size="12"></aqua-icon> SCA Coffee</button>
          <button aria-pressed=${this.tab === 'ammonia'} @click=${() => (this.tab = 'ammonia')}><aqua-icon name="activity" size="12"></aqua-icon> NH₃</button>
        </div>
      </div>
      ${this.tab === 'lsi' ? this.renderLsi() : this.tab === 'sca' ? this.renderSca() : this.renderAmmonia()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-chemistry-lab': ChemistryLab;
  }
}
