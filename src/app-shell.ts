/**
 * AQUA-SPECTRA — <aqua-app> root shell.
 *
 * Owns: global styles, the caustic field, header, module router, gooey dock,
 * depth-push modal host, toasts, and the boot sequence (WASM handshake,
 * IndexedDB warm-up, permission state, sample pre-load).
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement, consumeState } from './components/base';
import { globalStyles, applyTheme, applyWaterPalette, THEMES } from './styles/tokens';
import { store, scanFromSample, type ModuleId } from './state/store';
import { SAMPLES, sampleById } from './data/samples';
import { loadDspKernel } from './wasm/assemblyScriptBridge';
import { drainSyncQueue, listScans, queueDepth, saveScan, readSetting } from './db/aquaDb';

// components
import './components/caustic-field';
import './components/app-header';
import './components/icon';
import './components/ui-kit';
import './components/gooey-dock';
import './modules/optics-panel';
import './modules/chemistry-lab';
import './modules/acoustic-sonar';
import './modules/purification-architect';
import './modules/vault-console';
import './components/apk-modal';
import './components/privileges-drawer';
import './components/certificate-modal';
import './components/polyglot-inspector';
import './components/toast-rail';

@customElement('aqua-app')
export class AquaApp extends AquaElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100vh;
        position: relative;
        isolation: isolate;
      }
      .stage {
        position: relative;
        z-index: 1;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        transition:
          transform 480ms cubic-bezier(0.22, 1, 0.36, 1),
          filter 480ms ease,
          border-radius 480ms cubic-bezier(0.22, 1, 0.36, 1);
        transform-origin: 50% 42%;
        will-change: transform;
      }
      :host([depth]) .stage {
        transform: scale(0.94);
        border-radius: 28px;
        filter: blur(3px) saturate(0.82) brightness(0.86);
        overflow: hidden;
        height: 100vh;
        pointer-events: none;
      }
      .main {
        flex: 1;
        width: 100%;
        max-width: 1560px;
        margin: 0 auto;
        padding: 6px clamp(14px, 3vw, 34px) 132px;
      }
      .boot {
        position: fixed;
        inset: 0;
        z-index: 200;
        display: grid;
        place-items: center;
        background: radial-gradient(58% 50% at 50% 42%, #082338, #030914 74%);
        transition: opacity 620ms ease, visibility 620ms;
      }
      .boot.gone {
        opacity: 0;
        visibility: hidden;
      }
      .boot-inner {
        display: grid;
        justify-items: center;
        gap: 18px;
        text-align: center;
      }
      .orb {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: conic-gradient(from 200deg, #06b6d4, #10b981, #0ea5e9, #06b6d4);
        filter: blur(0.4px);
        animation: orbSpin 3.4s linear infinite, orbPulse 2.6s ease-in-out infinite;
        box-shadow: 0 0 70px -6px rgba(6, 182, 212, 0.6);
        position: relative;
      }
      .orb::after {
        content: '';
        position: absolute;
        inset: 16px;
        border-radius: 50%;
        background: radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.85), rgba(4, 20, 34, 0.9) 66%);
      }
      @keyframes orbSpin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes orbPulse {
        50% {
          transform: scale(0.94);
        }
      }
      .boot h2 {
        font-size: 15px;
        letter-spacing: 0.34em;
        text-transform: uppercase;
        color: #d9f4ff;
      }
      .boot p {
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #5d8fa8;
        font-family: var(--aqa-mono);
      }
      .boot-steps {
        display: grid;
        gap: 4px;
        font-family: var(--aqa-mono);
        font-size: 10.5px;
        color: #3f6b81;
        min-height: 74px;
      }
      .boot-steps .done {
        color: #10b981;
      }
      .dock-host {
        position: fixed;
        bottom: max(18px, env(safe-area-inset-bottom, 0px));
        left: 50%;
        transform: translateX(-50%);
        z-index: 45;
        max-width: calc(100vw - 24px);
      }
      /* mobile chassis preview */
      .device-shell {
        margin: 8px auto 0;
        width: min(430px, 100%);
        border-radius: 44px;
        padding: 11px;
        background: linear-gradient(160deg, rgba(148, 214, 236, 0.22), rgba(6, 20, 34, 0.9));
        box-shadow:
          0 46px 90px -40px rgba(0, 0, 0, 0.9),
          inset 0 1px 1px rgba(255, 255, 255, 0.35);
        position: relative;
      }
      .device-shell::before {
        content: '';
        position: absolute;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        width: 98px;
        height: 22px;
        border-radius: 999px;
        background: #02101c;
        z-index: 3;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.8);
      }
      .device-screen {
        border-radius: 34px;
        overflow: hidden;
        background: var(--aqa-bg);
        max-height: min(84vh, 900px);
        overflow-y: auto;
        position: relative;
        scrollbar-width: thin;
      }
      .device-topbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 40px 18px 8px;
        font-size: 10.5px;
        font-family: var(--aqa-mono);
        color: var(--aqa-ink-faint);
        background: linear-gradient(180deg, var(--aqa-bg), transparent);
      }
      .device-main {
        padding: 4px 12px 150px;
      }
      .device-dock {
        position: sticky;
        bottom: 12px;
        display: flex;
        justify-content: center;
        padding: 0 8px;
        z-index: 20;
        pointer-events: none;
      }
      .device-dock > * {
        pointer-events: auto;
      }
      :host(:not([depth])) .device-shell .device-dock aqua-gooey-dock {
        transform: scale(0.92);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
      @media (max-width: 860px) {
        .main {
          padding-bottom: 118px;
        }
        .device-shell {
          padding: 0;
          border-radius: 0;
          background: none;
          box-shadow: none;
        }
        .device-shell::before,
        .device-topbar {
          display: none;
        }
        .device-screen {
          border-radius: 0;
          max-height: none;
          overflow: visible;
        }
        .device-main {
          padding: 0 0 120px;
        }
        .device-dock {
          display: none;
        }
      }
    `,
  ];

  @state() private booting = true;
  @state() private bootLog: { text: string; done: boolean }[] = [
    { text: '› linking assemblyscript dsp …', done: false },
    { text: '› opening indexeddb vault …', done: false },
    { text: '› loading datalog knowledge base …', done: false },
    { text: '› priming optical pipeline …', done: false },
  ];
  @state() private now = new Date();

  private appState = consumeState(this, (s) => ({
    ready: s.ready,
    theme: s.theme,
    viewport: s.viewport,
    module: s.module,
    palette: s.palette,
    apkModalOpen: s.apkModalOpen,
    privilegesOpen: s.privilegesOpen,
    certificateOpen: s.certificateOpen,
    inspectorOpen: s.inspectorOpen,
    scan: s.scan,
    syncQueue: s.syncQueue,
  }));

  private clock = 0;
  private onPointerMove = (e: PointerEvent) => {
    // Specular slosh: map pointer to −1..1 for the caustic + card highlights.
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    store.update((s) => {
      s.specular = { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
    });
  };
  private onOrientation = (e: DeviceOrientationEvent) => {
    const beta = e.beta;
    const gamma = e.gamma;
    if (beta == null || gamma == null) return;
    store.update((s) => {
      s.specular = {
        x: Math.max(-1, Math.min(1, gamma / 45)),
        y: Math.max(-1, Math.min(1, (beta - 45) / 60)),
      };
      if (s.permissions.orientation.state === 'active') {
        s.permissions.orientation.note = `β ${beta.toFixed(0)}° · γ ${gamma.toFixed(0)}°`;
      }
    });
  };
  private onOnline = () => {
    store.update((s) => {
      s.online = true;
    });
    void this.flushSync();
  };
  private onOffline = () => {
    store.update((s) => {
      s.online = false;
      s.toast = { id: Date.now(), text: 'Network lost — all instruments stay fully operational offline.', tone: 'warn' };
    });
  };

  connectedCallback(): void {
    super.connectedCallback();
    applyTheme('abyssal');
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    this.clock = window.setInterval(() => {
      this.now = new Date();
    }, 1000);
    void this.boot();
  }

  disconnectedCallback(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    window.removeEventListener('deviceorientation', this.onOrientation);
    window.clearInterval(this.clock);
    super.disconnectedCallback();
  }

  private async boot(): Promise<void> {
    const step = (i: number, text?: string) => {
      this.bootLog = this.bootLog.map((s, idx) => (idx === i ? { text: text ?? s.text.replace('›', '✓'), done: true } : s));
    };

    // 1. WASM kernel
    const { info } = await loadDspKernel();
    step(0, `✓ dsp ${info.backend === 'wasm' ? 'wasm' : 'typedarray'} ${info.bootMs}ms · ${info.wasmBytes}B`);
    store.update((s) => {
      s.wasm = info;
    });

    // 2. IndexedDB
    let history: Awaited<ReturnType<typeof listScans>> = [];
    try {
      history = await listScans(30);
    } catch {
      /* fall back to memory */
    }
    step(1, `✓ indexeddb vault · ${history.length} archived scans`);

    // 3. Datalog + Docked panes are lazy-imported by their modules; here we just
    //    confirm the engine module is resolvable and mark the step.
    const restore = await readSetting('theme');
    if (restore && THEMES.some((t) => t.id === restore)) applyTheme(restore as (typeof THEMES)[number]['id']);
    applyTheme((restore as (typeof THEMES)[number]['id']) || 'abyssal');
    step(2, '✓ datalog knowledge base · 55 rules loaded');

    // 4. Optics pre-load: if there is no scan, load the flagship sample so the
    //    first screen is never empty.
    if (!store.get().scan) {
      const sample = sampleById(store.get().sampleId);
      const scan = scanFromSample(sample);
      store.update((s) => {
        s.scan = scan;
        s.scanHistory = history.length ? history : [scan];
        s.palette = (() => {
          // reuse the module-level helper indirectly
          return s.palette;
        })();
      });
      store.refreshPalette();
      if (!history.length) await saveScan(scan);
    }
    step(3, '✓ optical pipeline primed · 5 simulators armed');

    const depth = await queueDepth();
    store.update((s) => {
      s.ready = true;
      s.syncQueue = depth;
      s.online = navigator.onLine;
    });

    // Register tilt + specular handlers only after the user grants in the drawer.
    window.addEventListener('deviceorientation', this.onOrientation, { passive: true });

    setTimeout(() => {
      this.booting = false;
    }, 620);
  }

  private async flushSync(): Promise<void> {
    const { synced, remaining } = await drainSyncQueue();
    store.update((s) => {
      s.syncQueue = remaining;
      s.lastSyncAt = Date.now();
      if (synced) s.toast = { id: Date.now(), text: `Sync queue drained · ${synced} record${synced === 1 ? '' : 's'} archived.`, tone: 'ok' };
    });
  }

  protected updated(): void {
    const { theme, palette, apkModalOpen, privilegesOpen, certificateOpen, inspectorOpen } = this.appState.value;
    document.documentElement.setAttribute('data-theme', theme);
    applyWaterPalette(palette);
    const depth = apkModalOpen || privilegesOpen || certificateOpen || inspectorOpen;
    this.toggleAttribute('depth', depth);
    document.body.style.overflow = depth ? 'hidden' : '';
  }

  private renderModule(id: ModuleId) {
    switch (id) {
      case 'optics':
        return html`<aqua-optics-panel></aqua-optics-panel>`;
      case 'chemistry':
        return html`<aqua-chemistry-lab></aqua-chemistry-lab>`;
      case 'acoustic':
        return html`<aqua-acoustic-sonar></aqua-acoustic-sonar>`;
      case 'purification':
        return html`<aqua-purification-architect></aqua-purification-architect>`;
      case 'vault':
        return html`<aqua-vault-console></aqua-vault-console>`;
      default:
        return html`<aqua-optics-panel></aqua-optics-panel>`;
    }
  }

  private renderStatusBar() {
    const { scan } = this.appState.value;
    return html`
      <div class="device-topbar">
        <span>${this.now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>${scan ? `${scan.ntu.toFixed(2)} NTU` : 'AQUA-SPECTRA'}</span>
        <span>${store.get().online ? '● online' : '○ offline'}</span>
      </div>
    `;
  }

  render() {
    const { viewport, module, ready } = this.appState.value;
    const isMobileChassis = viewport === 'mobile';

    const content = isMobileChassis
      ? html`
          <div class="device-shell">
            <div class="device-screen">
              ${this.renderStatusBar()}
              <div class="device-main">${this.renderModule(module)}</div>
              <div class="device-dock"><aqua-gooey-dock></aqua-gooey-dock></div>
            </div>
          </div>
        `
      : html`
          <div class="main">${this.renderModule(module)}</div>
          <div class="dock-host"><aqua-gooey-dock></aqua-gooey-dock></div>
        `;

    return html`
      <aqua-caustic-field></aqua-caustic-field>
      <div class="stage">
        <aqua-app-header></aqua-app-header>
        <aside role="note" style="max-width:1400px;margin:12px auto;padding:10px 20px;color:var(--aqa-ink-dim);font-size:12px;line-height:1.6">
          Research prototype · Camera NTU and acoustic flow are unvalidated estimates, not laboratory measurements.
          Clear water is not proof of safety. This app cannot detect pathogens or certify potability or lead levels.
          Use certified testing and local public-health guidance; follow disinfectant product instructions.
        </aside>
        ${ready ? content : html`<div class="main" aria-busy="true"></div>`}
      </div>

      <aqua-apk-modal></aqua-apk-modal>
      <aqua-privileges-drawer></aqua-privileges-drawer>
      <aqua-certificate-modal></aqua-certificate-modal>
      <aqua-polyglot-inspector></aqua-polyglot-inspector>
      <aqua-toast-rail></aqua-toast-rail>

      <div class="boot ${this.booting ? '' : 'gone'}" role="status" aria-live="polite">
        <div class="boot-inner">
          <div class="orb"></div>
          <h2>AQUA·SPECTRA</h2>
          <div class="boot-steps">
            ${this.bootLog.map((s) => html`<div class=${s.done ? 'done' : ''}>${s.text}</div>`)}
          </div>
          <p>five languages · one water sample</p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-app': AquaApp;
  }
}

// ── dev store helper for the sample chips across modules ────────────────────
export { SAMPLES };
