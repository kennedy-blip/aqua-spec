/**
 * AQUA-SPECTRA — <aqua-toast-rail>
 * Transient confirmation rail. Rises from the bottom dock like a water droplet,
 * auto-dismisses, and is announced politely to assistive tech.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement } from './base';
import { store } from '../state/store';
import type { SpringController } from '../controllers/springController';

@customElement('aqua-toast-rail')
export class ToastRail extends AquaElement {
  static styles = css`
    :host {
      position: fixed;
      left: 50%;
      bottom: max(84px, calc(env(safe-area-inset-bottom, 0px) + 84px));
      transform: translateX(-50%);
      z-index: 150;
      pointer-events: none;
      width: min(520px, calc(100vw - 24px));
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 11px 15px;
      border-radius: 15px;
      background: var(--aqa-glass-fill-strong);
      border: 1px solid var(--aqa-glass-border);
      backdrop-filter: blur(22px) saturate(1.4);
      -webkit-backdrop-filter: blur(22px) saturate(1.4);
      box-shadow: 0 24px 50px -26px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.3);
      font-size: 12px;
      line-height: 1.45;
      color: var(--aqa-ink);
      pointer-events: auto;
      transform-origin: 50% 120%;
      animation: toastRise 380ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes toastRise {
      from {
        opacity: 0;
        transform: translateY(18px) scale(0.94);
      }
    }
    .toast.ok {
      border-color: color-mix(in oklab, var(--aqa-ok) 46%, transparent);
    }
    .toast.ok aqua-icon {
      color: var(--aqa-ok);
    }
    .toast.warn {
      border-color: color-mix(in oklab, var(--aqa-warn) 46%, transparent);
    }
    .toast.warn aqua-icon {
      color: var(--aqa-warn);
    }
    .toast.bad {
      border-color: color-mix(in oklab, var(--aqa-bad) 50%, transparent);
    }
    .toast.bad aqua-icon {
      color: var(--aqa-bad);
    }
    .toast.info aqua-icon {
      color: var(--aqa-primary);
    }
    aqua-icon {
      flex: none;
      margin-top: 1px;
    }
  `;

  @state() private current: { id: number; text: string; tone: string } | null = null;
  private springCtl: SpringController | null = null;
  private hideHandle = 0;
  private unsub: (() => void) | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.springCtl = this.spring(0, () => undefined, { stiffness: 300, damping: 26, mass: 0.9 });
    this.unsub = store.subscribe((s) => {
      if (s.toast && s.toast.id !== this.current?.id) {
        this.show(s.toast);
      }
    });
  }

  disconnectedCallback(): void {
    this.unsub?.();
    window.clearTimeout(this.hideHandle);
    super.disconnectedCallback();
  }

  private show(t: { id: number; text: string; tone: string }): void {
    window.clearTimeout(this.hideHandle);
    this.current = t;
    this.springCtl?.setTarget(1);
    this.hideHandle = window.setTimeout(() => {
      this.current = null;
      store.update((s) => {
        s.toast = null;
      });
    }, 4200);
  }

  render() {
    if (!this.current) return html``;
    const icon =
      this.current.tone === 'ok' ? 'check' : this.current.tone === 'warn' ? 'alert' : this.current.tone === 'bad' ? 'alert' : 'info';
    return html`
      <div class="toast ${this.current.tone}" role="status" aria-live="polite">
        <aqua-icon name=${icon} size="16"></aqua-icon>
        <span>${this.current.text}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-toast-rail': ToastRail;
  }
}
