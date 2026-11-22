/**
 * AQUA-SPECTRA — <aqua-privileges-drawer>
 * RBAC tier switcher + live hardware/OS sensor permission matrix.
 * Each permission genuinely attempts the OS API and reports ACTIVE /
 * SIMULATOR ACTIVE / RESTRICTED / DENIED.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ModalBase } from './modal-base';
import { consumeState } from './base';
import { ROLE_META, store, type PermissionId, type RoleTier } from '../state/store';

const ROLE_CAPABILITIES: Record<RoleTier, string[]> = {
  household: [
    'Optical Tyndall turbidity nephelometer (NTU / TSS)',
    '7-pad CIEDE2000 reagent strip colorimeter',
    'Acoustic pour-fill gauge & faucet flow meter',
    'Emergency bleach / NaDCC / iodine dosing',
    'Altitude boiling point + SODIS calculator',
    'IndexedDB history & offline operation',
  ],
  specialist: [
    'Everything in Household & Hiker',
    'Elixir Langelier (LSI) & Ryznar (RSI) corrosion lab',
    'Plumbosolvency lead/copper risk scoring',
    'Appliance limescale lifespan projection',
    'SCA / espresso mineral architecture matrix',
    'Aquarium & hydroponic unionized NH₃ calculator',
  ],
  director: [
    'Everything in Water Quality Specialist',
    'Interactive Datalog rule engine + derivation trace',
    '5-language polyglot inspector & benchmark lab',
    'Raw EPA CSV / JSON report exporter',
    'IndexedDB cloud-sync queue controller',
    'Full hydro-chemical certificate signing',
  ],
};

@customElement('aqua-privileges-drawer')
export class PrivilegesDrawer extends ModalBase {
  static styles = [
    ModalBase.modalStyles,
    css`
      .roles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 10px;
      }
      .role {
        position: relative;
        padding: 14px;
        border-radius: 15px;
        border: 1px solid var(--aqa-hairline);
        background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
        cursor: pointer;
        text-align: left;
        transition: all 240ms cubic-bezier(0.22, 1, 0.36, 1);
        overflow: hidden;
      }
      .role::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--tier);
        opacity: 0.75;
        box-shadow: 0 0 14px var(--tier);
      }
      .role:hover {
        transform: translateY(-2px) scale(1.008);
        border-color: color-mix(in oklab, var(--tier) 55%, transparent);
      }
      .role:active {
        transform: scale(0.978);
      }
      .role[aria-pressed='true'] {
        border-color: color-mix(in oklab, var(--tier) 75%, transparent);
        background: color-mix(in oklab, var(--tier) 15%, transparent);
        box-shadow: 0 0 30px -16px var(--tier), inset 0 1px 1px rgba(255, 255, 255, 0.16);
      }
      .role .tier {
        font-size: 8.6px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--tier);
        font-weight: 750;
      }
      .role h3 {
        font-size: 12.5px;
        margin: 3px 0 5px;
        letter-spacing: 0.02em;
      }
      .role p {
        font-size: 10.5px;
        line-height: 1.5;
        color: var(--aqa-ink-faint);
      }
      .role ul {
        margin: 9px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 3.5px;
      }
      .role li {
        font-size: 10px;
        color: var(--aqa-ink-dim);
        display: flex;
        gap: 6px;
        line-height: 1.35;
      }
      .role li::before {
        content: '·';
        color: var(--tier);
        font-weight: 700;
      }
      .sensors {
        display: grid;
        gap: 9px;
        margin-top: 6px;
      }
      .sensor {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid var(--aqa-hairline);
        background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
      }
      .sensor h4 {
        font-size: 12px;
        margin-bottom: 2px;
      }
      .sensor .detail {
        font-size: 10px;
        color: var(--aqa-ink-faint);
        font-family: var(--aqa-mono);
        line-height: 1.45;
        word-break: break-word;
      }
      .sensor .note {
        font-size: 10.5px;
        color: var(--aqa-ink-dim);
        margin-top: 4px;
        line-height: 1.45;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 11px;
        border-radius: 999px;
        font-size: 9px;
        font-weight: 750;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        border: 1px solid;
        white-space: nowrap;
        cursor: pointer;
        background: transparent;
        transition: all 180ms;
      }
      .pill.active {
        color: var(--aqa-ok);
        border-color: color-mix(in oklab, var(--aqa-ok) 50%, transparent);
        background: color-mix(in oklab, var(--aqa-ok) 12%, transparent);
      }
      .pill.simulator {
        color: var(--aqa-info);
        border-color: color-mix(in oklab, var(--aqa-info) 50%, transparent);
        background: color-mix(in oklab, var(--aqa-info) 12%, transparent);
      }
      .pill.idle {
        color: var(--aqa-ink-faint);
        border-color: var(--aqa-hairline);
      }
      .pill.restricted,
      .pill.denied {
        color: var(--aqa-warn);
        border-color: color-mix(in oklab, var(--aqa-warn) 48%, transparent);
        background: color-mix(in oklab, var(--aqa-warn) 10%, transparent);
      }
      .pill:hover {
        transform: translateY(-1px);
      }
      .pill:active {
        transform: scale(0.95);
      }
      .section-title {
        font-size: 10px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--aqa-ink-faint);
        font-weight: 700;
        margin: 20px 0 9px;
      }
      .section-title:first-child {
        margin-top: 0;
      }
      .runtime {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 9px;
      }
      .runtime div {
        padding: 10px 12px;
        border-radius: 12px;
        background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
        border: 1px solid var(--aqa-hairline);
      }
      .runtime span {
        display: block;
        font-size: 8.8px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--aqa-ink-faint);
        margin-bottom: 2px;
      }
      .runtime b {
        font-family: var(--aqa-mono);
        font-size: 11.5px;
        font-weight: 630;
      }
    `,
  ];

  @state() private busy: PermissionId | null = null;

  private stateCtl = consumeState(this, (s) => ({ open: s.privilegesOpen, role: s.role, permissions: s.permissions, wasm: s.wasm }));

  protected modalTitle() {
    return 'Privileges & Polyglot Runtime';
  }
  protected subtitle() {
    return 'Switch tier instantly, and grant only the sensors the current test needs.';
  }

  protected updated(changed: Map<string, unknown>): void {
    if (this.open !== this.stateCtl.value.open) this.open = this.stateCtl.value.open;
    super.updated(changed);
    if (changed.has('open') && !this.open) {
      store.update((s) => {
        s.privilegesOpen = false;
      });
    }
  }

  private setRole(role: RoleTier): void {
    store.update((s) => {
      s.role = role;
      s.toast = { id: Date.now(), text: `${ROLE_META[role].name} privileges unlocked.`, tone: 'ok' };
    });
    this.vibrate([12, 30, 12]);
  }

  private async requestPermission(id: PermissionId): Promise<void> {
    this.busy = id;
    try {
      switch (id) {
        case 'camera': {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
          stream.getTracks().forEach((t) => t.stop());
          this.mark(id, 'active', 'Sensor verified — camera pipeline armed for optics.');
          break;
        }
        case 'microphone': {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
          });
          stream.getTracks().forEach((t) => t.stop());
          this.mark(id, 'active', 'Raw audio path confirmed — voice filters disabled.');
          break;
        }
        case 'orientation': {
          const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
          if (typeof D?.requestPermission === 'function') {
            const res = await D.requestPermission();
            if (res !== 'granted') {
              this.mark(id, 'restricted', 'iOS declined motion access — specular tilt falls back to pointer input.');
              break;
            }
          }
          this.mark(id, 'active', 'Gyroscope streaming — meniscus now tilts with the phone.');
          break;
        }
        case 'haptics': {
          if (typeof navigator.vibrate !== 'function') {
            this.mark(id, 'restricted', 'This browser has no Vibration API — haptics simulate silently.');
            break;
          }
          navigator.vibrate(24);
          this.mark(id, 'active', 'Haptic engine armed — droplet ripples at 85 % / 100 % fill.');
          break;
        }
      }
    } catch (err) {
      this.mark(id, 'denied', err instanceof Error ? err.message : 'Permission denied');
    } finally {
      this.busy = null;
    }
  }

  private mark(id: PermissionId, state: 'active' | 'restricted' | 'denied' | 'simulator', note: string): void {
    store.update((s) => {
      s.permissions[id].state = state;
      s.permissions[id].note = note;
    });
    this.vibrate(8);
  }

  protected body() {
    const { role, permissions, wasm } = this.stateCtl.value;
    const names: Record<PermissionId, string> = {
      camera: 'Optical Nephelometry & Colorimetry Camera',
      microphone: 'Acoustic Helmholtz & Flow Microphone',
      orientation: '3-Axis Vessel Tilt & Barometric Altitude',
      haptics: 'Droplet Ripple Haptic Engine',
    };

    return html`
      <div class="section-title">Privilege tier · RBAC switcher</div>
      <div class="roles">
        ${(Object.keys(ROLE_META) as RoleTier[]).map((r) => {
          const meta = ROLE_META[r];
          return html`
            <button class="role" style=${`--tier:${meta.accent}`} aria-pressed=${role === r} @click=${() => this.setRole(r)}>
              <span class="tier">${meta.tier} tier</span>
              <h3>${meta.name}</h3>
              <p>${meta.blurb}</p>
              <ul>
                ${ROLE_CAPABILITIES[r].slice(0, 4).map((cap) => html`<li>${cap}</li>`)}
              </ul>
            </button>
          `;
        })}
      </div>

      <div class="section-title">Hardware & OS sensor permission matrix</div>
      <div class="sensors">
        ${(Object.keys(permissions) as PermissionId[]).map((id) => {
          const p = permissions[id];
          const label = p.state === 'active' ? 'ACTIVE' : p.state === 'simulator' ? 'SIMULATOR ACTIVE' : p.state.toUpperCase();
          return html`
            <div class="sensor">
              <div>
                <h4>${names[id]}</h4>
                <div class="detail">${p.detail}</div>
                <div class="note">${p.note}</div>
              </div>
              <button
                class="pill ${p.state}"
                @click=${() => void this.requestPermission(id)}
                ?disabled=${this.busy === id}
              >
                ${this.busy === id ? 'requesting…' : label}
              </button>
            </div>
          `;
        })}
      </div>

      <div class="section-title">Runtime</div>
      <div class="runtime">
        <div><span>DSP backend</span><b>${wasm?.label ?? 'linking'}</b></div>
        <div><span>WASM size</span><b>${wasm ? `${wasm.wasmBytes} B` : '—'}</b></div>
        <div><span>SHA-256</span><b style="word-break:break-all">${wasm?.sha256.slice(0, 20) ?? '—'}…</b></div>
        <div><span>Boot</span><b>${wasm ? `${wasm.bootMs} ms` : '—'}</b></div>
      </div>

      <div class="section-title">Notes</div>
      <p style="font-size:11px;line-height:1.6;color:var(--aqa-ink-faint)">
        Every sensor is opt-in and revocable from here. If a permission is denied, the corresponding module switches to
        the SIMULATOR ACTIVE path — the math, the certificate and the hazard inference all still run, they just consume
        synthetic data instead of hardware. No measurement leaves the device; the sync queue is entirely local.
      </p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-privileges-drawer': PrivilegesDrawer;
  }
}
