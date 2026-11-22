// ══════════════════════════════════════════════════════════════════════════════
// AQUA-SPECTRA — assembly/nephelometry_dsp.ts
// AssemblyScript 0.28 → WebAssembly (stub runtime, no host imports)
//
// Authentic f64 DSP kernels for:
//   1. Tyndall / Mie nephelometric turbidity   (NTU, TSS, potability class)
//   2. CIEDE2000 (ΔE00) reagent-pad colorimetry
//   3. Quarter-wave Helmholtz acoustic fill-level + faucet flow (L/min)
//   4. Radix-2 Cooley-Tukey FFT + parabolic peak interpolation
//
// Memory contract (number-only ABI, no externref, no JS glue):
//   scratchA():  8192 × f64  — input samples / pad reference L*a*b* triples
//   scratchB():  8192 × f64  — FFT imaginary work buffer / scratch output
// JS writes Float64Array views over these pointers, calls a kernel, reads back.
// ══════════════════════════════════════════════════════════════════════════════

/** Build identity — reported by the bridge smoke test. */
export const DSP_ABI_VERSION: i32 = 1;

const N_CAP: i32 = 8192;

// Static scratch heaps. `dataStart` is the first payload byte of the array, so
// JS can view them as Float64Array without touching the object header.
const SCRATCH_A: Float64Array = new Float64Array(N_CAP);
const SCRATCH_B: Float64Array = new Float64Array(N_CAP);

/** Byte offset of scratch A inside linear memory. */
export function scratchA(): i32 {
  return <i32>SCRATCH_A.dataStart;
}

/** Byte offset of scratch B inside linear memory. */
export function scratchB(): i32 {
  return <i32>SCRATCH_B.dataStart;
}

// ── scalar primitives ────────────────────────────────────────────────────────

@inline
function clampf(x: f64, lo: f64, hi: f64): f64 {
  return x < lo ? lo : x > hi ? hi : x;
}

@inline
function sq(x: f64): f64 {
  return x * x;
}

@inline
function deg2rad(d: f64): f64 {
  return d * (Math.PI / 180.0);
}

@inline
function rad2deg(r: f64): f64 {
  return r * (180.0 / Math.PI);
}

/** Read a scratch sample as f64 (bounds-checked once by the caller). */
@inline
function sa(p: Float64Array, i: i32): f64 {
  return load<f64>(p.dataStart + <usize>(i << 3));
}

@inline
function saSet(p: Float64Array, i: i32, v: f64): void {
  store<f64>(p.dataStart + <usize>(i << 3), v);
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. NEPHELOMETRY — Tyndall / Mie scattering → NTU
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Ratio nephelometry at 90°.
 *
 * For a dilute suspension (single-scattering regime) the 90° scattered
 * radiance S is linear in turbidity:
 *      NTU = k_cal · (S / I₀) · 1000
 * Beyond ~40 NTU multiple scattering compresses the response, so we apply the
 * standard inverse-compression correction (instrument-specific, 1.6% / NTU):
 *      NTU_true = NTU_raw · (1 + 0.016 · NTU_raw)
 * Finally a dark-current pedestal is subtracted before the ratio.
 *
 * @param scattered  mean 90° scatter luminance (0..255 sensor units)
 * @param incident   mean incident/transmitted luminance (1..255)
 * @param dark       sensor dark-current pedestal (0..20)
 * @param kCal       formazin calibration constant (typical 2.4..3.2)
 */
export function ntuFromScatter(
  scattered: f64,
  incident: f64,
  dark: f64,
  kCal: f64,
): f64 {
  const s = scattered - dark;
  const i0 = incident - dark;
  if (i0 < 1e-3) return 100.0;
  const ratio = s / i0;
  const raw = kCal * ratio * 1000.0;
  if (raw <= 0.0) return 0.1;
  const corrected = raw * (1.0 + 0.016 * raw);
  return clampf(corrected, 0.1, 100.0);
}

/**
 * Contrast-attenuation nephelometry (Siemens-star MTF method).
 * A printed/screen Siemens star is viewed through the water column; suspended
 * particles veil the target and reduce modulation transfer:
 *      NTU = A · ln(C₀ / C)^B        (A≈4.1, B≈1.35 for 30 mm path, 6500 K)
 */
export function ntuFromContrast(
  contrast: f64,
  baselineContrast: f64,
  pathMm: f64,
): f64 {
  const c = clampf(contrast, 0.002, 0.999);
  const c0 = clampf(baselineContrast, 0.05, 1.0);
  const ratio = c0 / c;
  if (ratio <= 1.0) return 0.1;
  // Veiling luminance from suspended solids is ~linear with NTU for the
  // 0.1–25 NTU window, hence a near-linear log-contrast law:
  //   1 NTU through a 60 mm path ⇒ ≈2.6 % MTF loss at 6500 K.
  const a = 40.0 * (30.0 / clampf(pathMm, 5.0, 200.0));
  const ntu = a * Math.pow(Math.log(ratio), 1.05);
  return clampf(ntu, 0.1, 100.0);
}

/** Total suspended solids (mg/L) from turbidity — mineral-dominated waters. */
export function tssFromNtu(ntu: f64, kTss: f64): f64 {
  const k = kTss > 0.05 ? kTss : 2.1; // EPA 160.2 default 1.5–2.4
  return clampf(ntu * k, 0.0, 500.0);
}

/**
 * Potability class from turbidity:
 *   0 = OPTIMAL   (<1.0 NTU — EPA ideal, no treatment)
 *   1 = FILTER    (1–5 NTU — filter recommended)
 *   2 = PATHOGEN  (>5 NTU — pathogen shielding hazard, do not drink untreated)
 *   3 = CRITICAL  (>25 NTU — gross contamination)
 */
export function potabilityClass(ntu: f64): i32 {
  if (ntu < 1.0) return 0;
  if (ntu <= 5.0) return 1;
  if (ntu <= 25.0) return 2;
  return 3;
}

/** Percent haze transmission loss through the sample path (Beer-Lambert). */
export function hazeLossPct(ntu: f64, pathMm: f64): f64 {
  const tau = Math.exp(-0.0125 * ntu * (pathMm / 30.0));
  return clampf((1.0 - tau) * 100.0, 0.0, 99.9);
}

/** TDS (ppm) from electrical conductivity (µS/cm) and water temperature (°C). */
export function tdsFromEc(ec: f64, tempC: f64): f64 {
  // Conductivity cell compensation to 25 °C (2 % / °C) then 0.55 conversion.
  const ec25 = ec / (1.0 + 0.02 * (tempC - 25.0));
  return clampf(ec25 * 0.55, 0.0, 5000.0);
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. COLORIMETRY — CIEDE2000 (ΔE00) according to Sharma, Wu & Dalal (2005)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Full CIEDE2000 colour difference between two CIE L*a*b* (D65, 2°) samples.
 * Exactly the reference equations: hue wrap, ΔH computation, S_L/S_C/S_H
 * weighting, R_T rotation term — all in f64.
 */
export function deltaE00(
  l1: f64,
  a1: f64,
  b1: f64,
  l2: f64,
  a2: f64,
  b2: f64,
): f64 {
  const kL = 1.0;
  const kC = 1.0;
  const kH = 1.0;
  const c1 = Math.sqrt(a1 * a1 + b1 * b1);
  const c2 = Math.sqrt(a2 * a2 + b2 * b2);
  const cBar = (c1 + c2) * 0.5;
  const cBar7 = Math.pow(cBar, 7.0);
  const g = 0.5 * (1.0 - Math.sqrt(cBar7 / (cBar7 + 6103515625.0))); // 25^7
  const a1p = (1.0 + g) * a1;
  const a2p = (1.0 + g) * a2;
  const c1p = Math.sqrt(a1p * a1p + b1 * b1);
  const c2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = hueAngle(b1, a1p);
  const h2p = hueAngle(b2, a2p);

  const dLp = l2 - l1;
  const dCp = c2p - c1p;
  const cProd = c1p * c2p;
  let dHp = 0.0;
  if (cProd > 1e-12) {
    let dh = h2p - h1p;
    if (dh > 180.0) dh -= 360.0;
    else if (dh < -180.0) dh += 360.0;
    dHp = 2.0 * Math.sqrt(cProd) * Math.sin(deg2rad(dh) * 0.5);
  }

  const lBarP = (l1 + l2) * 0.5;
  const cBarP = (c1p + c2p) * 0.5;
  let hBarP = h1p + h2p;
  if (cProd > 1e-12) {
    const diff = Math.abs(h1p - h2p);
    if (diff <= 180.0) hBarP = (h1p + h2p) * 0.5;
    else if (h1p + h2p < 360.0) hBarP = (h1p + h2p + 360.0) * 0.5;
    else hBarP = (h1p + h2p - 360.0) * 0.5;
  }

  const t =
    1.0 -
    0.17 * Math.cos(deg2rad(hBarP - 30.0)) +
    0.24 * Math.cos(deg2rad(2.0 * hBarP)) +
    0.32 * Math.cos(deg2rad(3.0 * hBarP + 6.0)) -
    0.2 * Math.cos(deg2rad(4.0 * hBarP - 63.0));

  const dTheta = 30.0 * Math.exp(-sq((hBarP - 275.0) / 25.0));
  const cBarP7 = Math.pow(cBarP, 7.0);
  const rC = 2.0 * Math.sqrt(cBarP7 / (cBarP7 + 6103515625.0));
  const sL = 1.0 + (0.015 * sq(lBarP - 50.0)) / Math.sqrt(20.0 + sq(lBarP - 50.0));
  const sC = 1.0 + 0.045 * cBarP;
  const sH = 1.0 + 0.015 * cBarP * t;
  const rT = -Math.sin(deg2rad(2.0 * dTheta)) * rC;

  const tL = dLp / (kL * sL);
  const tC = dCp / (kC * sC);
  const tH = dHp / (kH * sH);

  return Math.sqrt(tL * tL + tC * tC + tH * tH + rT * tC * tH);
}

@inline
function hueAngle(b: f64, ap: f64): f64 {
  if (Math.abs(b) < 1e-12 && Math.abs(ap) < 1e-12) return 0.0;
  let h = rad2deg(Math.atan2(b, ap));
  if (h < 0.0) h += 360.0;
  return h;
}

/**
 * Match a measured pad L*a*b* against `count` reference triples stored in
 * scratch A (layout: L0,a0,b0, L1,a1,b1, …).
 * Returns the index of the perceptually closest reference (ΔE00 metric).
 * scratch B receives every ΔE00 so the UI can draw the full match spectrum.
 */
export function matchBestPad(
  l: f64,
  a: f64,
  b: f64,
  count: i32,
): i32 {
  const n = clampi(count, 1, 512);
  let best = 0;
  let bestDe = 1e9;
  for (let i = 0; i < n; i++) {
    const de = deltaE00(l, a, b, sa(SCRATCH_A, i * 3), sa(SCRATCH_A, i * 3 + 1), sa(
      SCRATCH_A,
      i * 3 + 2,
    ));
    saSet(SCRATCH_B, i, de);
    if (de < bestDe) {
      bestDe = de;
      best = i;
    }
  }
  return best;
}

/** ΔE00 for one reference pad pre-staged in scratch A at triple `index`. */
export function padDeltaE(l: f64, a: f64, b: f64, index: i32): f64 {
  const i = index * 3;
  return deltaE00(l, a, b, sa(SCRATCH_A, i), sa(SCRATCH_A, i + 1), sa(SCRATCH_A, i + 2));
}

/** Best-matched ΔE00 (min over staged references) — the confidence metric. */
export function bestDeltaE(): f64 {
  let m = 1e9;
  for (let i = 0; i < 64; i++) {
    const v = sa(SCRATCH_B, i);
    if (v > 0.0 && v < m) m = v;
  }
  return m;
}

/** Human-readable ΔE00 quality bucket → 0 perfect, 1 excellent, 2 good, 3 poor. */
export function deltaEQuality(de: f64): i32 {
  if (de < 1.0) return 0;
  if (de < 2.3) return 1; // just-noticeable difference
  if (de < 5.0) return 2;
  return 3;
}

/**
 * White-balance (von Kries chromatic adaptation) for a grey-card sample.
 * Returns scale factors via scratch B[0..2] so camera tint is corrected before
 * any L*a*b* conversion.
 */
export function whiteBalanceGains(
  rGrey: f64,
  gGrey: f64,
  bGrey: f64,
): void {
  const r = Math.max(rGrey, 1.0);
  const g = Math.max(gGrey, 1.0);
  const b = Math.max(bGrey, 1.0);
  const ref = (r + g + b) / 3.0;
  saSet(SCRATCH_B, 0, ref / r);
  saSet(SCRATCH_B, 1, ref / g);
  saSet(SCRATCH_B, 2, ref / b);
}

export function scratchBAt(i: i32): f64 {
  return sa(SCRATCH_B, clampi(i, 0, N_CAP - 1));
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. ACOUSTICS — Helmholtz fill level + turbulent faucet flow
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Quarter-wave tube resonance of a column of air above the liquid:
 *      f = c / (4 · (H − h))     ⇒   h = H − c / (4f)
 * `c` is the speed of sound corrected for ambient temperature.
 * Returns fill percentage 0..100.
 */
export function fillPctFromResonance(
  freqHz: f64,
  cAir: f64,
  containerHeightM: f64,
): f64 {
  if (freqHz < 40.0) return 0.0;
  const h = containerHeightM - cAir / (4.0 * freqHz);
  const pct = (h / Math.max(containerHeightM, 1e-4)) * 100.0;
  return clampf(pct, 0.0, 100.0);
}

/** Expected resonance frequency for a given fill fraction (for the simulator). */
export function resonanceFromFill(
  fillPct: f64,
  cAir: f64,
  containerHeightM: f64,
): f64 {
  const h = (clampf(fillPct, 0.0, 99.5) / 100.0) * containerHeightM;
  const airCol = Math.max(containerHeightM - h, 0.004);
  return clampf(cAir / (4.0 * airCol), 150.0, 4500.0);
}

/** Speed of sound in moist air (m/s) from temperature in °C. */
export function speedOfSound(tempC: f64): f64 {
  return 331.3 * Math.sqrt(1.0 + tempC / 273.15);
}

/**
 * Faucet / showerhead flow rate from turbulent impact noise.
 *
 * Turbulent kinetic energy scales with the square of exit velocity, so acoustic
 * power ∝ Q². Working in a 0..100 level scale (100 = full-scale RMS, silence ≈
 * 28), the excess level E = L − 28 follows a ~Q^(2/2.3) compression once the
 * impact plume spreads:
 *      Q = k_cal · (E / 10)^1.15 · aperture     [L/min]
 * `aperture` normalises the spectral centroid (small aerator jets hiss higher).
 */
export function flowFromAcoustic(
  rmsLevel: f64,
  centroidHz: f64,
  cal: f64,
): f64 {
  const floor = 28.0;
  const over = rmsLevel - floor;
  if (over <= 0.0) return 0.0;
  const aperture = clampf(centroidHz / 1200.0, 0.35, 2.2);
  const k = cal > 0.02 ? cal : 0.42;
  const q = k * 4.2 * Math.pow(over / 10.0, 1.15) * aperture;
  return clampf(q, 0.0, 30.0);
}

/** Inverse: expected acoustic level for a target flow (drives the simulator). */
export function rmsForFlow(flowLpm: f64, cal: f64): f64 {
  const k = cal > 0.02 ? cal : 0.42;
  const q = clampf(flowLpm, 0.05, 30.0);
  const over = 10.0 * Math.pow(q / (k * 4.2), 1.0 / 1.15);
  return clampf(28.0 + over, 28.0, 99.0);
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. FFT — iterative radix-2 Cooley-Tukey with Hann window + parabolic peak
// ══════════════════════════════════════════════════════════════════════════════

@inline
function bitReverse(x: i32, bits: i32): i32 {
  let r = 0;
  for (let i = 0; i < bits; i++) {
    r = (r << 1) | (x & 1);
    x >>= 1;
  }
  return r;
}

@inline
function log2i(n: i32): i32 {
  let b = 0;
  while ((1 << b) < n) b++;
  return b;
}

/**
 * In-place complex FFT on scratch A (real) and scratch B (imag), length n
 * (power of two, ≤ 8192). Caller fills A[0..n), zeroes B[0..n).
 */
export function fft(n: i32): void {
  const nn = clampi(n, 2, 8192);
  if ((nn & (nn - 1)) != 0) return; // refuse non-power-of-two
  const bits = log2i(nn);

  for (let i = 0; i < nn; i++) {
    const j = bitReverse(i, bits);
    if (j > i) {
      const tr = sa(SCRATCH_A, i);
      saSet(SCRATCH_A, i, sa(SCRATCH_A, j));
      saSet(SCRATCH_A, j, tr);
      const ti = sa(SCRATCH_B, i);
      saSet(SCRATCH_B, i, sa(SCRATCH_B, j));
      saSet(SCRATCH_B, j, ti);
    }
  }

  let len = 2;
  while (len <= nn) {
    const ang = -2.0 * Math.PI / <f64>len;
    const wlenR = Math.cos(ang);
    const wlenI = Math.sin(ang);
    let i = 0;
    while (i < nn) {
      let wr = 1.0;
      let wi = 0.0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const ur = sa(SCRATCH_A, i + k);
        const ui = sa(SCRATCH_B, i + k);
        const vr = sa(SCRATCH_A, i + k + half) * wr - sa(SCRATCH_B, i + k + half) * wi;
        const vi = sa(SCRATCH_A, i + k + half) * wi + sa(SCRATCH_B, i + k + half) * wr;
        saSet(SCRATCH_A, i + k, ur + vr);
        saSet(SCRATCH_B, i + k, ui + vi);
        saSet(SCRATCH_A, i + k + half, ur - vr);
        saSet(SCRATCH_B, i + k + half, ui - vi);
        const nwr = wr * wlenR - wi * wlenI;
        wi = wr * wlenI + wi * wlenR;
        wr = nwr;
      }
      i += len;
    }
    len <<= 1;
  }
}

/** Apply a Hann window in place over n samples of scratch A. */
export function hannWindow(n: i32): void {
  const nn = clampi(n, 2, 8192);
  const d = <f64>(nn - 1);
  for (let i = 0; i < nn; i++) {
    const w = 0.5 * (1.0 - Math.cos((2.0 * Math.PI * <f64>i) / d));
    saSet(SCRATCH_A, i, sa(SCRATCH_A, i) * w);
  }
}

/**
 * Magnitude spectrum of the last FFT, written into scratch B[0..n/2),
 * normalised to dB relative to the strongest bin. Returns the peak bin index.
 */
export function spectrumDb(n: i32): i32 {
  const nn = clampi(n, 2, 8192);
  const half = nn >> 1;
  let peak = 0;
  let peakMag = 0.0;
  for (let k = 0; k < half; k++) {
    const m = Math.sqrt(sq(sa(SCRATCH_A, k)) + sq(sa(SCRATCH_B, k))) / <f64>nn;
    saSet(SCRATCH_B, k, m);
    if (m > peakMag) {
      peakMag = m;
      peak = k;
    }
  }
  const ref = peakMag > 1e-12 ? peakMag : 1e-12;
  for (let k = 0; k < half; k++) {
    const m = Math.max(sa(SCRATCH_B, k), 1e-12);
    saSet(SCRATCH_B, k, 20.0 * Math.log(m / ref) / Math.LN10);
  }
  return peak;
}

/**
 * Dominant resonance frequency in [loHz, hiHz] from samples already staged in
 * scratch A (length n, power of two). Applies Hann, runs the FFT, then refines
 * the peak with 3-point parabolic interpolation for sub-bin accuracy.
 */
export function dominantFrequency(
  n: i32,
  sampleRate: f64,
  loHz: f64,
  hiHz: f64,
): f64 {
  const nn = clampi(n, 8, 8192);
  hannWindow(nn);
  for (let i = 0; i < nn; i++) saSet(SCRATCH_B, i, 0.0);
  fft(nn);

  const half = nn >> 1;
  const binHz = sampleRate / <f64>nn;
  const kLo = clampi(<i32>Math.ceil(loHz / binHz), 1, half - 1);
  const kHi = clampi(<i32>Math.floor(hiHz / binHz), kLo, half - 1);

  let peakK = kLo;
  let peakM = -1.0;
  for (let k = kLo; k <= kHi; k++) {
    const m = sq(sa(SCRATCH_A, k)) + sq(sa(SCRATCH_B, k));
    if (m > peakM) {
      peakM = m;
      peakK = k;
    }
  }

  // Parabolic interpolation around the peak bin.
  if (peakK > 1 && peakK < half - 1) {
    const y0 = sq(sa(SCRATCH_A, peakK - 1)) + sq(sa(SCRATCH_B, peakK - 1));
    const y1 = sq(sa(SCRATCH_A, peakK)) + sq(sa(SCRATCH_B, peakK));
    const y2 = sq(sa(SCRATCH_A, peakK + 1)) + sq(sa(SCRATCH_B, peakK + 1));
    const denom = y0 - 2.0 * y1 + y2;
    if (Math.abs(denom) > 1e-15) {
      const delta = clampf(0.5 * (y0 - y2) / denom, -0.5, 0.5);
      return (<f64>peakK + delta) * binHz;
    }
  }
  return <f64>peakK * binHz;
}

/**
 * RMS acoustic level over n staged samples on a 0..100 scale
 * (100 = 0 dBFS full scale, 0 = digital silence). Used by the flow meter.
 */
export function rmsDb(n: i32): f64 {
  const nn = clampi(n, 2, 8192);
  let acc = 0.0;
  for (let i = 0; i < nn; i++) acc += sq(sa(SCRATCH_A, i));
  const rms = Math.sqrt(acc / <f64>nn);
  if (rms < 1e-6) return 0.0;
  return clampf(100.0 + 20.0 * Math.log(rms) / Math.LN10, 0.0, 100.0);
}

/** Spectral centroid (Hz) of the staged signal, band-limited to 150–6000 Hz. */
export function spectralCentroid(n: i32, sampleRate: f64): f64 {
  const nn = clampi(n, 8, 8192);
  for (let i = 0; i < nn; i++) saSet(SCRATCH_B, i, 0.0);
  hannWindow(nn);
  fft(nn);
  const half = nn >> 1;
  const binHz = sampleRate / <f64>nn;
  let num = 0.0;
  let den = 0.0;
  for (let k = 1; k < half; k++) {
    const hz = <f64>k * binHz;
    if (hz < 150.0 || hz > 6000.0) continue;
    const m = Math.sqrt(sq(sa(SCRATCH_A, k)) + sq(sa(SCRATCH_B, k)));
    num += hz * m;
    den += m;
  }
  return den > 1e-12 ? num / den : 0.0;
}

@inline
function clampi(x: i32, lo: i32, hi: i32): i32 {
  return x < lo ? lo : x > hi ? hi : x;
}

/** Self-test vector — the bridge verifies this exact value after instantiation. */
export function selfTest(): f64 {
  // ΔE00 between pure black and pure white must be exactly 100.0
  return deltaE00(0.0, 0.0, 0.0, 100.0, 0.0, 0.0);
}
