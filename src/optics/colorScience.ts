/**
 * AQUA-SPECTRA — src/optics/colorScience.ts
 *
 * Colour pipeline for the 7-pad reagent strip colorimeter:
 *   sRGB (8-bit, gamma) → linear RGB → XYZ (D65) → CIE L*a*b*
 *   then ΔE00 matching against the pad chart (computed in WASM).
 *
 * All transfer functions use the IEC 61966-2-1 piecewise sRGB curve, not the
 * naive 2.2 gamma, because reagent-pad ΔE below 2 is dominated by that error.
 */
import type { Lab } from '../wasm/types';

export type Rgb = { r: number; g: number; b: number };

export const LAB_D65_WHITE = { X: 95.047, Y: 100.0, Z: 108.883 } as const;

export function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgbChannel(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

export function rgbToXyz({ r, g, b }: Rgb) {
  const R = srgbChannelToLinear(r);
  const G = srgbChannelToLinear(g);
  const B = srgbChannelToLinear(b);
  return {
    X: (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) * 100,
    Y: (R * 0.2126729 + G * 0.7151522 + B * 0.072175) * 100,
    Z: (R * 0.0193339 + G * 0.119192 + B * 0.9503041) * 100,
  };
}

const EPS = 216 / 24389;
const KAPPA = 24389 / 27;

function fLab(t: number): number {
  return t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
}

export function rgbToLab(rgb: Rgb): Lab {
  const { X, Y, Z } = rgbToXyz(rgb);
  const fx = fLab(X / LAB_D65_WHITE.X);
  const fy = fLab(Y / LAB_D65_WHITE.Y);
  const fz = fLab(Z / LAB_D65_WHITE.Z);
  return {
    L: Math.round((116 * fy - 16) * 100) / 100,
    a: Math.round(500 * (fx - fy) * 100) / 100,
    b: Math.round(200 * (fy - fz) * 100) / 100,
  };
}

/** Lab → sRGB, used to paint the chart swatches from the same references. */
export function labToRgb({ L, a, b }: Lab): Rgb {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const xr = fx ** 3 > EPS ? fx ** 3 : (116 * fx - 16) / KAPPA;
  const yr = L > KAPPA * EPS ? ((L + 16) / 116) ** 3 : L / KAPPA;
  const zr = fz ** 3 > EPS ? fz ** 3 : (116 * fz - 16) / KAPPA;
  const X = xr * LAB_D65_WHITE.X;
  const Y = yr * LAB_D65_WHITE.Y;
  const Z = zr * LAB_D65_WHITE.Z;
  const R = X * 0.0324045 + Y * -0.0153716 + Z * -0.0049858;
  const G = X * -0.0096924 + Y * 0.0187601 + Z * 0.0004154;
  const B = X * 0.0005557 + Y * -0.0020402 + Z * 0.0105722;
  return {
    r: linearToSrgbChannel(Math.max(0, R)),
    g: linearToSrgbChannel(Math.max(0, G)),
    b: linearToSrgbChannel(Math.max(0, B)),
  };
}

export const rgbCss = (c: Rgb) => `rgb(${c.r}, ${c.g}, ${c.b})`;

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// 7-in-1 reagent pad chart — pH, Free Cl, Alkalinity, Hardness, NO3, NO2, Cu/Pb
// ══════════════════════════════════════════════════════════════════════════════

export type PadKey = 'ph' | 'chlorine' | 'alkalinity' | 'hardness' | 'nitrate' | 'nitrite' | 'copper';

export type PadSwatch = {
  /** Value this swatch represents in the pad's native unit. */
  value: number;
  label: string;
  /** Printed pad colour (sRGB). Converted to Lab at module load. */
  hex: string;
};

export type PadChart = {
  key: PadKey;
  name: string;
  unit: string;
  decimals: number;
  description: string;
  swatches: PadSwatch[];
};

export const PAD_CHARTS: Record<PadKey, PadChart> = {
  ph: {
    key: 'ph',
    name: 'pH',
    unit: 'pH',
    decimals: 1,
    description: 'Bromothymol/methyl-red dual indicator. Read against the 6.0–8.4 arc.',
    swatches: [
      { value: 6.0, label: '6.0', hex: '#f4a01c' },
      { value: 6.4, label: '6.4', hex: '#f3bb25' },
      { value: 6.8, label: '6.8', hex: '#d8cf22' },
      { value: 7.2, label: '7.2', hex: '#a7c53a' },
      { value: 7.6, label: '7.6', hex: '#5fae58' },
      { value: 8.0, label: '8.0', hex: '#2f9d8f' },
      { value: 8.4, label: '8.4', hex: '#2c86b5' },
    ],
  },
  chlorine: {
    key: 'chlorine',
    name: 'Free Chlorine',
    unit: 'ppm',
    decimals: 2,
    description: 'DPD pink scale. Tap water should read 0.2–1.0 ppm residual.',
    swatches: [
      { value: 0.0, label: '0', hex: '#f6f4ee' },
      { value: 0.2, label: '0.2', hex: '#f3dfe0' },
      { value: 0.5, label: '0.5', hex: '#efc0c6' },
      { value: 1.0, label: '1.0', hex: '#e79ba8' },
      { value: 2.0, label: '2.0', hex: '#d96f8b' },
      { value: 3.0, label: '3.0', hex: '#c04a72' },
      { value: 5.0, label: '5.0', hex: '#9b2c5c' },
    ],
  },
  alkalinity: {
    key: 'alkalinity',
    name: 'Total Alkalinity',
    unit: 'ppm CaCO₃',
    decimals: 0,
    description: 'Acid/base buffer capacity. 40–120 ppm keeps pH stable and pipes passivated.',
    swatches: [
      { value: 0, label: '0', hex: '#f8d84f' },
      { value: 40, label: '40', hex: '#e7c94a' },
      { value: 80, label: '80', hex: '#9fc887' },
      { value: 120, label: '120', hex: '#58b8a4' },
      { value: 180, label: '180', hex: '#2f95b8' },
      { value: 240, label: '240', hex: '#2f6cb0' },
      { value: 360, label: '360', hex: '#3a4f9e' },
    ],
  },
  hardness: {
    key: 'hardness',
    name: 'Total Hardness',
    unit: 'ppm CaCO₃',
    decimals: 0,
    description: 'Calcium + magnesium. Above 180 ppm scale forms in heaters and boilers.',
    swatches: [
      { value: 0, label: '0', hex: '#b9e6f0' },
      { value: 50, label: '50', hex: '#95d3e2' },
      { value: 120, label: '120', hex: '#6fb9cf' },
      { value: 180, label: '180', hex: '#4f97b4' },
      { value: 250, label: '250', hex: '#3d7296' },
      { value: 425, label: '425', hex: '#345478' },
      { value: 800, label: '800', hex: '#2b3b5c' },
    ],
  },
  nitrate: {
    key: 'nitrate',
    name: 'Nitrate (NO₃⁻)',
    unit: 'ppm',
    decimals: 1,
    description: 'Cadmium-reduction purple scale. EPA MCL is 10 ppm as N (≈44 ppm NO₃).',
    swatches: [
      { value: 0, label: '0', hex: '#fbf6ea' },
      { value: 2, label: '2', hex: '#f2e2c4' },
      { value: 5, label: '5', hex: '#e6c89a' },
      { value: 10, label: '10', hex: '#d1a06f' },
      { value: 20, label: '20', hex: '#b3744f' },
      { value: 40, label: '40', hex: '#8f4a3a' },
      { value: 80, label: '80', hex: '#6b2b2b' },
    ],
  },
  nitrite: {
    key: 'nitrite',
    name: 'Nitrite (NO₂⁻)',
    unit: 'ppm',
    decimals: 2,
    description: 'Diazotisation pink scale. Above 1 ppm in drinking water is an acute risk.',
    swatches: [
      { value: 0, label: '0', hex: '#f8f2ec' },
      { value: 0.25, label: '0.25', hex: '#f2d7dc' },
      { value: 0.5, label: '0.5', hex: '#eaaeb9' },
      { value: 1.0, label: '1.0', hex: '#dc8498' },
      { value: 2.0, label: '2.0', hex: '#c65a78' },
      { value: 5.0, label: '5.0', hex: '#a03b5c' },
      { value: 10.0, label: '10.0', hex: '#7b2542' },
    ],
  },
  copper: {
    key: 'copper',
    name: 'Copper / Lead Risk',
    unit: 'ppm Cu',
    decimals: 2,
    description: 'Cuprizone indicator — a proxy for plumbosolvency. Any colour above 0.3 ppm means corrosive water is dissolving metal.',
    swatches: [
      { value: 0.0, label: '0', hex: '#f4f0e6' },
      { value: 0.1, label: '0.1', hex: '#e9e3d0' },
      { value: 0.3, label: '0.3', hex: '#dfd2b0' },
      { value: 0.6, label: '0.6', hex: '#d2b98a' },
      { value: 1.0, label: '1.0', hex: '#c19a5f' },
      { value: 2.0, label: '2.0', hex: '#a8783f' },
      { value: 3.0, label: '3.0', hex: '#8b5628' },
    ],
  },
};

/** Pre-computed Lab references for every pad, flattened for the WASM matcher. */
export const PAD_LABS: Record<PadKey, Lab[]> = Object.fromEntries(
  (Object.keys(PAD_CHARTS) as PadKey[]).map((k) => [k, PAD_CHARTS[k].swatches.map((s) => rgbToLab(hexToRgb(s.hex)))]),
) as Record<PadKey, Lab[]>;

/**
 * Interpolate a physical value from the best match and its runner-up. Reagent
 * pads are continuous gradients, so linear interpolation between two adjacent
 * swatches by ΔE00 distance recovers roughly half a chart step of precision.
 */
export function interpolatePadValue(
  chart: PadChart,
  deltas: number[],
  bestIndex: number,
): { value: number; confidence: number; neighbour: number } {
  const de = deltas;
  let neighbour = -1;
  let bestNeighbourDe = Infinity;
  if (bestIndex > 0) {
    bestNeighbourDe = de[bestIndex - 1];
    neighbour = bestIndex - 1;
  }
  if (bestIndex < chart.swatches.length - 1 && de[bestIndex + 1] < bestNeighbourDe) {
    bestNeighbourDe = de[bestIndex + 1];
    neighbour = bestIndex + 1;
  }
  const own = Math.max(de[bestIndex], 1e-6);
  const withNeighbour = chart.swatches[neighbour]?.value ?? chart.swatches[bestIndex].value;
  const ownValue = chart.swatches[bestIndex].value;
  // weight ∝ how much closer the neighbour is than the winner
  const w = neighbour < 0 ? 0 : Math.max(0, Math.min(0.5, own / Math.max(bestNeighbourDe + own, 1e-6) - 0.5));
  const value = ownValue + (withNeighbour - ownValue) * w;
  const confidence = Math.max(0, Math.min(1, 1 - own / 12));
  return { value: Math.round(value / stepOf(chart)) * stepOf(chart), confidence, neighbour };
}

function stepOf(chart: PadChart): number {
  const steps = chart.swatches.slice(1).map((s, i) => Math.abs(s.value - chart.swatches[i].value));
  return steps.length ? Math.min(...steps) : 1;
}

export const PAD_ORDER: PadKey[] = ['ph', 'chlorine', 'alkalinity', 'hardness', 'nitrate', 'nitrite', 'copper'];
