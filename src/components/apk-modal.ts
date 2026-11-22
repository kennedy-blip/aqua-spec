/**
 * AQUA-SPECTRA — <aqua-apk-modal>
 * One-tap APK distribution center: direct download, live SVG QR, build spec,
 * SHA-256 badge and 3-step sideload guide.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ModalBase } from './modal-base';
import { consumeState } from './base';
import { fetchReleaseManifest, resolveApk, triggerApkDownload, type ApkArtifact, type ReleaseManifest } from '../apk/apkArtifact';
import { encodeQr, qrToSvgPath } from '../apk/qrCode';
import { store } from '../state/store';

@customElement('aqua-apk-modal')
export class ApkModal extends ModalBase {
  static styles = [
    ModalBase.modalStyles,
    css`
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) auto;
        gap: 20px;
        align-items: center;
      }
      @media (max-width: 760px) {
        .hero {
          grid-template-columns: 1fr;
        }
      }
      .cta {
        display: grid;
        gap: 12px;
      }
      .dl {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-radius: 16px;
        border: 1px solid color-mix(in oklab, var(--aqa-primary) 62%, transparent);
        background: linear-gradient(120deg, color-mix(in oklab, var(--aqa-primary) 34%, transparent), color-mix(in oklab, var(--aqa-accent) 26%, transparent));
        color: var(--aqa-ink);
        font-size: 14.5px;
        font-weight: 720;
        letter-spacing: 0.01em;
        cursor: pointer;
        text-align: left;
        overflow: hidden;
        box-shadow: 0 0 40px -12px var(--aqa-glow), inset 0 1px 1px rgba(255, 255, 255, 0.34);
        transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms;
      }
      .dl:hover {
        transform: translateY(-2px) scale(1.012);
        box-shadow: 0 0 54px -10px var(--aqa-glow), inset 0 1px 1px rgba(255, 255, 255, 0.45);
      }
      .dl:active {
        transform: scale(0.972);
      }
      .dl::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 34%, rgba(255, 255, 255, 0.5) 50%, transparent 66%);
        transform: translateX(-130%);
        animation: dlShimmer 3.8s ease-in-out infinite;
      }
      @keyframes dlShimmer {
        0%,
        58% {
          transform: translateX(-130%);
        }
        100% {
          transform: translateX(130%);
        }
      }
      .dl .lbl {
        display: grid;
        gap: 1px;
        flex: 1;
      }
      .dl small {
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: 0.06em;
        opacity: 0.78;
        font-family: var(--aqa-mono);
      }
      .qr-card {
        display: grid;
        justify-items: center;
        gap: 8px;
        padding: 14px;
        border-radius: 18px;
        background: #f6fbff;
        border: 1px solid rgba(12, 74, 110, 0.16);
        box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.8);
      }
      .qr-card svg {
        display: block;
        width: 168px;
        height: 168px;
        shape-rendering: crispEdges;
      }
      .qr-card span {
        font-size: 9.5px;
        font-family: var(--aqa-mono);
        color: #33546a;
        letter-spacing: 0.04em;
        text-align: center;
        max-width: 190px;
        word-break: break-all;
      }
      .spec {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 9px;
        margin-top: 18px;
      }
      .spec div {
        padding: 10px 12px;
        border-radius: 12px;
        background: color-mix(in oklab, var(--aqa-ink) 4%, transparent);
        border: 1px solid var(--aqa-hairline);
      }
      .spec span {
        display: block;
        font-size: 8.8px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--aqa-ink-faint);
        margin-bottom: 2px;
      }
      .spec b {
        font-family: var(--aqa-mono);
        font-size: 11.5px;
        font-weight: 630;
        word-break: break-all;
      }
      .sha {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 10px 12px;
        border-radius: 12px;
        background: color-mix(in oklab, #34d399 9%, transparent);
        border: 1px solid color-mix(in oklab, #34d399 30%, transparent);
        font-family: var(--aqa-mono);
        font-size: 10px;
        color: var(--aqa-ink-dim);
        word-break: break-all;
      }
      .sha b {
        color: #6ee7b7;
      }
      .steps {
        counter-reset: step;
        display: grid;
        gap: 9px;
        margin-top: 18px;
      }
      .steps div {
        counter-increment: step;
        display: flex;
        gap: 11px;
        font-size: 11.5px;
        line-height: 1.55;
        color: var(--aqa-ink-dim);
      }
      .steps div::before {
        content: counter(step);
        flex: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: color-mix(in oklab, var(--aqa-primary) 22%, transparent);
        border: 1px solid color-mix(in oklab, var(--aqa-primary) 48%, transparent);
        color: var(--aqa-primary);
        font-size: 10px;
        font-weight: 700;
        display: grid;
        place-items: center;
        margin-top: 1px;
      }
      .note {
        margin-top: 14px;
        padding: 11px 13px;
        border-radius: 12px;
        background: color-mix(in oklab, var(--aqa-warn) 9%, transparent);
        border: 1px solid color-mix(in oklab, var(--aqa-warn) 30%, transparent);
        font-size: 11px;
        line-height: 1.55;
        color: var(--aqa-ink-dim);
      }
      .badges {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 12px;
      }
    `,
  ];

  @state() private manifest: ReleaseManifest | null = null;
  @state() private artifact: ApkArtifact | null = null;
  @state() private busy = false;
  @state() private qrPath = '';
  @state() private qrUrl = '';

  private stateCtl = consumeState(this, (s) => ({ open: s.apkModalOpen, palette: s.palette }));

  protected modalTitle() {
    return 'APK Distribution · AquaSpectra HydroLab v1.0.0';
  }
  protected subtitle() {
    return 'Install the offline instrument on Android — every module runs with the radio off.';
  }

  protected updated(changed: Map<string, unknown>): void {
    const open = this.stateCtl.value.open;
    if (this.open !== open) this.open = open;
    super.updated(changed);
    if (this.open && !this.manifest) void this.prepare();
    if (changed.has('open') && !this.open) {
      store.update((s) => {
        s.apkModalOpen = false;
      });
    }
  }

  private async prepare(): Promise<void> {
    this.manifest = await fetchReleaseManifest();
    // QR encodes the current origin so a laptop user can scan straight into the
    // installed PWA / APK handoff.
    const url = `${window.location.origin}${window.location.pathname}#apk=v1.0.0-arm64`;
    this.qrUrl = url;
    this.qrPath = qrToSvgPath(encodeQr(url), 1);
  }

  private async download(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      this.artifact = await resolveApk();
      const url = URL.createObjectURL(this.artifact.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.artifact.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      this.toast(this.artifact?.source === 'synthesized' ? 'Android build pending: downloaded a source ZIP, not an installable APK.' : 'APK downloaded — transfer the file to your phone.', 'info');
    } catch {
      this.toast('Download failed — retry, or use the QR to open the web app.', 'warn');
    } finally {
      this.busy = false;
    }
  }

  protected body() {
    const m = this.manifest;
    return html`
      <div class="hero">
        <div class="cta">
          <button class="dl" @click=${() => void this.download()}>
            <aqua-icon name="download" size="22"></aqua-icon>
            <span class="lbl">
              ${this.busy ? 'Preparing release…' : 'Download Android .APK'}
              <small>${m?.bytes ? 'AquaSpectra-HydroLab-v1.0.0.apk' : 'APK build pending · source ZIP fallback'}</small>
            </span>
          </button>
          <button class="dl" style="background:var(--aqa-glass-fill);box-shadow:none" @click=${() => void triggerApkDownload()}>
            <aqua-icon name="phone" size="18"></aqua-icon>
            <span class="lbl">Direct handoff <small>downloads the available artifact</small></span>
          </button>
          <div class="badges">
            <aqua-badge tone="ok">100% offline</aqua-badge>
            <aqua-badge tone="info">Lit 3.2 + WASM</aqua-badge>
            <aqua-badge tone="violet">5 languages</aqua-badge>
          </div>
        </div>
        <div class="qr-card">
          <svg viewBox="0 0 ${encodeQr(this.qrUrl || 'https://aquas-pectra.vercel.app').size} ${encodeQr(this.qrUrl || 'https://aquas-pectra.vercel.app').size}" aria-label="QR code to open AQUA-SPECTRA">
            <rect width="100%" height="100%" fill="#f6fbff" />
            <path d=${this.qrPath || ''} fill="#0b1d2a" />
          </svg>
          <span>${this.qrUrl || 'scan on your Android phone'}</span>
        </div>
      </div>

      <div class="spec">
        <div><span>Version</span><b>${m?.version ?? 'v1.0.0-arm64'}</b></div>
        <div><span>Engines</span><b>${m?.engine ?? 'Lit 3.2 + AssemblyScript + Elixir + Datalog + GLSL'}</b></div>
        <div><span>ABI</span><b>${m?.abi ?? 'arm64-v8a + armeabi-v7a'}</b></div>
        <div><span>SDK</span><b>min ${m?.minSdk ?? 24} · target ${m?.targetSdk ?? 34}</b></div>
        <div><span>Artifact</span><b>${this.artifact ? `${(this.artifact.bytes / 1024).toFixed(0)} KB · ${this.artifact.source}` : 'resolves on download'}</b></div>
        <div><span>Build ID</span><b>${m?.buildId ?? 'ci'}</b></div>
      </div>

      <div class="sha">
        <aqua-icon name="shield" size="14"></aqua-icon>
        <span>SHA-256 <b>${this.artifact?.sha256 ?? m?.sha256 ?? 'computed in-browser at download time'}</b></span>
      </div>

      <div class="steps">
        <div>Open <b>Settings → Security → Install unknown apps</b> and allow your browser or file manager.</div>
        <div>Scan the QR with your Android camera, or transfer the .apk and tap it to install.</div>
        <div>Launch <b>AquaSpectra</b> — grant camera/microphone only when you want live optics or acoustic sonar.</div>
      </div>

      <div class="note">
        <b>Build integrity.</b> The production artifact is compiled by
        <span class="mono">.github/workflows/build-and-bundle-apk.yml</span> (Lit bundle → Capacitor sync → Gradle
        assembleDebug) and served from <span class="mono">/releases/aquaspectra-release.apk</span>. If that file is
        absent, this dialog downloads a source ZIP, NOT an installable APK. Run the GitHub Android workflow
        to generate the debug-signed APK. The SHA-256 identifies the exact bytes downloaded.
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-apk-modal': ApkModal;
  }
}
