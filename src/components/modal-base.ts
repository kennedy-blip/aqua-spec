/**
 * AQUA-SPECTRA — shared modal scaffold with depth-push, focus trap, and
 * shared-element container morphing (View Transitions when available).
 */
import { css, html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AquaElement } from './base';

export abstract class ModalBase extends AquaElement {
  static modalStyles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: grid;
      place-items: center;
      padding: clamp(10px, 3vw, 30px);
      pointer-events: none;
    }
    :host([open]) {
      pointer-events: auto;
    }
    .scrim {
      position: absolute;
      inset: 0;
      background: radial-gradient(70% 60% at 50% 40%, rgba(3, 12, 22, 0.55), rgba(1, 5, 10, 0.86));
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      opacity: 0;
      transition: opacity 340ms ease;
      cursor: pointer;
    }
    :host([open]) .scrim {
      opacity: 1;
    }
    .sheet {
      position: relative;
      z-index: 1;
      width: min(940px, 100%);
      max-height: min(90vh, 940px);
      overflow-y: auto;
      border-radius: 26px;
      background: var(--aqa-glass-fill-strong);
      border: 1px solid var(--aqa-glass-border);
      backdrop-filter: blur(30px) saturate(1.5);
      -webkit-backdrop-filter: blur(30px) saturate(1.5);
      box-shadow:
        0 60px 120px -50px rgba(0, 0, 0, 0.95),
        inset 0 1px 1px rgba(255, 255, 255, 0.34);
      padding: clamp(16px, 2.4vw, 26px);
      transform: translateY(16px) scale(0.965);
      opacity: 0;
      transition:
        transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
        opacity 300ms ease;
      contain: paint;
    }
    :host([open]) .sheet {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    :host([wide]) .sheet {
      width: min(1220px, 100%);
    }
    :host([narrow]) .sheet {
      width: min(560px, 100%);
    }
    @media (max-width: 700px) {
      :host {
        padding: 0;
        align-items: end;
      }
      .sheet {
        border-radius: 24px 24px 0 0;
        max-height: 94vh;
        padding-bottom: max(20px, env(safe-area-inset-bottom));
      }
    }
    .sheet-head {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
    }
    .sheet-head h2 {
      font-size: clamp(17px, 2vw, 21px);
      letter-spacing: -0.02em;
    }
    .sheet-head p {
      font-size: 11.5px;
      color: var(--aqa-ink-faint);
      margin-top: 3px;
    }
    .sheet-head .grow {
      flex: 1;
    }
    .close {
      width: 34px;
      height: 34px;
      border-radius: 11px;
      border: 1px solid var(--aqa-glass-border);
      background: color-mix(in oklab, var(--aqa-ink) 6%, transparent);
      color: var(--aqa-ink-dim);
      display: grid;
      place-items: center;
      cursor: pointer;
      flex: none;
      transition: all 180ms;
    }
    .close:hover {
      color: var(--aqa-ink);
      background: color-mix(in oklab, var(--aqa-bad) 20%, transparent);
      border-color: color-mix(in oklab, var(--aqa-bad) 45%, transparent);
    }
    .close:active {
      transform: scale(0.92);
    }
    .sheet::before {
      content: '';
      position: absolute;
      left: 20%;
      right: 20%;
      top: 0;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, var(--aqa-primary), var(--aqa-accent), transparent);
      opacity: 0.9;
      pointer-events: none;
    }
    :host([open]) .sheet::before {
      animation: lightSweep 3.4s ease-in-out infinite;
    }
    @keyframes lightSweep {
      50% {
        left: 34%;
        right: 34%;
        opacity: 0.55;
      }
    }
  `;

  @property({ type: Boolean, reflect: true }) open = false;
  @state() protected closing = false;

  protected abstract modalTitle(): string;
  protected subtitle(): string {
    return '';
  }
  protected abstract body(): unknown;

  protected close(): void {
    this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
    this.open = false;
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('open')) {
      if (this.open) {
        this.focusFirst();
        document.addEventListener('keydown', this.onKey);
      } else {
        document.removeEventListener('keydown', this.onKey);
      }
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this.onKey);
    super.disconnectedCallback();
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.close();
    }
    if (e.key === 'Tab') this.trap(e);
  };

  private trap(e: KeyboardEvent): void {
    const focusables = [...this.renderRoot.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = (this.renderRoot as unknown as { activeElement: Element | null }).activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  private focusFirst(): void {
    requestAnimationFrame(() => {
      const el = this.renderRoot.querySelector<HTMLElement>('.sheet .close');
      el?.focus({ preventScroll: true });
    });
  }

  render() {
    if (!this.open) return html``;
    return html`
      <div class="scrim" @click=${() => this.close()} aria-hidden="true"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label=${this.modalTitle()}>
        <div class="sheet-head">
          <div class="grow">
            <h2>${this.modalTitle()}</h2>
            ${this.subtitle() ? html`<p>${this.subtitle()}</p>` : null}
          </div>
          <button class="close" @click=${() => this.close()} aria-label="Close">
            <aqua-icon name="close" size="16"></aqua-icon>
          </button>
        </div>
        ${this.body()}
      </section>
    `;
  }
}
