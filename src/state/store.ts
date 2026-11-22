/**
 * AQUA-SPECTRA — src/state/store.ts
 *
 * Single observable store for the whole instrument. Lit components subscribe
 * with the `@consumeState` controller and re-render only the values they read.
 *
 * Everything typed here is copied on write so history, reports and the Datalog
 * assertion pass always see immutable snapshots.
 */
import type { SampleProfile } from '../data/samples';
import { SAMPLES } from '../data/samples';
import { assess, type StabilityReport } from '../elixir/aquaChemistry';
import { PAD_ORDER, type PadKey } from '../optics/colorScience';
import { waterPalette, type ThemeId, type WaterPalette } from '../styles/tokens';
import type { WasmBackendInfo } from '../wasm/types';

export type RoleTier = 'household' | 'specialist' | 'director';

export const ROLE_META: Record<RoleTier, { name: string; tier: string; blurb: string; accent: string }> = {
  household: {
    name: 'HOUSEHOLD & HIKER',
    tier: 'Standard',
    blurb: 'Turbidity nephotometer, 7-pad colorimeter, acoustic pour/flow, emergency boil & bleach.',
    accent: '#06B6D4',
  },
  specialist: {
    name: 'WATER QUALITY SPECIALIST',
    tier: 'Pro',
    blurb: 'Adds the Elixir LSI/RSI corrosion lab, SCA espresso architect and unionized ammonia calculator.',
    accent: '#8B5CF6',
  },
  director: {
    name: 'ENVIRONMENTAL LAB DIRECTOR',
    tier: 'Admin',
    blurb: 'Adds the Datalog engine, 5-language polyglot inspector, raw CSV/JSON exporter and cloud sync.',
    accent: '#F59E0B',
  },
};

export type PermissionId = 'camera' | 'microphone' | 'orientation' | 'haptics';

export type PermissionState = 'idle' | 'active' | 'simulator' | 'restricted' | 'denied';

export type PermissionEntry = {
  id: PermissionId;
  label: string;
  detail: string;
  state: PermissionState;
  note: string;
};

export type ReadingPadValues = Record<PadKey, number>;

export type ScanResult = {
  id: string;
  sampleId: string;
  createdAt: number;
  ntu: number;
  tss: number;
  potability: number;
  pads: ReadingPadValues;
  padConfidence: Record<PadKey, number>;
  stability: StabilityReport;
  method: 'simulator' | 'camera' | 'manual';
  healthScore: number;
};

export type Viewport = 'desktop' | 'mobile';
export type ModuleId = 'optics' | 'chemistry' | 'acoustic' | 'purification' | 'vault';
export type AcousticMode = 'pour' | 'flow';

export type AppState = {
  ready: boolean;
  theme: ThemeId;
  viewport: Viewport;
  role: RoleTier;
  module: ModuleId;
  acousticMode: AcousticMode;
  sampleId: string;
  scan: ScanResult | null;
  scanHistory: ScanResult[];
  palette: WaterPalette;
  permissions: Record<PermissionId, PermissionEntry>;
  wasm: WasmBackendInfo | null;
  apkModalOpen: boolean;
  privilegesOpen: boolean;
  inspectorOpen: boolean;
  certificateOpen: boolean;
  navDockActive: ModuleId;
  reducedMotion: boolean;
  soundEnabled: boolean;
  specular: { x: number; y: number };
  toast: { id: number; text: string; tone: 'info' | 'ok' | 'warn' | 'bad' } | null;
  syncQueue: number;
  lastSyncAt: number | null;
  online: boolean;
};

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const initialState = (): AppState => ({
  ready: false,
  theme: 'abyssal',
  viewport: typeof window !== 'undefined' && window.innerWidth < 860 ? 'mobile' : 'desktop',
  role: 'household',
  module: 'optics',
  acousticMode: 'pour',
  sampleId: SAMPLES[0].id,
  scan: null,
  scanHistory: [],
  palette: waterPalette(SAMPLES[0].ntu, -0.05, SAMPLES[0].hardness),
  permissions: {
    camera: {
      id: 'camera',
      label: 'Optical Nephelometry & Colorimetry Camera',
      detail: 'getUserMedia video · 60 fps centre-reticle MTF sampling + L*a*b* pad extraction',
      state: 'idle',
      note: 'Needs a camera; falls back to the 5 built-in simulators.',
    },
    microphone: {
      id: 'microphone',
      label: 'Acoustic Helmholtz & Flow Microphone',
      detail: 'echoCancellation: false · noiseSuppression: false · autoGainControl: false',
      state: 'idle',
      note: 'Raw 200–4 500 Hz spectrum — voice filters would destroy the resonance peak.',
    },
    orientation: {
      id: 'orientation',
      label: '3-Axis Vessel Tilt & Barometric Altitude',
      detail: 'DeviceOrientationEvent + Geolocation altitude for boil-point calibration',
      state: 'idle',
      note: 'Tilts the liquid meniscus and levels the spirit-bubble inclinometer.',
    },
    haptics: {
      id: 'haptics',
      label: 'Droplet Ripple Haptic Engine',
      detail: 'navigator.vibrate / Capacitor Haptics at 85 % and 100 % fill, and on hazard flags',
      state: 'idle',
      note: 'Silent, high-importance alerting for blind and dark-mode pouring.',
    },
  },
  wasm: null,
  apkModalOpen: false,
  privilegesOpen: false,
  inspectorOpen: false,
  certificateOpen: false,
  navDockActive: 'optics',
  reducedMotion: prefersReduced(),
  soundEnabled: true,
  specular: { x: 0, y: 0 },
  toast: null,
  syncQueue: 0,
  lastSyncAt: null,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
});

type Listener = (state: AppState) => void;

class Store {
  private state: AppState = initialState();
  private listeners = new Set<Listener>();
  private batching = 0;
  private dirty = false;

  get(): AppState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Mutate through a producer; notifies once per microtask batch. */
  update(fn: (draft: AppState) => void): void {
    const next: AppState = { ...this.state };
    fn(next);
    this.state = next;
    this.dirty = true;
    if (this.batching === 0) queueMicrotask(() => this.flush());
  }

  batch(fn: () => void): void {
    this.batching++;
    try {
      fn();
    } finally {
      this.batching--;
      if (this.batching === 0) this.flush();
    }
  }

  private flush(): void {
    if (!this.dirty) return;
    this.dirty = false;
    const snapshot = this.state;
    for (const l of this.listeners) l(snapshot);
  }

  setSample(sample: SampleProfile): void {
    this.update((s) => {
      s.sampleId = sample.id;
    });
  }

  /** Recompute the derived water palette from the active scan. */
  refreshPalette(): void {
    const scan = this.state.scan;
    if (!scan) return;
    this.update((s) => {
      s.palette = waterPalette(scan.ntu, scan.stability.lsi, scan.pads.hardness);
    });
  }
}

export const store = new Store();

// ── health score ────────────────────────────────────────────────────────────

/**
 * 0–100 potability/health score. Weighted: turbidity 26, chemistry 22,
 * nitrate 16, nitrite 12, free chlorine residual 12, copper 12.
 */
export function healthScore(pads: ReadingPadValues, ntu: number, stability: StabilityReport): number {
  const turbScore = ntu < 1 ? 26 : ntu <= 5 ? 26 - (ntu - 1) * 3.2 : Math.max(0, 13 - (ntu - 5) * 1.1);
  const lsiAbs = Math.abs(stability.lsi);
  const chemScore = lsiAbs <= 0.2 ? 22 : lsiAbs <= 0.5 ? 22 - (lsiAbs - 0.2) * 22 : Math.max(0, 15.4 - (lsiAbs - 0.5) * 14);
  const nitrateScore = pads.nitrate <= 5 ? 16 : pads.nitrate <= 10 ? 16 - (pads.nitrate - 5) * 2.2 : Math.max(0, 5 - (pads.nitrate - 10) * 0.8);
  const nitriteScore = pads.nitrite <= 0.25 ? 12 : pads.nitrite <= 1 ? 12 - (pads.nitrite - 0.25) * 10 : Math.max(0, 4.5 - (pads.nitrite - 1) * 2);
  const chlorineScore = pads.chlorine >= 0.2 && pads.chlorine <= 1.5 ? 12 : pads.chlorine < 0.2 ? 4 + pads.chlorine * 40 : Math.max(3, 12 - (pads.chlorine - 1.5) * 5);
  const copperScore = pads.copper <= 0.1 ? 12 : pads.copper <= 0.3 ? 12 - (pads.copper - 0.1) * 30 : Math.max(0, 6 - (pads.copper - 0.3) * 6);
  return Math.round(Math.max(0, Math.min(100, turbScore + chemScore + nitrateScore + nitriteScore + chlorineScore + copperScore)));
}

/** Build a complete ScanResult from a sample profile (simulator path). */
export function scanFromSample(sample: SampleProfile, method: ScanResult['method'] = 'simulator'): ScanResult {
  const stability = assess(sample.ph, sample.tempC, sample.tds, sample.hardness, sample.alkalinity);
  const pads: ReadingPadValues = {
    ph: sample.ph,
    chlorine: sample.chlorine,
    alkalinity: sample.alkalinity,
    hardness: sample.hardness,
    nitrate: sample.nitrate,
    nitrite: sample.nitrite,
    copper: sample.copper,
  };
  const padConfidence = Object.fromEntries(PAD_ORDER.map((k) => [k, 0.96])) as Record<PadKey, number>;
  const potability = sample.ntu < 1 ? 0 : sample.ntu <= 5 ? 1 : sample.ntu <= 25 ? 2 : 3;
  return {
    id: `scan_${sample.id}_${Date.now().toString(36)}`,
    sampleId: sample.id,
    createdAt: Date.now(),
    ntu: sample.ntu,
    tss: Math.round(sample.ntu * 2.1 * 100) / 100,
    potability,
    pads,
    padConfidence,
    stability,
    method,
    healthScore: healthScore(pads, sample.ntu, stability),
  };
}
