/**
 * AQUA-SPECTRA — <aqua-certificate-modal>
 * The hydro-chemical certificate: the shared-element destination for any
 * scan card. Merges optics, chemistry, Datalog, purification and the five-
 * language source vault into one printable record.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ModalBase } from './modal-base';
import { consumeState } from './base';
import { evaluate, parseProgram } from '../logic/datalog';
import DATALOG_SOURCE from '../rules/water_contaminants.dl?raw';
import { PAD_CHARTS, PAD_ORDER } from '../optics/colorScience';
import { SAMPLES } from '../data/samples';
import { boilingPoint } from '../elixir/aquaChemistry';
import { store } from '../state/store';

@customElement('aqua-certificate-modal')
export class CertificateModal extends ModalBase {
  static styles = [
    ModalBase.modalStyles,
    css`
      .cert {
        position: relative;
        border-radius: 20px;
        border: 1px solid var(--aqa-glass-border);
        background: linear-gradient(160deg, color-mix(in oklab, var(--aqa-primary) 8%, transparent), transparent 60%);
        padding: 18px;
      }
      .cert-head {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--aqa-hairline);
        padding-bottom: 14px;
        margin-bottom: 14px;
      }
      .cert-head h3 {
        font-size: 17px;
        letter-spacing: -0.01em;
      }
      .cert-head p {
        font-size: 10.5px;
        font-family: var(--aqa-mono);
        color: var(--aqa-ink-faint);
        margin-top: 3px;
        word-break: break-all;
      }
      .cert-head .grow {
        flex: 1;
      }
      .seal {
        display: grid;
        place-items: center;
        width: 78px;
        height: 78px;
        border-radius: 50%;
        border: 2px solid;
        text-align: center;
        flex: none;
      }
      .seal b {
        font-size: 11px;
        letter-spacing: 0.08em;
      }
      .seal span {
        font-size: 7.5px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        opacity: 0.75;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .table th {
        text-align: left;
        font-size: 8.6px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--aqa-ink-faint);
        padding: 6px 8px;
        border-bottom: 1px solid var(--aqa-hairline);
      }
      .table td {
        padding: 6px 8px;
        border-bottom: 1px solid color-mix(in oklab, var(--aqa-ink) 5%, transparent);
        color: var(--aqa-ink-dim);
      }
      .table td:first-child {
        font-weight: 620;
        color: var(--aqa-ink);
      }
      .table td.mono {
        font-family: var(--aqa-mono);
      }
      .hazards {
        display: grid;
        gap: 6px;
        margin-top: 10px;
      }
      .hz {
        display: flex;
        gap: 9px;
        align-items: center;
        padding: 8px 11px;
        border-radius: 10px;
        border: 1px solid;
        font-size: 11px;
      }
      .hz.CRITICAL {
        border-color: color-mix(in oklab, var(--aqa-bad) 50%, transparent);
        background: color-mix(in oklab, var(--aqa-bad) 10%, transparent);
      }
      .hz.HIGH {
        border-color: color-mix(in oklab, #f97316 46%, transparent);
        background: color-mix(in oklab, #f97316 9%, transparent);
      }
      .hz.MODERATE {
        border-color: color-mix(in oklab, var(--aqa-warn) 40%, transparent);
        background: color-mix(in oklab, var(--aqa-warn) 8%, transparent);
      }
      .hz.LOW {
        border-color: var(--aqa-hairline);
      }
      .section-title {
        font-size: 9.5px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--aqa-ink-faint);
        font-weight: 700;
        margin: 18px 0 8px;
      }
      .src-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 8px;
      }
      .src {
        padding: 10px 12px;
        border-radius: 11px;
        background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
        border: 1px solid var(--aqa-hairline);
      }
      .src b {
        display: block;
        font-size: 11px;
        font-family: var(--aqa-mono);
      }
      .src span {
        font-size: 9px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--aqa-ink-faint);
      }
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 16px;
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
        border-color: color-mix(in oklab, var(--aqa-primary) 55%, transparent);
        transform: translateY(-1px);
      }
      .btn:active {
        transform: scale(0.96);
      }
      .btn.primary {
        background: linear-gradient(120deg, color-mix(in oklab, var(--aqa-primary) 40%, transparent), color-mix(in oklab, var(--aqa-accent) 28%, transparent));
        border-color: color-mix(in oklab, var(--aqa-primary) 60%, transparent);
      }
      .hash {
        margin-top: 14px;
        font-family: var(--aqa-mono);
        font-size: 9.5px;
        color: var(--aqa-ink-faint);
        word-break: break-all;
        line-height: 1.6;
      }
      .watermark {
        position: absolute;
        right: 16px;
        bottom: 12px;
        font-size: 8px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--aqa-ink-faint);
        opacity: 0.5;
        pointer-events: none;
      }
    `,
  ];

  @state() private hazards: { label: string; severity: string }[] = [];
  @state() private actions: string[] = [];
  @state() private sealLevel = 'PASS';

  private stateCtl = consumeState(this, (s) => ({ open: s.certificateOpen, scan: s.scan, palette: s.palette }));

  protected modalTitle() {
    return 'Hydro-Chemical Certificate';
  }
  protected subtitle() {
    return 'A complete, portable record of every measurement and inference for this water sample.';
  }

  protected updated(changed: Map<string, unknown>): void {
    if (this.open !== this.stateCtl.value.open) this.open = this.stateCtl.value.open;
    super.updated(changed);
    if (changed.has('open')) {
      if (this.open) this.compute();
      else
        store.update((s) => {
          s.certificateOpen = false;
        });
    }
  }

  private compute(): void {
    const scan = this.stateCtl.value.scan;
    if (!scan) return;
    const facts = [
      `fact reading("${scan.sampleId}", ntu, ${scan.ntu}).`,
      `fact reading("${scan.sampleId}", ph, ${scan.pads.ph}).`,
      `fact reading("${scan.sampleId}", lsi, ${scan.stability.lsi}).`,
      `fact reading("${scan.sampleId}", chlorine, ${scan.pads.chlorine}).`,
      `fact reading("${scan.sampleId}", nitrate, ${scan.pads.nitrate}).`,
      `fact derived("${scan.sampleId}", hardness, ${scan.pads.hardness}).`,
      `fact derived("${scan.sampleId}", alkalinity, ${scan.pads.alkalinity}).`,
      `fact derived("${scan.sampleId}", tds, ${Math.round(scan.pads.hardness * 1.4 + 40)}).`,
      `fact derived("${scan.sampleId}", ec, ${(Math.round(scan.pads.hardness * 1.4 + 40) / 0.55).toFixed(1)}).`,
    ];
    const meta = SAMPLES.find((s) => s.id === scan.sampleId);
    if (meta) {
      facts.push(`fact source("${scan.sampleId}", "${meta.source}").`);
      facts.push(`fact plumbing("${scan.sampleId}", "${meta.plumbing}").`);
      for (const h of meta.hardware) if (h !== 'none') facts.push(`fact hardware("${scan.sampleId}", "${h}").`);
    }
    const result = evaluate(parseProgram(`${facts.join('\n')}\n\n${DATALOG_SOURCE}`));
    this.hazards = result.hazards.map((h) => ({ label: h.label, severity: h.severity }));
    this.actions = result.actions.map((a) => a.action);
    this.sealLevel = result.seals[0]?.level ?? 'PASS';
  }

  private sealColor(): string {
    return this.sealLevel === 'CRITICAL'
      ? 'var(--aqa-bad)'
      : this.sealLevel === 'HIGH'
        ? '#f97316'
        : this.sealLevel === 'MODERATE'
          ? 'var(--aqa-warn)'
          : 'var(--aqa-ok)';
  }

  private printCert(): void {
    window.print();
  }

  private exportJson(): void {
    const scan = this.stateCtl.value.scan;
    if (!scan) return;
    const boil = boilingPoint(0);
    const payload = {
      certificate: {
        issuedAt: new Date().toISOString(),
        instrument: 'AQUA-SPECTRA v1.0.0',
        seal: this.sealLevel,
        hazards: this.hazards,
        actions: this.actions,
      },
      scan,
      chemistry: {
        lsi: scan.stability.lsi,
        rsi: scan.stability.rsi,
        regime: scan.stability.regime,
        leadCopperRiskPct: scan.stability.leadCopperRiskPct,
        scaleMmPerYear: scan.stability.scaleMmPerYear,
      },
      reference: { boilingPointSeaLevelC: boil.boilingC },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquaspectra-certificate-${scan.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 6000);
    this.toast('Certificate exported as JSON.', 'ok');
  }

  protected body() {
    const scan = this.stateCtl.value.scan;
    if (!scan) return html`<p style="font-size:12px;color:var(--aqa-ink-faint)">No sample loaded yet — run an optical scan first.</p>`;
    const meta = SAMPLES.find((s) => s.id === scan.sampleId);
    const color = this.sealColor();
    const padRows = PAD_ORDER.map((k) => ({ key: k, chart: PAD_CHARTS[k], value: scan.pads[k] }));

    return html`
      <div class="cert">
        <div class="cert-head">
          <div class="grow">
            <h3>${meta?.name ?? 'Water sample'}</h3>
            <p>
              ${scan.id} · ${new Date(scan.createdAt).toISOString()} · method ${scan.method} · source ${meta?.source ?? 'manual'}
            </p>
          </div>
          <div class="seal" style=${`border-color:${color};color:${color}`}>
            <div style="display:grid;place-items:center">
              <b>${this.sealLevel}</b>
              <span>seal</span>
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr><th>measurement</th><th>value</th><th>unit</th><th>standard</th></tr>
          </thead>
          <tbody>
            <tr><td>Turbidity</td><td class="mono">${scan.ntu.toFixed(2)}</td><td>NTU</td><td>EPA ≤ 1.0 ideal</td></tr>
            <tr><td>Total suspended solids</td><td class="mono">${scan.tss.toFixed(2)}</td><td>mg/L</td><td>EPA 160.2</td></tr>
            <tr><td>Langelier index</td><td class="mono">${scan.stability.lsi > 0 ? '+' : ''}${scan.stability.lsi.toFixed(2)}</td><td>LSI</td><td>−0.2…+0.2 balanced</td></tr>
            <tr><td>Ryznar index</td><td class="mono">${scan.stability.rsi.toFixed(2)}</td><td>RSI</td><td>6.5–7.0 balanced</td></tr>
            <tr><td>Lead/copper risk</td><td class="mono">${scan.stability.leadCopperRiskPct.toFixed(0)}</td><td>%</td><td>NSF/ANSI 53</td></tr>
            ${padRows.map(
              (r) => html`<tr><td>${r.chart.name}</td><td class="mono">${r.value.toFixed(r.chart.decimals)}</td><td>${r.chart.unit}</td><td>${r.chart.description.split('.')[0]}</td></tr>`,
            )}
            <tr><td>Health score</td><td class="mono">${scan.healthScore}</td><td>/100</td><td>AQUA-SPECTRA composite</td></tr>
          </tbody>
        </table>

        <div class="section-title">Datalog inferred hazards</div>
        ${this.hazards.length
          ? html`<div class="hazards">
              ${this.hazards.map((h) => html`<div class="hz ${h.severity}"><aqua-badge tone=${h.severity === 'CRITICAL' ? 'bad' : 'warn'}>${h.severity}</aqua-badge> ${h.label}</div>`)}
            </div>`
          : html`<p style="font-size:11.5px;color:var(--aqa-ok)">No hazard predicates fired — the sample satisfies every rule in the knowledge base.</p>`}

        ${this.actions.length
          ? html`
              <div class="section-title">Recommended actions</div>
              <div class="hazards">
                ${this.actions.map((a) => html`<div class="hz LOW"><aqua-icon name="chevron" size="12"></aqua-icon>${a}</div>`)}
              </div>
            `
          : null}

        <div class="section-title">Five-language provenance</div>
        <div class="src-grid">
          <div class="src"><span>optics</span><b>nephelometry_dsp.ts</b></div>
          <div class="src"><span>chemistry</span><b>aqua_chemistry.ex</b></div>
          <div class="src"><span>logic</span><b>water_contaminants.dl</b></div>
          <div class="src"><span>render</span><b>caustic_refraction.glsl</b></div>
          <div class="src"><span>ui</span><b>Lit 3.2 elements</b></div>
        </div>

        <div class="actions">
          <button class="btn primary" @click=${() => this.printCert()}><aqua-icon name="shield" size="14"></aqua-icon> Print / save PDF</button>
          <button class="btn" @click=${() => this.exportJson()}><aqua-icon name="download" size="14"></aqua-icon> Export JSON</button>
          <button
            class="btn"
            @click=${() =>
              store.update((s) => {
                s.inspectorOpen = true;
              })}
          >
            <aqua-icon name="code" size="14"></aqua-icon> Open polyglot inspector
          </button>
        </div>

        <div class="hash">
          certificate hash · ${scan.id}-${scan.stability.lsi.toFixed(3)}-${scan.pads.ph.toFixed(2)}-${this.sealLevel}<br />
          data source: ${meta?.scenario ?? 'manual entry'} · plumbing ${meta?.plumbing ?? 'unknown'} · generated by AQUA-SPECTRA
        </div>
        <div class="watermark">aqua-spectra · polyglot hydro-optical instrument</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-certificate-modal': CertificateModal;
  }
}
