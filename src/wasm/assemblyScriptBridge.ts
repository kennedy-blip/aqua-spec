/**
 * AQUA-SPECTRA — src/wasm/assemblyScriptBridge.ts
 *
 * Deterministic execution bridge over assembly/nephelometry_dsp.ts.
 *
 * Primary path: instantiates the pre-compiled, base64-embedded WASM module
 * (no fetch, no asset URL, no MIME-type risk — works from file:// inside the
 * Capacitor APK and from any Vercel edge cache).
 *
 * Safeguard path: if WebAssembly is unavailable/blocked (CSP, ancient WebView,
 * a corrupt binary) the bridge transparently falls back to a numerically
 * identical TypedArray implementation, so the product never breaks a build or
 * a field deployment. `backend` reports which path is live and the UI shows it.
 */
import type {
  NephelometryKernel,
  WasmBackendInfo,
} from './types';
import { DSP_WASM_BASE64, DSP_WASM_BYTES, DSP_WASM_SHA256 } from './nephelometry_dsp.wasm.b64';

const INSTANCE_CACHE = new WeakMap<object, NephelometryKernel>();

type RawExports = {
  memory: WebAssembly.Memory;
  scratchA(): number;
  scratchB(): number;
  ntuFromScatter(s: number, i: number, d: number, k: number): number;
  ntuFromContrast(c: number, b: number, p: number): number;
  tssFromNtu(n: number, k: number): number;
  potabilityClass(n: number): number;
  hazeLossPct(n: number, p: number): number;
  tdsFromEc(ec: number, t: number): number;
  deltaE00(l1: number, a1: number, b1: number, l2: number, a2: number, b2: number): number;
  matchBestPad(l: number, a: number, b: number, count: number): number;
  padDeltaE(l: number, a: number, b: number, i: number): number;
  deltaEQuality(de: number): number;
  whiteBalanceGains(r: number, g: number, b: number): void;
  scratchBAt(i: number): number;
  fillPctFromResonance(f: number, c: number, h: number): number;
  resonanceFromFill(p: number, c: number, h: number): number;
  speedOfSound(t: number): number;
  flowFromAcoustic(level: number, centroid: number, cal: number): number;
  rmsForFlow(q: number, cal: number): number;
  dominantFrequency(n: number, sr: number, lo: number, hi: number): number;
  rmsDb(n: number): number;
  spectralCentroid(n: number, sr: number): number;
  selfTest(): number;
};

function decodeBase64(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // Node / test environments
  const buf = (globalThis as { Buffer?: { from(s: string, enc: string): Uint8Array } }).Buffer;
  if (buf) return new Uint8Array(buf.from(b64, 'base64'));
  throw new Error('No base64 decoder available');
}

let cached: { kernel: NephelometryKernel; info: WasmBackendInfo } | null = null;
let pending: Promise<{ kernel: NephelometryKernel; info: WasmBackendInfo }> | null = null;

export function wasmBackendInfo(): WasmBackendInfo | null {
  return cached?.info ?? null;
}

/**
 * Load (or reuse) the DSP kernel. Safe to call on every render — instantiation
 * happens once per page and is cached for the lifetime of the document.
 */
export async function loadDspKernel(): Promise<{ kernel: NephelometryKernel; info: WasmBackendInfo }> {
  if (cached) return cached;
  if (pending) return pending;

  pending = (async () => {
    const t0 = perfNow();
    try {
      if (typeof WebAssembly === 'undefined') throw new Error('WebAssembly unavailable');
      const bytes = decodeBase64(DSP_WASM_BASE64);
      const module = await WebAssembly.compile(bytes.buffer as ArrayBuffer);
      const instance = await WebAssembly.instantiate(module, {
        env: {
          abort: () => {
            throw new Error('WASM abort');
          },
        },
      });
      const ex = instance.exports as unknown as RawExports;
      const kernel = wrapExports(ex);
      const selfTest = kernel.selfTest();
      if (Math.abs(selfTest - 100) > 1e-6) throw new Error(`self-test failed (${selfTest})`);
      const info: WasmBackendInfo = {
        backend: 'wasm',
        abiVersion: 1,
        wasmBytes: DSP_WASM_BYTES,
        sha256: DSP_WASM_SHA256,
        selfTest,
        bootMs: round2(perfNow() - t0),
        label: 'AssemblyScript → WASM (f64 native)',
      };
      cached = { kernel, info };
      return cached;
    } catch (err) {
      const kernel = makeTypedArrayKernel();
      const info: WasmBackendInfo = {
        backend: 'typedarray',
        abiVersion: 1,
        wasmBytes: DSP_WASM_BYTES,
        sha256: DSP_WASM_SHA256,
        selfTest: kernel.selfTest(),
        bootMs: round2(perfNow() - t0),
        label: 'TypedArray fallback (WASM unavailable)',
        error: err instanceof Error ? err.message : String(err),
      };
      cached = { kernel, info };
      return cached;
    } finally {
      pending = null;
    }
  })();

  return pending;
}

function perfNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function wrapExports(ex: RawExports): NephelometryKernel {
  const aOff = () => ex.scratchA() / 8;
  const bOff = () => ex.scratchB() / 8;
  // Memory can grow after instantiation; never cache the view.
  const heap = () => new Float64Array(ex.memory.buffer);

  return {
    scratchA: aOff,
    scratchB: bOff,
    heap,
    ntuFromScatter: (s, i, d, k) => ex.ntuFromScatter(s, i, d, k),
    ntuFromContrast: (c, b, p) => ex.ntuFromContrast(c, b, p),
    tssFromNtu: (n, k) => ex.tssFromNtu(n, k),
    potabilityClass: (n) => ex.potabilityClass(n),
    hazeLossPct: (n, p) => ex.hazeLossPct(n, p),
    tdsFromEc: (ec, t) => ex.tdsFromEc(ec, t),
    deltaE00: (l1, a1, b1, l2, a2, b2) => ex.deltaE00(l1, a1, b1, l2, a2, b2),
    matchBestPad: (l, a, b, count) => ex.matchBestPad(l, a, b, count),
    padDeltaE: (l, a, b, i) => ex.padDeltaE(l, a, b, i),
    deltaEQuality: (de) => ex.deltaEQuality(de),
    whiteBalanceGains: (r, g, b) => {
      ex.whiteBalanceGains(r, g, b);
      return [ex.scratchBAt(0), ex.scratchBAt(1), ex.scratchBAt(2)];
    },
    fillPctFromResonance: (f, c, h) => ex.fillPctFromResonance(f, c, h),
    resonanceFromFill: (p, c, h) => ex.resonanceFromFill(p, c, h),
    speedOfSound: (t) => ex.speedOfSound(t),
    flowFromAcoustic: (level, centroid, cal) => ex.flowFromAcoustic(level, centroid, cal),
    rmsForFlow: (q, cal) => ex.rmsForFlow(q, cal),
    dominantFrequency: (n, sr, lo, hi) => ex.dominantFrequency(n, sr, lo, hi),
    rmsDb: (n) => ex.rmsDb(n),
    spectralCentroid: (n, sr) => ex.spectralCentroid(n, sr),
    selfTest: () => ex.selfTest(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TypedArray fallback — identical arithmetic, no WebAssembly required.
// Compiled from the same equations so results stay in lock-step.
// ══════════════════════════════════════════════════════════════════════════════

export function makeTypedArrayKernel(): NephelometryKernel {
  const A = new Float64Array(8192);
  const B = new Float64Array(8192);

  const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);
  const sq = (x: number) => x * x;
  const d2r = (d: number) => (d * Math.PI) / 180;

  const hueAngle = (b: number, ap: number) => {
    if (Math.abs(b) < 1e-12 && Math.abs(ap) < 1e-12) return 0;
    let h = (Math.atan2(b, ap) * 180) / Math.PI;
    if (h < 0) h += 360;
    return h;
  };

  const deltaE00 = (l1: number, a1: number, b1: number, l2: number, a2: number, b2: number) => {
    const c1 = Math.hypot(a1, b1);
    const c2 = Math.hypot(a2, b2);
    const cBar = (c1 + c2) / 2;
    const cBar7 = cBar ** 7;
    const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + 6103515625)));
    const a1p = (1 + g) * a1;
    const a2p = (1 + g) * a2;
    const c1p = Math.hypot(a1p, b1);
    const c2p = Math.hypot(a2p, b2);
    const h1p = hueAngle(b1, a1p);
    const h2p = hueAngle(b2, a2p);
    const dLp = l2 - l1;
    const dCp = c2p - c1p;
    const cProd = c1p * c2p;
    let dHp = 0;
    if (cProd > 1e-12) {
      let dh = h2p - h1p;
      if (dh > 180) dh -= 360;
      else if (dh < -180) dh += 360;
      dHp = 2 * Math.sqrt(cProd) * Math.sin(d2r(dh) / 2);
    }
    const lBarP = (l1 + l2) / 2;
    const cBarP = (c1p + c2p) / 2;
    let hBarP = h1p + h2p;
    if (cProd > 1e-12) {
      const diff = Math.abs(h1p - h2p);
      if (diff <= 180) hBarP = (h1p + h2p) / 2;
      else if (h1p + h2p < 360) hBarP = (h1p + h2p + 360) / 2;
      else hBarP = (h1p + h2p - 360) / 2;
    }
    const t =
      1 -
      0.17 * Math.cos(d2r(hBarP - 30)) +
      0.24 * Math.cos(d2r(2 * hBarP)) +
      0.32 * Math.cos(d2r(3 * hBarP + 6)) -
      0.2 * Math.cos(d2r(4 * hBarP - 63));
    const dTheta = 30 * Math.exp(-sq((hBarP - 275) / 25));
    const cBarP7 = cBarP ** 7;
    const rC = 2 * Math.sqrt(cBarP7 / (cBarP7 + 6103515625));
    const sL = 1 + (0.015 * sq(lBarP - 50)) / Math.sqrt(20 + sq(lBarP - 50));
    const sC = 1 + 0.045 * cBarP;
    const sH = 1 + 0.015 * cBarP * t;
    const rT = -Math.sin(d2r(2 * dTheta)) * rC;
    const tL = dLp / sL;
    const tC = dCp / sC;
    const tH = dHp / sH;
    return Math.sqrt(tL * tL + tC * tC + tH * tH + rT * tC * tH);
  };

  const fft = (n: number) => {
    const bits = Math.log2(n);
    for (let i = 0; i < n; i++) {
      let r = 0;
      let x = i;
      for (let b = 0; b < bits; b++) {
        r = (r << 1) | (x & 1);
        x >>= 1;
      }
      if (r > i) {
        [A[i], A[r]] = [A[r], A[i]];
        [B[i], B[r]] = [B[r], B[i]];
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len;
      const wlenR = Math.cos(ang);
      const wlenI = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let wr = 1;
        let wi = 0;
        for (let k = 0; k < len / 2; k++) {
          const ur = A[i + k];
          const ui = B[i + k];
          const vr = A[i + k + len / 2] * wr - B[i + k + len / 2] * wi;
          const vi = A[i + k + len / 2] * wi + B[i + k + len / 2] * wr;
          A[i + k] = ur + vr;
          B[i + k] = ui + vi;
          A[i + k + len / 2] = ur - vr;
          B[i + k + len / 2] = ui - vi;
          const nwr = wr * wlenR - wi * wlenI;
          wi = wr * wlenI + wi * wlenR;
          wr = nwr;
        }
      }
    }
  };

  const hann = (n: number) => {
    for (let i = 0; i < n; i++) A[i] *= 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  };

  return {
    scratchA: () => 0,
    scratchB: () => 0,
    heap: () => A,
    ntuFromScatter: (s, i, d, k) => {
      const sv = s - d;
      const i0 = i - d;
      if (i0 < 1e-3) return 100;
      const raw = k * (sv / i0) * 1000;
      if (raw <= 0) return 0.1;
      return clamp(raw * (1 + 0.016 * raw), 0.1, 100);
    },
    ntuFromContrast: (c, b, p) => {
      const cc = clamp(c, 0.002, 0.999);
      const c0 = clamp(b, 0.05, 1);
      const ratio = c0 / cc;
      if (ratio <= 1) return 0.1;
      const a = 40 * (30 / clamp(p, 5, 200));
      return clamp(a * Math.log(ratio) ** 1.05, 0.1, 100);
    },
    tssFromNtu: (n, k) => clamp(n * (k > 0.05 ? k : 2.1), 0, 500),
    potabilityClass: (n) => (n < 1 ? 0 : n <= 5 ? 1 : n <= 25 ? 2 : 3),
    hazeLossPct: (n, p) => clamp((1 - Math.exp(-0.0125 * n * (p / 30))) * 100, 0, 99.9),
    tdsFromEc: (ec, t) => clamp((ec / (1 + 0.02 * (t - 25))) * 0.55, 0, 5000),
    deltaE00,
    matchBestPad: (l, a, b, count) => {
      const n = clamp(count, 1, 512);
      let best = 0;
      let bestDe = 1e9;
      for (let i = 0; i < n; i++) {
        const de = deltaE00(l, a, b, A[i * 3], A[i * 3 + 1], A[i * 3 + 2]);
        B[i] = de;
        if (de < bestDe) {
          bestDe = de;
          best = i;
        }
      }
      return best;
    },
    padDeltaE: (l, a, b, i) => deltaE00(l, a, b, A[i * 3], A[i * 3 + 1], A[i * 3 + 2]),
    deltaEQuality: (de) => (de < 1 ? 0 : de < 2.3 ? 1 : de < 5 ? 2 : 3),
    whiteBalanceGains: (r, g, b) => {
      const rr = Math.max(r, 1);
      const gg = Math.max(g, 1);
      const bb = Math.max(b, 1);
      const ref = (rr + gg + bb) / 3;
      B[0] = ref / rr;
      B[1] = ref / gg;
      B[2] = ref / bb;
      return [B[0], B[1], B[2]];
    },
    fillPctFromResonance: (f, c, h) => {
      if (f < 40) return 0;
      return clamp(((h - c / (4 * f)) / Math.max(h, 1e-4)) * 100, 0, 100);
    },
    resonanceFromFill: (p, c, h) => {
      const hh = (clamp(p, 0, 99.5) / 100) * h;
      return clamp(c / (4 * Math.max(h - hh, 0.004)), 150, 4500);
    },
    speedOfSound: (t) => 331.3 * Math.sqrt(1 + t / 273.15),
    flowFromAcoustic: (level, centroid, cal) => {
      const over = level - 28;
      if (over <= 0) return 0;
      const aperture = clamp(centroid / 1200, 0.35, 2.2);
      const k = cal > 0.02 ? cal : 0.42;
      return clamp(k * 4.2 * (over / 10) ** 1.15 * aperture, 0, 30);
    },
    rmsForFlow: (q, cal) => {
      const k = cal > 0.02 ? cal : 0.42;
      return clamp(28 + 10 * (clamp(q, 0.05, 30) / (k * 4.2)) ** (1 / 1.15), 28, 99);
    },
    dominantFrequency: (n, sr, lo, hi) => {
      const nn = clamp(n, 8, 8192);
      hann(nn);
      B.fill(0, 0, nn);
      fft(nn);
      const half = nn >> 1;
      const binHz = sr / nn;
      const kLo = clamp(Math.ceil(lo / binHz), 1, half - 1);
      const kHi = clamp(Math.floor(hi / binHz), kLo, half - 1);
      let peakK = kLo;
      let peakM = -1;
      for (let k = kLo; k <= kHi; k++) {
        const m = sq(A[k]) + sq(B[k]);
        if (m > peakM) {
          peakM = m;
          peakK = k;
        }
      }
      if (peakK > 1 && peakK < half - 1) {
        const y0 = sq(A[peakK - 1]) + sq(B[peakK - 1]);
        const y1 = sq(A[peakK]) + sq(B[peakK]);
        const y2 = sq(A[peakK + 1]) + sq(B[peakK + 1]);
        const denom = y0 - 2 * y1 + y2;
        if (Math.abs(denom) > 1e-15) {
          const delta = clamp((0.5 * (y0 - y2)) / denom, -0.5, 0.5);
          return (peakK + delta) * binHz;
        }
      }
      return peakK * binHz;
    },
    rmsDb: (n) => {
      let acc = 0;
      for (let i = 0; i < n; i++) acc += sq(A[i]);
      const rms = Math.sqrt(acc / n);
      if (rms < 1e-6) return 0;
      return clamp(100 + (20 * Math.log10(rms)), 0, 100);
    },
    spectralCentroid: (n, sr) => {
      const nn = clamp(n, 8, 8192);
      B.fill(0, 0, nn);
      hann(nn);
      fft(nn);
      const half = nn >> 1;
      const binHz = sr / nn;
      let num = 0;
      let den = 0;
      for (let k = 1; k < half; k++) {
        const hz = k * binHz;
        if (hz < 150 || hz > 6000) continue;
        const m = Math.hypot(A[k], B[k]);
        num += hz * m;
        den += m;
      }
      return den > 1e-12 ? num / den : 0;
    },
    selfTest: () => deltaE00(0, 0, 0, 100, 0, 0),
  } as NephelometryKernel;
}

export { INSTANCE_CACHE };
