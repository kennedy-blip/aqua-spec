/**
 * AQUA-SPECTRA — <aqua-gooey-dock>
 * Metaball navigation dock. The active droplet stretches and merges with its
 * neighbours through an SVG feGaussianBlur + feColorMatrix contrast filter, and
 * a spring-driven indicator slides between tabs so the "water" never snaps.
 */
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AquaElement, consumeState } from './base';
import type { ModuleId } from '../state/store';
import type { SpringController } from '../controllers/springController';

export type DockItem = { id: ModuleId; label: string; short: string; icon: string; role?: 'household' | 'specialist' | 'director' };

export const DOCK_ITEMS: DockItem[] = [
  { id: 'optics', label: 'Optical Nephelometer', short: 'Optics', icon: 'aperture' },
  { id: 'chemistry', label: 'LSI Corrosion Lab', short: 'Chemistry', icon: 'flask', role: 'specialist' },
  { id: 'acoustic', label: 'Acoustic Hydro-Sonar', short: 'Sonar', icon: 'waves' },
  { id: 'purification', label: 'Survival Purification', short: 'Purify', icon: 'droplet' },
  { id: 'vault', label: 'Datalog & Polyglot Vault', short: 'Vault', icon: 'layers', role: 'director' },
];

@customElement('aqua-gooey-dock')
export class GooeyDock extends AquaElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      z-index: 30;
    }
    .dock-wrap {
      position: relative;
      padding: 8px 10px;
      border-radius: 999px;
      background: var(--aqa-glass-fill-strong);
      border: 1px solid var(--aqa-glass-border);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      box-shadow:
        0 26px 50px -26px rgba(0, 0, 0, 0.7),
        inset 0 1px 1px rgba(255, 255, 255, 0.32),
        inset 0 -1px 0 rgba(255, 255, 255, 0.05);
      overflow: hidden;
    }
    svg.goo {
      position: absolute;
      width: 0;
      height: 0;
      pointer-events: none;
    }
    .track {
      position: relative;
      display: flex;
      align-items: center;
      gap: 4px;
      isolation: isolate;
    }
    .blob {
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 0;
      width: var(--blob-w, 96px);
      transform: translateX(var(--blob-x, 0px));
      border-radius: 999px;
      background: linear-gradient(
        135deg,
        color-mix(in oklab, var(--aqa-primary) 78%, white 8%),
        color-mix(in oklab, var(--aqa-accent) 62%, transparent)
      );
      filter: url(#gooBlend);
      opacity: 0.92;
      transition: width 300ms cubic-bezier(0.22, 1, 0.36, 1);
      z-index: 0;
      pointer-events: none;
    }
    .droplet {
      position: absolute;
      z-index: 0;
      border-radius: 999px;
      background: color-mix(in oklab, var(--aqa-primary) 70%, transparent);
      filter: url(#gooBlend);
      pointer-events: none;
      opacity: 0;
      transition: opacity 180ms ease;
    }
    .droplet.stretch {
      opacity: 0.75;
    }
    button {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 15px;
      min-width: 92px;
      justify-content: center;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--aqa-ink-dim);
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: color 200ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms;
      white-space: nowrap;
    }
    button:hover {
      color: var(--aqa-ink);
      transform: translateY(-1px);
    }
    button:active {
      transform: scale(0.95);
    }
    button[aria-selected='true'] {
      color: #04121c;
    }
    :host([data-theme='glacial']) button[aria-selected='true'] {
      color: #04262f;
    }
    button.locked {
      opacity: 0.52;
    }
    button .lock {
      font-size: 10px;
      opacity: 0.9;
    }
    button:focus-visible {
      outline: 2px solid var(--aqa-primary);
      outline-offset: 2px;
    }
    @media (max-width: 860px) {
      button {
        min-width: 0;
        padding: 8px 10px;
        font-size: 11px;
        gap: 6px;
      }
      button span.label {
        display: none;
      }
      .dock-wrap {
        padding: 6px 8px;
      }
    }
  `;

  @state() private indicatorX = 0;
  @state() private indicatorW = 96;
  @state() private stretchScale = 1;

  private springCtl: SpringController | null = null;
  private dockState = consumeState(this, (s) => ({ module: s.module, role: s.role }));
  private itemEls: HTMLElement[] = [];

  firstUpdated(): void {
    this.springCtl = this.spring(
      0,
      (frame) => {
        this.indicatorX = frame.value;
        // Stretch the metaball while it travels, then relax at rest.
        const speed = Math.min(1, Math.abs(frame.velocity) / 1400);
        this.stretchScale = 1 + speed * 0.18;
      },
      { stiffness: 260, damping: 18, mass: 0.9, precision: 0.05, velocityCarry: 0.6 },
    );
    this.syncIndicator(true);
  }

  protected updated(): void {
    this.syncIndicator(false);
  }

  private syncIndicator(instant: boolean): void {
    const el = this.itemEls[DOCK_ITEMS.findIndex((i) => i.id === this.dockState.value.module)];
    if (!el) return;
    const x = el.offsetLeft;
    const w = el.offsetWidth;
    this.indicatorW = w;
    if (!this.springCtl) return;
    if (instant) this.springCtl.setValue(x);
    else this.springCtl.setTarget(x);
  }

  private select(item: DockItem, el: HTMLElement): void {
    if (item.role && !this.hasRole(item.role)) {
      const s = this.store.get();
      this.store.update((draft) => {
        draft.privilegesOpen = true;
        draft.toast = {
          id: Date.now(),
          text: `${item.label} requires the ${item.role === 'specialist' ? 'Water Quality Specialist' : 'Environmental Lab Director'} tier.`,
          tone: 'warn',
        };
      });
      void s;
      return;
    }
    this.store.update((draft) => {
      draft.module = item.id;
      draft.navDockActive = item.id;
    });
    const track = el.getBoundingClientRect();
    const wrap = this.getBoundingClientRect();
    this.vibrate(8);
    void track;
    void wrap;
  }

  render() {
    return html`
      <svg class="goo" aria-hidden="true">
        <defs>
          <filter id="gooBlend">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div class="dock-wrap">
        <div class="track" role="tablist" aria-label="AQUA-SPECTRA modules">
          <div
            class="blob"
            aria-hidden="true"
            style=${`--blob-x:${this.indicatorX}px; --blob-w:${this.indicatorW}px; transform: translateX(var(--blob-x)) scaleX(${this.stretchScale});`}
          ></div>
          ${DOCK_ITEMS.map((item, i) => {
            const selected = this.dockState.value.module === item.id;
            const locked = !!item.role && !this.hasRole(item.role);
            return html`
              <button
                role="tab"
                aria-selected=${selected ? 'true' : 'false'}
                aria-label=${item.label}
                title=${locked ? `${item.label} — locked (${item.role} tier)` : item.label}
                class=${locked ? 'locked' : ''}
                @click=${(e: Event) => this.select(item, e.currentTarget as HTMLElement)}
                ${(el: HTMLElement) => {
                  this.itemEls[i] = el;
                }}
              >
                <aqua-icon name=${item.icon} size="15"></aqua-icon>
                <span class="label">${item.short}</span>
                ${locked ? html`<span class="lock" aria-hidden="true">🔒</span>` : null}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-gooey-dock': GooeyDock;
  }
}
