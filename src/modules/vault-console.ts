/**
 * AQUA-SPECTRA — <aqua-vault-console>
 * Module 5 · Datalog Logic & Polyglot Vault
 *
 * Runs the real declarative rule engine over the live scan, shows the
 * derivation trace line by line, lets the operator edit rules and re-run, and
 * exports EPA-ready CSV/JSON. Director tier only.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement, consumeState } from '../components/base';
import { evaluate, parseProgram, serialize, type EngineResult, type ParseIssue } from '../logic/datalog';
import { store } from '../state/store';
import { SAMPLES } from '../data/samples';
import { saveDatalogRun, listScans, listBatches, drainSyncQueue } from '../db/aquaDb';
import DATALOG_SOURCE from '../rules/water_contaminants.dl?raw';

@customElement('aqua-vault-console')
export class VaultConsole extends AquaElement {
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
      color: #f59e0b;
    }
    .head p {
      font-size: 12.5px;
      color: var(--aqa-ink-dim);
      max-width: 68ch;
      margin-top: 5px;
    }
    .head .grow {
      flex: 1;
    }
    .grid2 {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.06fr);
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 1120px) {
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
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .hazards {
      display: grid;
      gap: 7px;
    }
    .hazard {
      display: flex;
      gap: 11px;
      align-items: flex-start;
      padding: 11px 13px;
      border-radius: 13px;
      border: 1px solid;
      line-height: 1.45;
      animation: hazardIn 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes hazardIn {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
    }
    .hazard.CRITICAL {
      border-color: color-mix(in oklab, var(--aqa-bad) 55%, transparent);
      background: color-mix(in oklab, var(--aqa-bad) 12%, transparent);
    }
    .hazard.HIGH {
      border-color: color-mix(in oklab, #f97316 50%, transparent);
      background: color-mix(in oklab, #f97316 11%, transparent);
    }
    .hazard.MODERATE {
      border-color: color-mix(in oklab, var(--aqa-warn) 42%, transparent);
      background: color-mix(in oklab, var(--aqa-warn) 9%, transparent);
    }
    .hazard.LOW {
      border-color: var(--aqa-hairline);
      background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
    }
    .hazard .sev {
      font-family: var(--aqa-mono);
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.1em;
      padding: 3px 7px;
      border-radius: 6px;
      border: 1px solid currentColor;
      flex: none;
      margin-top: 1px;
    }
    .hazard.CRITICAL .sev {
      color: var(--aqa-bad);
    }
    .hazard.HIGH .sev {
      color: #fb923c;
    }
    .hazard.MODERATE .sev {
      color: var(--aqa-warn);
    }
    .hazard.LOW .sev {
      color: var(--aqa-ink-faint);
    }
    .hazard strong {
      display: block;
      font-size: 12px;
      margin-bottom: 1px;
    }
    .hazard span {
      font-size: 10.5px;
      color: var(--aqa-ink-faint);
      font-family: var(--aqa-mono);
    }
    .actions-list {
      display: grid;
      gap: 6px;
    }
    .action {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 9px 12px;
      border-radius: 11px;
      background: color-mix(in oklab, var(--aqa-primary) 8%, transparent);
      border: 1px solid color-mix(in oklab, var(--aqa-primary) 28%, transparent);
      font-size: 11.5px;
      font-weight: 620;
      letter-spacing: 0.02em;
    }
    .action aqua-icon {
      color: var(--aqa-primary);
      flex: none;
    }
    .editor {
      width: 100%;
      min-height: 290px;
      resize: vertical;
      border-radius: 13px;
      border: 1px solid var(--aqa-hairline);
      background: rgba(2, 8, 16, 0.6);
      color: #c9ecff;
      font-family: var(--aqa-mono);
      font-size: 11px;
      line-height: 1.65;
      padding: 12px 13px;
      tab-size: 2;
    }
    .editor:focus {
      outline: none;
      border-color: color-mix(in oklab, #f59e0b 60%, transparent);
      box-shadow: 0 0 0 3px color-mix(in oklab, #f59e0b 16%, transparent);
    }
    :host([data-theme='glacial']) .editor {
      background: rgba(255, 255, 255, 0.92);
      color: #0b2b3c;
    }
    .console-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 10px;
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
      padding: 8px 12px;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .btn:hover {
      border-color: color-mix(in oklab, #f59e0b 55%, transparent);
      transform: translateY(-1px);
    }
    .btn:active {
      transform: scale(0.96);
    }
    .btn.primary {
      background: linear-gradient(120deg, color-mix(in oklab, #f59e0b 36%, transparent), color-mix(in oklab, #f97316 24%, transparent));
      border-color: color-mix(in oklab, #f59e0b 60%, transparent);
      box-shadow: 0 0 22px -10px rgba(245, 158, 11, 0.7);
    }
    .issues {
      margin-top: 9px;
      display: grid;
      gap: 5px;
    }
    .issue {
      font-family: var(--aqa-mono);
      font-size: 10.5px;
      padding: 6px 9px;
      border-radius: 8px;
      display: flex;
      gap: 7px;
    }
    .issue.error {
      background: color-mix(in oklab, var(--aqa-bad) 14%, transparent);
      color: #fca5a5;
    }
    .issue.warning {
      background: color-mix(in oklab, var(--aqa-warn) 12%, transparent);
      color: #fcd34d;
    }
    .trace {
      max-height: 340px;
      overflow: auto;
      border-radius: 12px;
      border: 1px solid var(--aqa-hairline);
      background: rgba(2, 8, 16, 0.45);
    }
    .trace table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--aqa-mono);
      font-size: 10px;
    }
    .trace th {
      position: sticky;
      top: 0;
      background: color-mix(in oklab, var(--aqa-ink) 8%, var(--aqa-bg));
      text-align: left;
      padding: 7px 9px;
      font-size: 8.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
      border-bottom: 1px solid var(--aqa-hairline);
      z-index: 1;
    }
    .trace td {
      padding: 5px 9px;
      border-bottom: 1px solid color-mix(in oklab, var(--aqa-ink) 5%, transparent);
      vertical-align: top;
      color: var(--aqa-ink-dim);
    }
    .trace tr:hover td {
      background: color-mix(in oklab, var(--aqa-primary) 7%, transparent);
    }
    .trace .rel {
      color: #fbbf24;
    }
    .trace .vals {
      color: var(--aqa-ink);
    }
    .trace .dep {
      color: var(--aqa-ink-faint);
      font-size: 9px;
    }
    .tabs {
      display: inline-flex;
      padding: 3px;
      gap: 2px;
      border-radius: 999px;
      background: var(--aqa-glass-fill);
      border: 1px solid var(--aqa-glass-border);
      flex-wrap: wrap;
    }
    .tabs button {
      border: 0;
      background: transparent;
      color: var(--aqa-ink-faint);
      font-size: 11px;
      font-weight: 650;
      padding: 7px 12px;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
      white-space: nowrap;
    }
    .tabs button[aria-pressed='true'] {
      color: var(--aqa-ink);
      background: color-mix(in oklab, #f59e0b 28%, transparent);
    }
    .tabs button:active {
      transform: scale(0.95);
    }
    .ki {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
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
      font-size: 14px;
      font-weight: 660;
    }
    .ki span {
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
    }
    .gate {
      display: grid;
      gap: 10px;
      place-items: center;
      text-align: center;
      padding: 40px 18px;
    }
    .gate p {
      max-width: 46ch;
      font-size: 12px;
      color: var(--aqa-ink-dim);
    }
    .inline-note {
      font-size: 11px;
      color: var(--aqa-ink-faint);
      line-height: 1.55;
      margin-top: 9px;
    }
    .scroll-x {
      overflow-x: auto;
    }
  `;

  @state() private source = DATALOG_SOURCE;
  @state() private result: EngineResult | null = null;
  @state() private issues: ParseIssue[] = [];
  @state() private tab: 'rules' | 'trace' | 'sync' = 'rules';
  @state() private error = '';

  private stateCtl = consumeState(this, (s) => ({ scan: s.scan, role: s.role, syncQueue: s.syncQueue }));

  connectedCallback(): void {
    super.connectedCallback();
    this.run();
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('source') && !this.lastEdited) this.run();
  }
  private lastEdited = false;

  private buildProgramSource(): string {
    const scan = this.stateCtl.value.scan;
    if (!scan) return this.source;
    // Assert live facts at the head of the program so the engine reasons over
    // the actual measurement, not a demo.
    const facts = [
      `% ── live assertions from scan ${scan.id} @ ${new Date(scan.createdAt).toISOString()}`,
      `fact reading("${scan.sampleId}", ntu, ${scan.ntu}).`,
      `fact reading("${scan.sampleId}", ph, ${scan.pads.ph}).`,
      `fact reading("${scan.sampleId}", lsi, ${scan.stability.lsi}).`,
      `fact reading("${scan.sampleId}", chlorine, ${scan.pads.chlorine}).`,
      `fact reading("${scan.sampleId}", nitrate, ${scan.pads.nitrate}).`,
      `fact reading("${scan.sampleId}", nitrite, ${scan.pads.nitrite}).`,
      `fact reading("${scan.sampleId}", temp, 20).`,
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
    return `${facts.join('\n')}\n\n${this.source}`;
  }

  private run(): void {
    this.error = '';
    try {
      const program = parseProgram(this.buildProgramSource());
      this.issues = program.issues;
      const hard = program.issues.filter((i) => i.severity === 'error');
      if (hard.length) {
        this.error = `${hard.length} parse error${hard.length === 1 ? '' : 's'} — engine kept the last good model.`;
      }
      this.result = evaluate(program);
      const seal = this.result.seals[0]?.level ?? 'PASS';
      void saveDatalogRun({
        createdAt: Date.now(),
        sampleId: this.stateCtl.value.scan?.sampleId ?? 'n/a',
        rules: program.rules.length,
        derived: this.result.derivedCount,
        hazards: this.result.hazards.map((h) => h.label).join(' | '),
        seal,
        elapsedMs: this.result.elapsedMs,
      });
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    }
  }

  private exportCsv(): void {
    void this.doExport('csv');
  }

  private async doExport(kind: 'csv' | 'json'): Promise<void> {
    const scans = await listScans(200);
    const batches = await listBatches(200);
    let payload = '';
    let name = '';
    let mime = '';
    if (kind === 'csv') {
      const rows = [
        'scan_id,sample_id,created_at,method,ntu,tss_mg_l,potability_class,ph,chlorine_ppm,alkalinity_ppm,hardness_ppm,nitrate_ppm,nitrite_ppm,copper_ppm,lsi,rsi,regime,lead_copper_risk_pct,scale_mm_per_year,health_score',
        ...scans.map((s) =>
          [
            s.id,
            s.sampleId,
            new Date(s.createdAt).toISOString(),
            s.method,
            s.ntu.toFixed(2),
            s.tss.toFixed(2),
            s.potability,
            s.pads.ph,
            s.pads.chlorine,
            s.pads.alkalinity,
            s.pads.hardness,
            s.pads.nitrate,
            s.pads.nitrite,
            s.pads.copper,
            s.stability.lsi,
            s.stability.rsi,
            s.stability.regime,
            s.stability.leadCopperRiskPct,
            s.stability.scaleMmPerYear,
            s.healthScore,
          ].join(','),
        ),
      ];
      payload = rows.join('\n');
      name = `aquaspectra-scan-export-${new Date().toISOString().slice(0, 10)}.csv`;
      mime = 'text/csv';
    } else {
      payload = JSON.stringify(
        {
          generator: 'AQUA-SPECTRA v1.0.0',
          exportedAt: new Date().toISOString(),
          scans,
          purificationBatches: batches,
          datalog: this.result
            ? {
                iterations: this.result.iterations,
                derivedCount: this.result.derivedCount,
                elapsedMs: this.result.elapsedMs,
                hazards: this.result.hazards,
                seals: this.result.seals,
                model: serialize(this.result),
              }
            : null,
        },
        null,
        2,
      );
      name = `aquaspectra-lab-export-${new Date().toISOString().slice(0, 10)}.json`;
      mime = 'application/json';
    }
    const blob = new Blob([payload], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    this.toast(`${kind.toUpperCase()} export · ${scans.length} scans + ${batches.length} batches`, 'ok');
  }

  private renderRules() {
    return html`
      <div class="stack">
        <aqua-card accent>
          <div class="section-title">
            <span>water_contaminants.dl</span>
            <aqua-badge tone="warn">Datalog · stratified fixpoint</aqua-badge>
          </div>
          <textarea
            class="editor"
            spellcheck="false"
            aria-label="Datalog rule source"
            .value=${this.source}
            @input=${(e: Event) => {
              this.source = (e.target as HTMLTextAreaElement).value;
              this.lastEdited = true;
            }}
            @keydown=${(e: KeyboardEvent) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                this.lastEdited = false;
                this.run();
              }
            }}
          ></textarea>
          <div class="console-actions">
            <button
              class="btn primary"
              @click=${() => {
                this.lastEdited = false;
                this.run();
              }}
            >
              <aqua-icon name="activity" size="14"></aqua-icon> Run fixpoint (⌘↵)
            </button>
            <button
              class="btn"
              @click=${() => {
                this.source = DATALOG_SOURCE;
                this.lastEdited = false;
                this.run();
              }}
            >
              <aqua-icon name="refresh" size="14"></aqua-icon> Restore 55-rule KB
            </button>
            <button class="btn" @click=${() => void navigator.clipboard?.writeText(this.buildProgramSource())}>
              <aqua-icon name="copy" size="14"></aqua-icon> Copy assertions
            </button>
          </div>
          ${this.error ? html`<div class="issues"><div class="issue error">✕ ${this.error}</div></div>` : null}
          ${this.issues.length
            ? html`<div class="issues">
                ${this.issues.slice(0, 6).map(
                  (i) => html`<div class="issue ${i.severity}">${i.severity === 'error' ? '✕' : '!'} line ${i.line}: ${i.message}</div>`,
                )}
              </div>`
            : null}
          <p class="inline-note">
            The engine tokenises this program, stratifies negation, then iterates semi-naive joins to a fixpoint.
            Live facts from your current scan are asserted above your rules before every run — edit a threshold and
            watch the hazard cascade change immediately.
          </p>
        </aqua-card>
      </div>
    `;
  }

  private renderTrace() {
    const r = this.result;
    if (!r) return html`<aqua-card><p>No model yet.</p></aqua-card>`;
    return html`
      <aqua-card accent>
        <div class="section-title">
          <span>Derivation trace · ${r.steps.length} inferences</span>
          <span class="mono" style="font-size:10px;color:var(--aqa-ink-faint)">${r.iterations} iterations · ${r.elapsedMs} ms</span>
        </div>
        <div class="trace">
          <table>
            <thead>
              <tr><th>relation</th><th>values</th><th>rule</th></tr>
            </thead>
            <tbody>
              ${r.steps.map(
                (s) => html`
                  <tr>
                    <td class="rel">${s.rel}</td>
                    <td class="vals">${s.values.map((v) => (typeof v === 'number' ? v : `"${v}"`)).join(', ')}</td>
                    <td class="dep">${s.rule}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </aqua-card>
    `;
  }

  private renderSync() {
    return html`
      <aqua-card accent>
        <div class="section-title">IndexedDB vault & EPA export</div>
        <div class="ki">
          <div><span>Scans stored</span><b>${this.stateCtl.value.scan ? 'live' : '0'}</b><span>this session</span></div>
          <div><span>Queue depth</span><b>${this.stateCtl.value.syncQueue}</b><span>unsynced records</span></div>
          <div><span>DB engine</span><b>Dexie</b><span>IndexedDB v4</span></div>
          <div><span>Offline</span><b>${navigator.onLine ? 'ONLINE' : 'OFFLINE'}</b><span>${navigator.onLine ? 'local only' : 'queued locally'}</span></div>
        </div>
        <div class="console-actions" style="margin-top:14px">
          <button class="btn primary" @click=${this.exportCsv}><aqua-icon name="download" size="14"></aqua-icon> Export EPA CSV</button>
          <button class="btn" @click=${() => void this.doExport('json')}><aqua-icon name="code" size="14"></aqua-icon> Export JSON bundle</button>
          <button
            class="btn"
            @click=${async () => {
              const { synced, remaining } = await drainSyncQueue();
              store.update((s) => {
                s.syncQueue = remaining;
                s.lastSyncAt = Date.now();
                s.toast = { id: Date.now(), text: `Drained ${synced} queued record${synced === 1 ? '' : 's'}.`, tone: 'ok' };
              });
            }}
          >
            <aqua-icon name="refresh" size="14"></aqua-icon> Flush sync queue
          </button>
        </div>
      </aqua-card>
      <aqua-card style="margin-top:16px">
        <div class="section-title">How the offline queue works</div>
        <p class="inline-note" style="margin-top:0">
          Every scan, purification batch and Datalog run is written to IndexedDB with a queued sync job. The
          instrument never blocks on the network: if the radio is off, jobs stay queued and the UI badge flips to
          OFFLINE. No cloud endpoint is configured; jobs remain queued until you connect <span class="mono">drainSyncQueue()</span>
          to an authenticated endpoint with server acknowledgements.
        </p>
      </aqua-card>
    `;
  }

  private renderLocked() {
    return html`
      <aqua-card accent>
        <div class="gate">
          <aqua-icon name="lock" size="32"></aqua-icon>
          <h3 style="font-size:17px">Environmental Lab Director tier</h3>
          <p>
            The interactive Datalog engine, five-language polyglot inspector, EPA exporter and cloud-sync controller are
            Director instruments. Switch tier from the privileges drawer to continue.
          </p>
          <button
            class="btn primary"
            @click=${() =>
              store.update((s) => {
                s.privilegesOpen = true;
              })}
          >
            <aqua-icon name="key" size="14"></aqua-icon> Open privileges drawer
          </button>
        </div>
      </aqua-card>
    `;
  }

  render() {
    const r = this.result;
    const seal = r?.seals[0]?.level ?? '—';
    const sealTone = seal === 'CRITICAL' ? 'bad' : seal === 'HIGH' ? 'warn' : seal === 'MODERATE' ? 'warn' : seal === 'LOW' ? 'neutral' : 'ok';

    return html`
      <div class="head">
        <div>
          <h2>Datalog <span>Logic</span> & Polyglot Vault</h2>
          <p>
            A stratified Datalog fixpoint engine reasons over your live measurement to deduce hidden hazards — lead
            leaching, nitrate runoff, chloramine byproducts, boiler limescale — then compiles routing actions.
          </p>
        </div>
        <div class="grow"></div>
        <aqua-badge tone=${sealTone} pulse=${seal === 'CRITICAL'}>seal ${seal}</aqua-badge>
      </div>

      ${!this.hasRole('director')
        ? this.renderLocked()
        : html`
            <div class="grid2">
              <div class="stack">
                <aqua-card accent>
                  <div class="section-title">
                    <span>Inferred hazards · ${r?.hazards.length ?? 0}</span>
                    <span class="mono" style="font-size:10px;color:var(--aqa-ink-faint)">${r?.derivedCount ?? 0} derived facts</span>
                  </div>
                  ${r && r.hazards.length
                    ? html`<div class="hazards">
                        ${r.hazards.map(
                          (h) => html`
                            <div class="hazard ${h.severity}">
                              <span class="sev">${h.severity}</span>
                              <div>
                                <strong>${h.label}</strong>
                                <span>subject("${h.subject}") · inferred_hazard</span>
                              </div>
                            </div>
                          `,
                        )}
                      </div>`
                    : html`<p class="inline-note" style="margin-top:0;color:var(--aqa-ok)">
                        No hazard predicates fired for this sample — the model reached a PASS seal.
                      </p>`}
                  ${r && r.actions.length
                    ? html`
                        <div class="section-title" style="margin-top:16px">Compiled routing actions</div>
                        <div class="actions-list">
                          ${r.actions.map(
                            (a) => html`<div class="action"><aqua-icon name="chevron" size="13"></aqua-icon>${a.action}</div>`,
                          )}
                        </div>
                      `
                    : null}
                </aqua-card>

                <aqua-card>
                  <div class="section-title">Engine telemetry</div>
                  <div class="ki">
                    <div><span>Iterations</span><b>${r?.iterations ?? 0}</b></div>
                    <div><span>Derived facts</span><b>${r?.derivedCount ?? 0}</b></div>
                    <div><span>Total facts</span><b>${r?.facts.length ?? 0}</b></div>
                    <div><span>Eval time</span><b>${(r?.elapsedMs ?? 0).toFixed(1)}</b><span>ms</span></div>
                  </div>
                  <p class="inline-note">
                    Stratification guarantees every “not” sits in a strictly higher stratum, so the fixpoint is unique
                    and terminating — no negation loops, no ordering dependence.
                  </p>
                </aqua-card>
              </div>

              <aqua-card accent>
                <div class="tabs" style="margin-bottom:12px">
                  <button aria-pressed=${this.tab === 'rules'} @click=${() => (this.tab = 'rules')}><aqua-icon name="code" size="12"></aqua-icon> Rule editor</button>
                  <button aria-pressed=${this.tab === 'trace'} @click=${() => (this.tab = 'trace')}><aqua-icon name="activity" size="12"></aqua-icon> Trace (${r?.steps.length ?? 0})</button>
                  <button aria-pressed=${this.tab === 'sync'} @click=${() => (this.tab = 'sync')}><aqua-icon name="database" size="12"></aqua-icon> Sync & export</button>
                </div>
                ${this.tab === 'rules' ? this.renderRules() : this.tab === 'trace' ? this.renderTrace() : this.renderSync()}
              </aqua-card>
            </div>
          `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-vault-console': VaultConsole;
  }
}
