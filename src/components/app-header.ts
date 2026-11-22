/**
 * AQUA-SPECTRA — <aqua-app-header>
 * Wordmark, water-state readout, theme switcher, viewport toggle, role chip,
 * privilege drawer trigger, and the glowing one-tap APK download button.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement, consumeState } from './base';
import { THEMES, applyTheme, type ThemeId } from '../styles/tokens';
import { ROLE_META } from '../state/store';
import { triggerApkDownload } from '../apk/apkArtifact';

@customElement('aqua-app-header')
export class AppHeader extends AquaElement {
  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 40;
      padding: 14px clamp(14px, 3vw, 34px) 10px;
      backdrop-filter: blur(18px) saturate(1.3);
      -webkit-backdrop-filter: blur(18px) saturate(1.3);
      background: linear-gradient(180deg, color-mix(in oklab, var(--aqa-bg) 82%, transparent), transparent);
    }
    :host([data-theme='eco']) {
      backdrop-filter: none;
      background: var(--aqa-bg);
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 11px;
      min-width: 0;
    }
    .mark {
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 13px;
      display: grid;
      place-items: center;
      background: conic-gradient(from 210deg, var(--aqa-primary), var(--aqa-accent), var(--aqa-secondary), var(--aqa-primary));
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.28) inset,
        0 10px 26px -10px var(--aqa-glow);
      color: #04131d;
      flex: none;
    }
    .mark::after {
      content: '';
      position: absolute;
      inset: 2px;
      border-radius: 11px;
      background: conic-gradient(from 210deg, var(--aqa-primary), var(--aqa-accent), var(--aqa-secondary), var(--aqa-primary));
      opacity: 0.9;
    }
    .mark aqua-icon {
      position: relative;
      z-index: 1;
    }
    .titles {
      min-width: 0;
    }
    .titles h1 {
      font-size: 17px;
      letter-spacing: 0.13em;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .titles h1 em {
      font-style: normal;
      color: var(--aqa-primary);
    }
    .titles p {
      font-size: 10.5px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .spacer {
      flex: 1 1 auto;
      min-width: 8px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.05em;
      color: var(--aqa-ink-dim);
      background: var(--aqa-glass-fill);
      border: 1px solid var(--aqa-glass-border);
      white-space: nowrap;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--aqa-accent);
      box-shadow: 0 0 10px var(--aqa-glow);
      animation: breathe 2.8s ease-in-out infinite;
    }
    @keyframes breathe {
      50% {
        opacity: 0.45;
        transform: scale(0.82);
      }
    }
    .chip.warn .dot {
      background: var(--aqa-warn);
    }
    .chip.bad .dot {
      background: var(--aqa-bad);
    }
    .seg {
      display: inline-flex;
      padding: 3px;
      gap: 2px;
      border-radius: 999px;
      background: var(--aqa-glass-fill);
      border: 1px solid var(--aqa-glass-border);
    }
    .seg button {
      border: 0;
      background: transparent;
      color: var(--aqa-ink-faint);
      font-size: 11px;
      font-weight: 620;
      padding: 6px 11px;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: color 180ms, background 200ms, transform 180ms;
      white-space: nowrap;
    }
    .seg button[aria-pressed='true'] {
      color: var(--aqa-ink);
      background: color-mix(in oklab, var(--aqa-primary) 22%, transparent);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.24);
    }
    .seg button:hover {
      color: var(--aqa-ink);
    }
    .seg button:active {
      transform: scale(0.95);
    }
    .icon-btn {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      border: 1px solid var(--aqa-glass-border);
      background: var(--aqa-glass-fill);
      color: var(--aqa-ink-dim);
      cursor: pointer;
      transition: color 180ms, transform 200ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms;
    }
    .icon-btn:hover {
      color: var(--aqa-ink);
      border-color: color-mix(in oklab, var(--aqa-primary) 50%, transparent);
      transform: translateY(-1px);
    }
    .icon-btn:active {
      transform: scale(0.94);
    }
    .apk-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 15px;
      border-radius: 999px;
      border: 1px solid color-mix(in oklab, var(--aqa-primary) 55%, transparent);
      background: linear-gradient(
        120deg,
        color-mix(in oklab, var(--aqa-primary) 34%, transparent),
        color-mix(in oklab, var(--aqa-accent) 26%, transparent)
      );
      color: var(--aqa-ink);
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      cursor: pointer;
      overflow: hidden;
      box-shadow: 0 0 26px -8px var(--aqa-glow), inset 0 1px 1px rgba(255, 255, 255, 0.3);
      transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms;
      white-space: nowrap;
    }
    .apk-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.45) 50%, transparent 70%);
      transform: translateX(-120%);
      animation: shimmer 4.2s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%,
      62% {
        transform: translateX(-120%);
      }
      100% {
        transform: translateX(120%);
      }
    }
    .apk-btn:hover {
      transform: translateY(-1px) scale(1.02);
      box-shadow: 0 0 36px -6px var(--aqa-glow), inset 0 1px 1px rgba(255, 255, 255, 0.4);
    }
    .apk-btn:active {
      transform: scale(0.96);
    }
    .role-chip {
      cursor: pointer;
      padding-right: 10px;
    }
    .role-chip .role-name {
      max-width: 168px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .role-chip:hover {
      border-color: color-mix(in oklab, var(--aqa-primary) 55%, transparent);
    }
    .role-swatch {
      width: 8px;
      height: 8px;
      border-radius: 3px;
    }
    .theme-pop {
      position: absolute;
      right: 0;
      top: calc(100% + 10px);
      width: min(344px, calc(100vw - 28px));
      padding: 8px;
      border-radius: 18px;
      background: var(--aqa-glass-fill-strong);
      border: 1px solid var(--aqa-glass-border);
      backdrop-filter: blur(26px) saturate(1.4);
      -webkit-backdrop-filter: blur(26px) saturate(1.4);
      box-shadow: var(--aqa-shadow), inset 0 1px 1px rgba(255, 255, 255, 0.3);
      z-index: 60;
      animation: popIn 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes popIn {
      from {
        opacity: 0;
        transform: translateY(-6px) scale(0.97);
      }
    }
    .theme-item {
      display: flex;
      align-items: center;
      gap: 11px;
      width: 100%;
      padding: 10px;
      border: 0;
      border-radius: 13px;
      background: transparent;
      text-align: left;
      cursor: pointer;
      color: var(--aqa-ink);
      transition: background 180ms;
    }
    .theme-item:hover {
      background: color-mix(in oklab, var(--aqa-primary) 14%, transparent);
    }
    .theme-item[aria-pressed='true'] {
      background: color-mix(in oklab, var(--aqa-primary) 20%, transparent);
    }
    .swatches {
      display: flex;
      flex: none;
    }
    .swatches i {
      width: 13px;
      height: 24px;
      border-radius: 5px;
      margin-left: -4px;
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35);
    }
    .swatches i:first-child {
      margin-left: 0;
    }
    .theme-meta {
      display: grid;
      gap: 1px;
      min-width: 0;
      flex: 1;
    }
    .theme-meta strong {
      font-size: 12.5px;
      font-weight: 650;
    }
    .theme-meta small {
      font-size: 10.5px;
      color: var(--aqa-ink-faint);
      line-height: 1.35;
    }
    @media (max-width: 1180px) {
      .titles p {
        display: none;
      }
      .hide-md {
        display: none;
      }
    }
    @media (max-width: 720px) {
      :host {
        padding: 10px 12px 8px;
      }
      .titles h1 {
        font-size: 14px;
      }
      .hide-sm {
        display: none;
      }
      .apk-btn span.long {
        display: none;
      }
    }
  `;

  @state() private themeMenuOpen = false;

  private stateCtl = consumeState(this, (s) => ({
    theme: s.theme,
    role: s.role,
    palette: s.palette,
    viewport: s.viewport,
    scan: s.scan,
    wasm: s.wasm,
    online: s.online,
    syncQueue: s.syncQueue,
  }));

  private pickTheme(id: ThemeId, e: Event): void {
    e.stopPropagation();
    applyTheme(id);
    this.store.update((s) => {
      s.theme = id;
      s.toast = {
        id: Date.now(),
        text: `${THEMES.find((t) => t.id === id)?.name} theme engaged.`,
        tone: 'info',
      };
    });
    this.themeMenuOpen = false;
  }

  private setViewport(v: 'desktop' | 'mobile'): void {
    this.store.update((s) => {
      s.viewport = v;
    });
  }

  render() {
    const { theme, role, palette, viewport, scan, wasm, online, syncQueue } = this.stateCtl.value;
    const meta = ROLE_META[role];
    const sealTone = palette.state === 'hazard' ? 'bad' : palette.state === 'scale' ? 'warn' : '';

    return html`
      <header class="bar">
        <div class="brand">
          <div class="mark"><aqua-icon name="droplet" size="20"></aqua-icon></div>
          <div class="titles">
            <h1>AQUA<em>·</em>SPECTRA</h1>
            <p>Polyglot hydro-optical laboratory · v1.0.0</p>
          </div>
        </div>

        <div class="spacer"></div>

        <span class="chip ${sealTone} hide-sm" title=${palette.label}>
          <i class="dot"></i>
          ${scan ? `${scan.ntu.toFixed(2)} NTU · LSI ${scan.stability.lsi > 0 ? '+' : ''}${scan.stability.lsi.toFixed(2)}` : 'NO SAMPLE LOADED'}
        </span>

        <span class="chip hide-md" title=${wasm?.label ?? 'kernel loading'}>
          <aqua-icon name="code" size="13"></aqua-icon>
          ${wasm ? (wasm.backend === 'wasm' ? `WASM ${(wasm.wasmBytes / 1024).toFixed(1)} KB` : 'TYPEDARRAY') : 'BOOTING'}
        </span>

        <span class="chip hide-md ${online ? '' : 'warn'}" title="Offline queue depth">
          <aqua-icon name="database" size="13"></aqua-icon>
          ${online ? (syncQueue === 0 ? 'SYNCED' : `${syncQueue} QUEUED`) : 'OFFLINE'}
        </span>

        <div class="seg hide-sm" role="group" aria-label="Viewport form factor">
          <button aria-pressed=${viewport === 'desktop'} @click=${() => this.setViewport('desktop')}>
            <aqua-icon name="monitor" size="13"></aqua-icon> Desktop Hydro Lab
          </button>
          <button aria-pressed=${viewport === 'mobile'} @click=${() => this.setViewport('mobile')}>
            <aqua-icon name="phone" size="13"></aqua-icon> Mobile Field APK
          </button>
        </div>

        <button
          class="chip role-chip"
          @click=${() => this.store.update((s) => { s.privilegesOpen = true; })}
          title="Privileges & polyglot runtime"
        >
          <span class="role-swatch" style=${`background:${meta.accent}`}></span>
          <span class="role-name">${meta.name}</span>
          <aqua-icon name="key" size="13"></aqua-icon>
        </button>

        <div style="position:relative">
          <button
            class="icon-btn"
            aria-label="Theme"
            aria-expanded=${this.themeMenuOpen}
            @click=${(e: Event) => {
              e.stopPropagation();
              this.themeMenuOpen = !this.themeMenuOpen;
            }}
          >
            <aqua-icon name=${theme === 'glacial' ? 'sun' : 'moon'} size="17"></aqua-icon>
          </button>
          ${this.themeMenuOpen
            ? html`
                <div class="theme-pop" @click=${(e: Event) => e.stopPropagation()}>
                  ${THEMES.map(
                    (t) => html`
                      <button class="theme-item" @click=${(e: Event) => this.pickTheme(t.id, e)} aria-pressed=${theme === t.id}>
                        <span class="swatches">
                          ${t.swatch.map((c) => html`<i style=${`background:${c}`}></i>`)}
                        </span>
                        <span class="theme-meta">
                          <strong>${t.name}</strong>
                          <small>${t.tagline}</small>
                        </span>
                        ${theme === t.id ? html`<aqua-icon name="check" size="15"></aqua-icon>` : null}
                      </button>
                    `,
                  )}
                </div>
              `
            : null}
        </div>

        <button
          class="apk-btn"
          @click=${() => {
            triggerApkDownload();
            this.store.update((s) => {
              s.apkModalOpen = true;
            });
            this.vibrate([14, 40, 14]);
          }}
          title="Download the offline Android APK"
        >
          <aqua-icon name="download" size="15"></aqua-icon>
          <span class="long">Download</span> .APK
        </button>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-app-header': AppHeader;
  }
}
