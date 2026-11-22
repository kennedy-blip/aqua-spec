/**
 * AQUA-SPECTRA — src/styles/tokens.ts
 * Design tokens for the Liquid & Frosted glass system, exposed as CSS custom
 * properties so every Lit component themes from one source of truth.
 *
 * Theme hues are driven by measured water state (NTU + LSI) via
 * `applyWaterPalette()` — the caustic shader, borders and gauges all read the
 * same trio of custom properties, which is what makes the whole app feel like
 * one body of water rather than a set of unrelated screens.
 */
import { css, unsafeCSS, type CSSResult } from 'lit';

export type ThemeId = 'abyssal' | 'glacial' | 'reef' | 'eco';

export type ThemeMeta = {
  id: ThemeId;
  name: string;
  short: string;
  tagline: string;
  swatch: [string, string, string];
  gpuClass: 'ultra' | 'balanced' | 'lite';
};

export const THEMES: ThemeMeta[] = [
  {
    id: 'abyssal',
    name: 'Abyssal Trench',
    short: 'Abyssal',
    tagline: 'Deep ocean-void glass · bioluminescent cyan, emerald & coral',
    swatch: ['#06B6D4', '#10B981', '#F97316'],
    gpuClass: 'ultra',
  },
  {
    id: 'glacial',
    name: 'Glacial Daylight Frost',
    short: 'Glacial',
    tagline: 'High-luminosity ice glass for field, poolside & street sunlight',
    swatch: ['#0EA5E9', '#38BDF8', '#0F766E'],
    gpuClass: 'balanced',
  },
  {
    id: 'reef',
    name: 'Bioluminescent Reef',
    short: 'Reef',
    tagline: 'Deep-UV & neon reef green for aquariums and hydro rooms',
    swatch: ['#A855F7', '#22D3EE', '#4ADE80'],
    gpuClass: 'ultra',
  },
  {
    id: 'eco',
    name: 'Eco-Glass / Low-GPU',
    short: 'Eco',
    tagline: 'Matte acrylic survival mode · keeps 60 fps on API < 31 hardware',
    swatch: ['#22C55E', '#0E7490', '#EAB308'],
    gpuClass: 'lite',
  },
];

export type WaterPalette = {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  state: 'pristine' | 'scale' | 'hazard' | 'neutral';
  label: string;
};

/** Map water state → the three chromatic anchors used across the entire UI. */
export function waterPalette(ntu: number, lsi: number, hardness: number): WaterPalette {
  const hazardous = ntu > 5.0 || lsi < -0.5;
  const scaling = lsi > 0.5 || hardness > 180;
  const pristine = ntu < 1.0 && lsi >= -0.2 && lsi <= 0.2;

  if (hazardous) {
    return {
      primary: '#F59E0B',
      secondary: '#F97316',
      accent: '#EF4444',
      glow: 'rgba(245, 158, 11, 0.55)',
      state: 'hazard',
      label: 'Bio-Hazard Amber · corrosive or turbid water',
    };
  }
  if (scaling) {
    return {
      primary: '#8B5CF6',
      secondary: '#6366F1',
      accent: '#E2E8F0',
      glow: 'rgba(139, 92, 246, 0.5)',
      state: 'scale',
      label: 'Mineral Violet · scaling / alkaline shift',
    };
  }
  if (pristine) {
    return {
      primary: '#06B6D4',
      secondary: '#0EA5E9',
      accent: '#10B981',
      glow: 'rgba(6, 182, 212, 0.55)',
      state: 'pristine',
      label: 'Crystalline Aqua · balanced, low-turbidity water',
    };
  }
  return {
    primary: '#0EA5E9',
    secondary: '#14B8A6',
    accent: '#10B981',
    glow: 'rgba(14, 165, 233, 0.45)',
    state: 'neutral',
    label: 'Glacial Cyan · within treatment envelope',
  };
}

export function applyWaterPalette(p: WaterPalette, root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--aqa-primary', p.primary);
  root.style.setProperty('--aqa-secondary', p.secondary);
  root.style.setProperty('--aqa-accent', p.accent);
  root.style.setProperty('--aqa-glow', p.glow);
}

export function applyTheme(id: ThemeId, root: HTMLElement = document.documentElement): void {
  root.setAttribute('data-theme', id);
}

// ── shared CSS fragments ────────────────────────────────────────────────────

export const prismBorder = css`
  border: 1px solid transparent;
  background:
    linear-gradient(var(--aqa-glass-fill, rgba(9, 22, 38, 0.62)), var(--aqa-glass-fill, rgba(9, 22, 38, 0.62))) padding-box,
    linear-gradient(135deg, rgba(103, 232, 249, 0.4), rgba(255, 255, 255, 0.2) 48%, rgba(52, 211, 153, 0.35)) border-box;
`;

export const glassSurface = css`
  position: relative;
  border-radius: var(--aqa-radius, 22px);
  background: var(--aqa-glass-fill);
  border: 1px solid var(--aqa-glass-border);
  backdrop-filter: blur(var(--aqa-blur, 22px)) saturate(var(--aqa-saturate, 1.35));
  -webkit-backdrop-filter: blur(var(--aqa-blur, 22px)) saturate(var(--aqa-saturate, 1.35));
  box-shadow:
    var(--aqa-shadow, 0 24px 60px -28px rgba(0, 0, 0, 0.75)),
    inset 0 1px 1px rgba(255, 255, 255, 0.35),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06);
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 220ms ease,
    box-shadow 260ms ease,
    background 320ms ease;
`;

export const squish = css`
  :host,
  .squish {
    transition:
      transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 280ms ease;
  }
  .squish:hover {
    transform: scale(1.015);
  }
  .squish:active {
    transform: scale(0.96);
  }
`;

export const monoFont = css`ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, monospace`;
export const displayFont = css`'Inter Tight', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`;

export const focusRing = css`
  outline: 2px solid var(--aqa-primary);
  outline-offset: 3px;
`;

export const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/** Typography + reset shared by every component (injected once from app-shell). */
export const globalStyles: CSSResult = css`
  :root {
    color-scheme: dark;
    --aqa-radius: 22px;
    --aqa-radius-sm: 14px;
    --aqa-blur: 22px;
    --aqa-saturate: 1.35;
    --aqa-primary: #06b6d4;
    --aqa-secondary: #0ea5e9;
    --aqa-accent: #10b981;
    --aqa-glow: rgba(6, 182, 212, 0.55);
    --aqa-bg: #030914;
    --aqa-bg-2: #061426;
    --aqa-ink: #e8f6ff;
    --aqa-ink-dim: #9fc2d6;
    --aqa-ink-faint: #6b8ea3;
    --aqa-glass-fill: rgba(9, 22, 38, 0.62);
    --aqa-glass-fill-strong: rgba(7, 18, 32, 0.82);
    --aqa-glass-border: rgba(148, 214, 236, 0.18);
    --aqa-shadow: 0 24px 60px -28px rgba(0, 0, 0, 0.75);
    --aqa-hairline: rgba(148, 214, 236, 0.12);
    --aqa-ok: #10b981;
    --aqa-warn: #f59e0b;
    --aqa-bad: #ef4444;
    --aqa-info: #38bdf8;
    --aqa-mono: ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, monospace;
    font-family: 'Inter Tight', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  :root[data-theme='glacial'] {
    color-scheme: light;
    --aqa-bg: #eef6fb;
    --aqa-bg-2: #dcecf6;
    --aqa-ink: #0b1d2a;
    --aqa-ink-dim: #33546a;
    --aqa-ink-faint: #64819a;
    --aqa-glass-fill: rgba(255, 255, 255, 0.8);
    --aqa-glass-fill-strong: rgba(255, 255, 255, 0.94);
    --aqa-glass-border: rgba(12, 74, 110, 0.16);
    --aqa-shadow: 0 22px 48px -26px rgba(12, 55, 84, 0.42);
    --aqa-hairline: rgba(12, 74, 110, 0.12);
  }

  :root[data-theme='reef'] {
    --aqa-bg: #0a0318;
    --aqa-bg-2: #160b2e;
    --aqa-ink: #f1e9ff;
    --aqa-ink-dim: #c3b0e6;
    --aqa-ink-faint: #8f7ab5;
    --aqa-glass-fill: rgba(24, 10, 46, 0.66);
    --aqa-glass-fill-strong: rgba(18, 7, 36, 0.86);
    --aqa-glass-border: rgba(196, 160, 255, 0.2);
    --aqa-shadow: 0 24px 64px -26px rgba(48, 0, 92, 0.8);
    --aqa-hairline: rgba(196, 160, 255, 0.14);
  }

  :root[data-theme='eco'] {
    --aqa-bg: #06080a;
    --aqa-bg-2: #0c1410;
    --aqa-ink: #dff3e6;
    --aqa-ink-dim: #9db8a8;
    --aqa-ink-faint: #6f8a7c;
    --aqa-glass-fill: rgba(12, 20, 16, 0.94);
    --aqa-glass-fill-strong: rgba(8, 14, 11, 0.98);
    --aqa-glass-border: rgba(134, 200, 160, 0.2);
    --aqa-shadow: 0 8px 20px -14px rgba(0, 0, 0, 0.9);
    --aqa-blur: 0px;
    --aqa-saturate: 1;
    --aqa-hairline: rgba(134, 200, 160, 0.14);
  }

  :root[data-theme='eco'] * {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    min-height: 100%;
    background: var(--aqa-bg);
    color: var(--aqa-ink);
  }

  body {
    overflow-x: hidden;
    transition: background 420ms ease, color 320ms ease;
  }

  ::selection {
    background: color-mix(in oklab, var(--aqa-primary) 42%, transparent);
    color: var(--aqa-ink);
  }

  a {
    color: var(--aqa-primary);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  button {
    font: inherit;
    color: inherit;
  }

  h1,
  h2,
  h3,
  h4 {
    margin: 0;
    font-weight: 640;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  p {
    margin: 0;
    line-height: 1.55;
  }

  code,
  kbd,
  pre {
    font-family: var(--aqa-mono);
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: color-mix(in oklab, var(--aqa-ink-faint) 45%, transparent);
    border-radius: 99px;
    border: 3px solid transparent;
    background-clip: content-box;
  }
`;

/** Utility for components that only need a chunk of the system. */
export const injectOnce = (sheet: CSSResult) => unsafeCSS(String(sheet));
