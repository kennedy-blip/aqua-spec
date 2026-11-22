/**
 * AQUA-SPECTRA — shared UI atoms.
 * <aqua-card>, <aqua-gauge>, <aqua-slider>, <aqua-badge>, <aqua-stat>
 * All squish-and-press tactile, all prism-bordered, all spring-gauged.
 */
import { css, html, svg, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AquaElement } from './base';
import type { SpringController } from '../controllers/springController';

// ══════════════════════════════════════════════════════════════════════════════
// <aqua-card>
// ══════════════════════════════════════════════════════════════════════════════

@customElement('aqua-card')
export class AquaCard extends AquaElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      border-radius: var(--aqa-radius);
      background: var(--aqa-glass-fill);
      border: 1px solid var(--aqa-glass-border);
      backdrop-filter: blur(var(--aqa-blur, 22px)) saturate(var(--aqa-saturate, 1.35));
      -webkit-backdrop-filter: blur(var(--aqa-blur, 22px)) saturate(var(--aqa-saturate, 1.35));
      box-shadow:
        var(--aqa-shadow),
        inset 0 1px 1px rgba(255, 255, 255, 0.35),
        inset 0 -1px 0 rgba(255, 255, 255, 0.05);
      overflow: hidden;
      transition:
        transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 300ms ease,
        border-color 300ms ease;
      contain: paint;
    }
    :host::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(
        135deg,
        rgba(103, 232, 249, 0.4),
        rgba(255, 255, 255, 0.2) 46%,
        rgba(52, 211, 153, 0.35)
      );
      -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 0.75;
      z-index: 0;
    }
    :host([interactive]) {
      cursor: pointer;
    }
    :host([interactive]:hover) {
      transform: scale(1.015) translateY(-1px);
      box-shadow:
        0 32px 68px -30px rgba(0, 0, 0, 0.8),
        0 0 40px -18px var(--aqa-glow),
        inset 0 1px 1px rgba(255, 255, 255, 0.42);
      border-color: color-mix(in oklab, var(--aqa-primary) 45%, transparent);
    }
    :host([interactive]:active) {
      transform: scale(0.96);
    }
    :host([accent])::after {
      content: '';
      position: absolute;
      left: 18px;
      right: 18px;
      top: 0;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, var(--aqa-primary), transparent);
      opacity: 0.85;
      pointer-events: none;
    }
    .inner {
      position: relative;
      z-index: 1;
      padding: var(--card-pad, 18px);
      height: 100%;
    }
    :host([flush]) .inner {
      padding: 0;
    }
  `;

  @property({ type: Boolean, reflect: true }) interactive = false;
  @property({ type: Boolean, reflect: true }) accent = false;
  @property({ type: Boolean, reflect: true }) flush = false;

  render() {
    return html`<div class="inner"><slot></slot></div>`;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// <aqua-badge>
// ══════════════════════════════════════════════════════════════════════════════

export type BadgeTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'violet';

@customElement('aqua-badge')
export class AquaBadge extends AquaElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
      border: 1px solid currentColor;
      background: color-mix(in oklab, currentColor 12%, transparent);
      color: var(--badge-color, var(--aqa-ink-dim));
    }
    :host([tone='ok']) {
      color: var(--aqa-ok);
    }
    :host([tone='warn']) {
      color: var(--aqa-warn);
    }
    :host([tone='bad']) {
      color: var(--aqa-bad);
    }
    :host([tone='info']) {
      color: var(--aqa-info);
    }
    :host([tone='violet']) {
      color: #a78bfa;
    }
    :host([tone='neutral']) {
      color: var(--aqa-ink-dim);
    }
    :host([pulse]) {
      animation: badgePulse 2.4s ease-in-out infinite;
    }
    @keyframes badgePulse {
      50% {
        box-shadow: 0 0 16px -2px currentColor;
      }
    }
  `;

  @property({ type: String }) tone: BadgeTone = 'neutral';
  @property({ type: Boolean, reflect: true }) pulse = false;

  render() {
    return html`<slot></slot>`;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// <aqua-stat>
// ══════════════════════════════════════════════════════════════════════════════

@customElement('aqua-stat')
export class AquaStat extends AquaElement {
  static styles = css`
    :host {
      display: grid;
      gap: 3px;
      padding: 12px 14px;
      border-radius: 15px;
      background: color-mix(in oklab, var(--aqa-ink) 5%, transparent);
      border: 1px solid var(--aqa-hairline);
    }
    .label {
      font-size: 9.5px;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
      font-weight: 650;
    }
    .value {
      font-size: var(--stat-size, 21px);
      font-weight: 680;
      font-family: var(--aqa-mono);
      letter-spacing: -0.03em;
      color: var(--stat-color, var(--aqa-ink));
      line-height: 1.1;
    }
    .value small {
      font-size: 0.52em;
      opacity: 0.6;
      font-weight: 600;
      margin-left: 2px;
    }
    .hint {
      font-size: 10.5px;
      color: var(--aqa-ink-faint);
      line-height: 1.35;
    }
  `;

  @property({ type: String }) label = '';
  @property({ type: String }) value = '';
  @property({ type: String }) unit = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) color = '';

  render() {
    return html`
      <span class="label">${this.label}</span>
      <span class="value" style=${this.color ? `--stat-color:${this.color}` : ''}>${this.value}<small>${this.unit}</small></span>
      ${this.hint ? html`<span class="hint">${this.hint}</span>` : null}
    `;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// <aqua-slider> — spring-smoothed numeric input with optional unit toggle
// ══════════════════════════════════════════════════════════════════════════════

@customElement('aqua-slider')
export class AquaSlider extends AquaElement {
  static styles = css`
    :host {
      display: block;
    }
    .row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
    .label {
      font-size: 11px;
      font-weight: 640;
      letter-spacing: 0.05em;
      color: var(--aqa-ink-dim);
      text-transform: uppercase;
    }
    .val {
      font-family: var(--aqa-mono);
      font-size: 15px;
      font-weight: 650;
      color: var(--aqa-ink);
      font-variant-numeric: tabular-nums;
    }
    .val small {
      font-size: 10px;
      color: var(--aqa-ink-faint);
      margin-left: 2px;
    }
    .track {
      position: relative;
      height: 26px;
      display: flex;
      align-items: center;
    }
    input {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 26px;
      background: transparent;
      cursor: pointer;
      margin: 0;
      position: relative;
      z-index: 2;
    }
    input::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        color-mix(in oklab, var(--aqa-primary) 70%, transparent),
        color-mix(in oklab, var(--aqa-accent) 55%, transparent)
      );
      opacity: 0.85;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
    }
    input::-moz-range-track {
      height: 6px;
      border-radius: 999px;
      background: color-mix(in oklab, var(--aqa-primary) 60%, transparent);
    }
    input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      margin-top: -6px;
      border-radius: 999px;
      background: radial-gradient(circle at 34% 30%, #ffffff, color-mix(in oklab, var(--aqa-primary) 72%, white) 62%);
      border: 1px solid rgba(255, 255, 255, 0.7);
      box-shadow:
        0 2px 10px -1px var(--aqa-glow),
        inset 0 -2px 4px rgba(0, 0, 0, 0.25);
      transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    input::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #eafcff;
      border: 1px solid #fff;
      box-shadow: 0 2px 10px -1px var(--aqa-glow);
    }
    input:active::-webkit-slider-thumb {
      transform: scale(1.18);
    }
    input:focus-visible {
      outline: 2px solid var(--aqa-primary);
      outline-offset: 3px;
      border-radius: 999px;
    }
    .ticks {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: var(--aqa-ink-faint);
      font-family: var(--aqa-mono);
      margin-top: 1px;
    }
  `;

  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: String }) label = '';
  @property({ type: String }) unit = '';
  @property({ type: Number }) decimals = 0;

  private emit(v: number) {
    this.value = v;
    this.dispatchEvent(new CustomEvent('slider-input', { detail: { value: v }, bubbles: true, composed: true }));
  }

  render() {
    const shown = this.value.toFixed(this.decimals);
    return html`
      <div class="row">
        <span class="label">${this.label}</span>
        <span class="val">${shown}<small>${this.unit}</small></span>
      </div>
      <div class="track">
        <input
          type="range"
          min=${this.min}
          max=${this.max}
          step=${this.step}
          .value=${String(this.value)}
          aria-label=${this.label}
          aria-valuetext=${`${shown} ${this.unit}`}
          @input=${(e: Event) => this.emit(Number((e.target as HTMLInputElement).value))}
        />
      </div>
      <div class="ticks"><span>${this.min}</span><span>${this.max}</span></div>
    `;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// <aqua-gauge> — spring-driven radial meniscus gauge
// ══════════════════════════════════════════════════════════════════════════════

@customElement('aqua-gauge')
export class AquaGauge extends AquaElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .track {
      fill: none;
      stroke: color-mix(in oklab, var(--aqa-ink) 12%, transparent);
      stroke-linecap: round;
    }
    .fill {
      fill: none;
      stroke-linecap: round;
      filter: drop-shadow(0 0 8px var(--aqa-glow));
      transition: stroke 320ms ease;
    }
    .tick {
      stroke: color-mix(in oklab, var(--aqa-ink) 26%, transparent);
      stroke-width: 1;
    }
    .tick.major {
      stroke: color-mix(in oklab, var(--aqa-ink) 48%, transparent);
      stroke-width: 1.4;
    }
    .ticklabel {
      fill: var(--aqa-ink-faint);
      font-size: 7px;
      font-family: var(--aqa-mono);
      text-anchor: middle;
      letter-spacing: 0.04em;
    }
    .center {
      text-align: center;
      position: absolute;
      inset: 0;
      display: grid;
      place-content: center;
      pointer-events: none;
    }
    .big {
      font-family: var(--aqa-mono);
      font-size: var(--big-size, 26px);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
      color: var(--aqa-ink);
      font-variant-numeric: tabular-nums;
    }
    .unit {
      font-size: 9.5px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--aqa-ink-faint);
      margin-top: 3px;
    }
  `;

  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: String }) unit = '';
  @property({ type: Number }) decimals = 1;
  @property({ type: Number }) startAngle = -215;
  @property({ type: Number }) endAngle = 35;
  @property({ type: String }) color = '';
  @property({ type: String }) bigSize = '26px';

  @state() private animated = 0;
  private springCtl: SpringController | null = null;

  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('value')) {
      const target = Number.isFinite(this.value) ? this.value : 0;
      if (!this.springCtl) {
        this.animated = target;
        this.springCtl = this.spring(target, (f) => {
          this.animated = f.value;
        }, { stiffness: 190, damping: 22, mass: 1.05, precision: 0.0005, velocityCarry: 0.15 });
      } else {
        this.springCtl.setTarget(target);
      }
    }
  }

  private polar(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  private arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
    const p0 = this.polar(cx, cy, r, a0);
    const p1 = this.polar(cx, cy, r, a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const sweep = a1 > a0 ? 1 : 0;
    return `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${r} ${r} 0 ${large} ${sweep} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  render() {
    const size = 200;
    const cx = size / 2;
    const cy = size / 2 + 4;
    const r = 76;
    const span = this.endAngle - this.startAngle;
    const pct = Math.max(0, Math.min(1, (this.animated - this.min) / (this.max - this.min || 1)));
    const angle = this.startAngle + span * pct;
    const stroke = this.color || 'var(--aqa-primary)';

    const ticks: TemplateResult[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = this.startAngle + (span * i) / 10;
      const major = i % 5 === 0;
      const p0 = this.polar(cx, cy, r + 8, a);
      const p1 = this.polar(cx, cy, r + (major ? 15 : 12), a);
      ticks.push(svg`<line class="tick ${major ? 'major' : ''}" x1=${p0.x} y1=${p0.y} x2=${p1.x} y2=${p1.y} />`);
      if (major) {
        const lp = this.polar(cx, cy, r + 25, a);
        const val = this.min + ((this.max - this.min) * i) / 10;
        ticks.push(
          svg`<text class="ticklabel" x=${lp.x} y=${lp.y + 2.5}>${val >= 100 ? val.toFixed(0) : val.toFixed(this.max - this.min <= 12 ? 1 : 0)}</text>`,
        );
      }
    }

    return html`
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label=${`${this.value} ${this.unit}`}>
        <path class="track" d=${this.arcPath(cx, cy, r, this.startAngle, this.endAngle)} stroke-width="9" stroke-linecap="round" />
        <path
          class="fill"
          d=${this.arcPath(cx, cy, r, this.startAngle, Math.max(this.startAngle + 0.4, angle))}
          stroke=${stroke}
          stroke-width="9"
        />
        ${ticks}
        <circle cx=${cx} cy=${cy} r="3.4" fill=${stroke} opacity="0.9" />
      </svg>
      <div class="center">
        <div class="big" style=${`--big-size:${this.bigSize}`}>${this.value.toFixed(this.decimals)}</div>
        <div class="unit">${this.unit}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-card': AquaCard;
    'aqua-badge': AquaBadge;
    'aqua-stat': AquaStat;
    'aqua-slider': AquaSlider;
    'aqua-gauge': AquaGauge;
  }
}
