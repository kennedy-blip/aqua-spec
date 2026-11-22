/** Shared types for the AssemblyScript DSP bridge. */

export type WasmBackendInfo = {
  backend: 'wasm' | 'typedarray';
  abiVersion: number;
  wasmBytes: number;
  sha256: string;
  selfTest: number;
  bootMs: number;
  label: string;
  error?: string;
};

/**
 * Number-only kernel ABI. `scratchA`/`scratchB` are byte offsets into the WASM
 * linear memory (unused by the TypedArray fallback, which exposes its own heap).
 */
export type NephelometryKernel = {
  scratchA(): number;
  scratchB(): number;
  heap(): Float64Array;
  ntuFromScatter(scattered: number, incident: number, dark: number, kCal: number): number;
  ntuFromContrast(contrast: number, baseline: number, pathMm: number): number;
  tssFromNtu(ntu: number, kTss: number): number;
  potabilityClass(ntu: number): number;
  hazeLossPct(ntu: number, pathMm: number): number;
  tdsFromEc(ec: number, tempC: number): number;
  deltaE00(l1: number, a1: number, b1: number, l2: number, a2: number, b2: number): number;
  matchBestPad(l: number, a: number, b: number, count: number): number;
  padDeltaE(l: number, a: number, b: number, index: number): number;
  deltaEQuality(de: number): number;
  whiteBalanceGains(r: number, g: number, b: number): [number, number, number];
  fillPctFromResonance(freqHz: number, cAir: number, containerHeightM: number): number;
  resonanceFromFill(fillPct: number, cAir: number, containerHeightM: number): number;
  speedOfSound(tempC: number): number;
  flowFromAcoustic(level: number, centroidHz: number, cal: number): number;
  rmsForFlow(flowLpm: number, cal: number): number;
  dominantFrequency(n: number, sampleRate: number, loHz: number, hiHz: number): number;
  rmsDb(n: number): number;
  spectralCentroid(n: number, sampleRate: number): number;
  selfTest(): number;
};

/** CIE L*a*b* colour sample with the RGB it came from. */
export type Lab = { L: number; a: number; b: number };
