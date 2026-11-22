/**
 * AQUA-SPECTRA — <aqua-caustic-field>
 * Full-viewport GLSL caustic underlay + frosted noise film + specular slosh.
 * This is the layer that makes every glass panel feel submerged.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement, consumeState } from './base';
import { CausticRenderer } from '../gl/causticRenderer';
import type { ThemeId } from '../styles/tokens';

@customElement('aqua-caustic-field')
export class CausticField extends AquaElement {
  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
      background: var(--aqa-bg);
    }
    .canvas-host {
      position: absolute;
      inset: -6%;
      will-change: transform;
      transform: translate3d(0, 0, 0);
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      opacity: 1;
      transition: opacity 600ms ease;
    }
    canvas[data-fallback='true'] {
      display: none;
    }
    .css-fallback {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(60% 55% at 22% 18%, color-mix(in oklab, var(--aqa-primary) 34%, transparent), transparent 68%),
        radial-gradient(52% 60% at 82% 74%, color-mix(in oklab, var(--aqa-accent) 26%, transparent), transparent 70%),
        radial-gradient(120% 120% at 50% 50%, var(--aqa-bg-2), var(--aqa-bg) 72%);
      animation: drift 26s ease-in-out infinite alternate;
      opacity: 0.9;
    }
    @keyframes drift {
      from {
        transform: scale(1) translate3d(-1.5%, -1%, 0);
      }
      to {
        transform: scale(1.06) translate3d(1.5%, 1.5%, 0);
      }
    }
    .depth-veil {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(120% 90% at 50% -10%, transparent 30%, color-mix(in oklab, var(--aqa-bg) 78%, transparent) 100%),
        linear-gradient(180deg, transparent 40%, color-mix(in oklab, var(--aqa-bg) 55%, transparent));
    }
    .grain {
      position: absolute;
      inset: 0;
      opacity: 0.035;
      mix-blend-mode: overlay;
      pointer-events: none;
    }
    :host([data-theme='glacial']) .depth-veil {
      background:
        radial-gradient(120% 90% at 50% -10%, transparent 45%, rgba(220, 239, 250, 0.75) 100%),
        linear-gradient(180deg, transparent 48%, rgba(232, 245, 252, 0.7));
    }
    :host([data-theme='glacial']) .grain {
      mix-blend-mode: multiply;
      opacity: 0.028;
    }
  `;

  @state() private theme: ThemeId = 'abyssal';
  @state() private fallback = false;

  private renderer: CausticRenderer | null = null;
  private hostEl: HTMLElement | null = null;

  private stateCtl = consumeState(this, (s) => ({
    palette: s.palette,
    theme: s.theme,
    ntu: s.scan?.ntu ?? 0.35,
    ph: s.scan?.pads.ph ?? 7.3,
    lsi: s.scan?.stability.lsi ?? -0.05,
    specular: s.specular,
    reduced: s.reducedMotion,
  }));

  firstUpdated(): void {
    this.hostEl = this.renderRoot.querySelector('.canvas-host');
    if (!this.hostEl) return;
    this.renderer = new CausticRenderer();
    this.renderer.mount(this.hostEl);
    this.fallback = !this.renderer.isLive;
    this.pushUniforms();
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('theme')) {
      this.dataset.theme = this.theme;
    }
    this.syncTheme();
    this.pushUniforms();
  }

  disconnectedCallback(): void {
    this.renderer?.unmount();
    this.renderer = null;
    super.disconnectedCallback();
  }

  private lastTheme: ThemeId | null = null;

  private syncTheme(): void {
    const s = this.stateCtl.value;
    if (this.lastTheme === s.theme) return;
    this.lastTheme = s.theme;
    this.theme = s.theme;
    this.dataset.theme = s.theme;
    this.renderer?.setState({ lowPower: s.theme === 'eco' || s.reduced });
  }

  private pushUniforms(): void {
    const s = this.stateCtl.value;
    if (!s) return;
    this.syncTheme();
    this.renderer?.setState({
      ntu: s.ntu,
      ph: s.ph,
      lsi: s.lsi,
      energy: s.palette.state === 'hazard' ? 1 : s.palette.state === 'scale' ? 0.35 : 0,
      palette: s.palette,
      light: s.specular,
      lowPower: s.theme === 'eco' || s.reduced,
    });
  }

  render() {
    return html`
      <div class="canvas-host"></div>
      ${this.fallback ? html`<div class="css-fallback"></div>` : null}
      <div class="depth-veil"></div>
      <svg class="grain" aria-hidden="true" width="100%" height="100%">
        <filter id="frostGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#frostGrain)" />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-caustic-field': CausticField;
  }
}
