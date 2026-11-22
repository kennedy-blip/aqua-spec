/**
 * AQUA-SPECTRA — <aqua-icon>
 * Inline 24×24 stroke icon set (no icon-font, no network request). Every glyph
 * is drawn with currentColor so it inherits the liquid theme palette.
 */
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const PATHS: Record<string, string> = {
  aperture:
    '<circle cx="12" cy="12" r="9"/><path d="M12 3v6M18.4 7.5l-5.2 3M18.4 16.5l-5.2-3M12 21v-6M5.6 16.5l5.2-3M5.6 7.5l5.2 3"/>',
  flask: '<path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19L14 9V3"/><path d="M7.5 15h9"/>',
  waves: '<path d="M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/><path d="M2 14c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/>',
  droplet: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5"/>',
  camera:
    '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.4"/>',
  mic: '<rect x="9" y="3" width="6" height="10" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10.6 5.5h2.8"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M9 20.5h6M12 16.5v4"/>',
  shield: '<path d="M12 3 5 6v6c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6l-7-3z"/><path d="m9.2 12 2 2 3.6-3.8"/>',
  download: '<path d="M12 3v11"/><path d="m7.5 10 4.5 4.5L16.5 10"/><path d="M4 18.5h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  key: '<circle cx="7.5" cy="15.5" r="4"/><path d="m10.4 12.6 8-8M16 5l2.5 2.5M19 2l2.5 2.5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.6"/>',
  alert: '<path d="M12 3.5 21.5 20H2.5L12 3.5z"/><path d="M12 9.5v4.6M12 17.2v.5"/>',
  check: '<path d="m4.5 12.5 5 5L20 7"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5H6a1 1 0 0 0-1 1V16"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4.5V11h-6"/>',
  chart: '<path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/>',
  gauge: '<path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 12l4.5-3.2"/><circle cx="12" cy="12" r="1.6"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  fire: '<path d="M12 21c3.9 0 6.5-2.4 6.5-6 0-4.8-4-6.6-4-11-2.4 1.6-3.6 3.6-3.9 5.3-.9-.7-1.5-1.9-1.6-3.3C6.8 8.4 5.5 11 5.5 15c0 3.6 2.6 6 6.5 6z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4.4l2.6 2M9.5 2.5h5"/>',
  beaker: '<path d="M6 3h12M8 3v13.5a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V3"/><path d="M8 11h8"/>',
  activity: '<path d="M2 12h4l2.5-6 4 14 3-8h6.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  code: '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5"/>',
  spark: '<path d="M12 2.5 13.9 9l6.6 1.9-6.6 1.9L12 19.5l-1.9-6.7L3.5 10.9 10 9l2-6.5z"/>',
};

@customElement('aqua-icon')
export class AquaIcon extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      line-height: 0;
      color: currentColor;
    }
    svg {
      width: var(--icon-size, 18px);
      height: var(--icon-size, 18px);
      display: block;
    }
    path,
    circle,
    rect,
    ellipse,
    line {
      vector-effect: non-scaling-stroke;
    }
  `;

  @property({ type: String }) name = 'droplet';
  @property({ type: Number }) size = 18;
  @property({ type: Number }) stroke = 1.6;

  render() {
    const body = PATHS[this.name] ?? PATHS.droplet;
    return html`
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width=${this.stroke}
        stroke-linecap="round"
        stroke-linejoin="round"
        style=${`--icon-size:${this.size}px`}
        aria-hidden="true"
        part="svg"
        .innerHTML=${body}
      ></svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqua-icon': AquaIcon;
  }
}
