/**
 * AQUA-SPECTRA — src/data/samples.ts
 * Five built-in water profiles: the reference ships these so the entire
 * pipeline (optics → chemistry → Datalog → purification) can be exercised in
 * one tap on Vercel or offline in the APK.
 */

export type SampleProfile = {
  id: string;
  name: string;
  shortName: string;
  scenario: string;
  /** Nephelometric turbidity in NTU. */
  ntu: number;
  /** Measured pad values, in each pad's native unit. */
  ph: number;
  chlorine: number;
  chloramine: number;
  alkalinity: number;
  hardness: number;
  nitrate: number;
  nitrite: number;
  copper: number;
  tds: number;
  tempC: number;
  /** Plumbing material — feeds the plumbosolvency Datalog rules. */
  plumbing: 'lead' | 'copper' | 'galvanised' | 'pex' | 'unknown';
  source: 'municipal' | 'shallow well' | 'deep well' | 'stream' | 'rain' | 'spring';
  hardware: ('espresso' | 'reef_tank' | 'hydroponics' | 'water_heater' | 'none')[];
  /** Swatch tint used by the sample chip. */
  tint: string;
  headline: string;
  detail: string;
  expectedSeal: 'PASS' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
};

export const SAMPLES: SampleProfile[] = [
  {
    id: 'alpine',
    name: 'Pristine Alpine Spring / Filtered Tap',
    shortName: 'Alpine Spring',
    scenario: 'Modern municipal house, daily use, copper plumbing',
    ntu: 0.35,
    ph: 7.3,
    chlorine: 0.45,
    chloramine: 0,
    alkalinity: 58,
    hardness: 65,
    nitrate: 1.2,
    nitrite: 0,
    copper: 0,
    tds: 145,
    tempC: 18,
    plumbing: 'copper',
    source: 'municipal',
    hardware: ['espresso'],
    tint: '#06B6D4',
    headline: 'OPTIMAL — 0.35 NTU',
    detail: 'LSI −0.05 (balanced), calcium hardness 65 ppm, zero lead/copper signal. SCA-friendly for espresso.',
    expectedSeal: 'PASS',
  },
  {
    id: 'corrosive',
    name: 'Old City Home · Acidic Corrosive Water',
    shortName: 'Corrosive City',
    scenario: '1920s lead-service-line house with soft, low-alkalinity water',
    ntu: 0.8,
    ph: 6.1,
    chlorine: 0.1,
    chloramine: 0.2,
    alkalinity: 22,
    hardness: 48,
    nitrate: 2.0,
    nitrite: 0.02,
    copper: 0.42,
    tds: 92,
    tempC: 24,
    plumbing: 'lead',
    source: 'municipal',
    hardware: ['espresso', 'water_heater'],
    tint: '#EF4444',
    headline: 'DANGER — LEAD/COPPER PIPE LEACHING',
    detail: 'pH 6.1 with 22 ppm alkalinity has no buffering capacity: LSI −1.45 means the water dissolves the protective CaCO₃ film and attacks lead solder and brass fixtures. Copper pad reads 0.42 ppm.',
    expectedSeal: 'CRITICAL',
  },
  {
    id: 'agricultural',
    name: 'Agricultural Well Runoff',
    shortName: 'Ag Well',
    scenario: 'Shallow irrigation well downstream of fertilised fields',
    ntu: 4.2,
    ph: 7.6,
    chlorine: 0,
    chloramine: 0,
    alkalinity: 240,
    hardness: 310,
    nitrate: 18.5,
    nitrite: 0.08,
    copper: 0.05,
    tds: 640,
    tempC: 21,
    plumbing: 'galvanised',
    source: 'shallow well',
    hardware: ['water_heater', 'hydroponics'],
    tint: '#F59E0B',
    headline: 'HIGH NITRATE & LIMESCALE ALERT',
    detail: 'Nitrate 18.5 ppm exceeds the 10 ppm MCL — never mix infant formula. 310 ppm hardness and LSI +0.71 means heavy scale in heaters; alkalinity 240 ppm will flatten espresso extraction.',
    expectedSeal: 'CRITICAL',
  },
  {
    id: 'stream',
    name: 'Backcountry Mountain Stream After Rain',
    shortName: 'Rain Stream',
    scenario: 'Surface stream, 14.8 NTU, no disinfectant residual',
    ntu: 14.8,
    ph: 6.9,
    chlorine: 0,
    chloramine: 0,
    alkalinity: 18,
    hardness: 32,
    nitrate: 0.8,
    nitrite: 0,
    copper: 0,
    tds: 68,
    tempC: 8,
    plumbing: 'unknown',
    source: 'stream',
    hardware: ['none'],
    tint: '#F97316',
    headline: 'CRYPTO/GIARDIA RISK — PRE-FILTER + BOIL',
    detail: '14.8 NTU of storm sediment shields pathogens from UV and chlorine. At 8 °C the disinfection contact time doubles to 60 min. Pre-filter to <5 NTU then rolling-boil 3 min.',
    expectedSeal: 'CRITICAL',
  },
  {
    id: 'espresso',
    name: 'Specialty Espresso / Barista Target Water',
    shortName: 'Barista',
    scenario: 'RO-blended café water tuned to the SCA Gold Cup band',
    ntu: 0.2,
    ph: 7.0,
    chlorine: 0,
    chloramine: 0,
    alkalinity: 40,
    hardness: 75,
    nitrate: 0.5,
    nitrite: 0,
    copper: 0,
    tds: 118,
    tempC: 20,
    plumbing: 'pex',
    source: 'spring',
    hardware: ['espresso'],
    tint: '#10B981',
    headline: 'SCA GOLD CUP STANDARD',
    detail: 'Alkalinity 40 ppm and hardness 75 ppm sit exactly in the SCA extraction window. LSI −0.25 protects the boiler from scale while keeping the brew bright.',
    expectedSeal: 'PASS',
  },
];

export const sampleById = (id: string): SampleProfile => SAMPLES.find((s) => s.id === id) ?? SAMPLES[0];

/** Container presets for the acoustic pour gauge (height in metres). */
export type ContainerPreset = {
  id: string;
  name: string;
  heightM: number;
  volumeMl: number;
  resonanceBaseHz: number;
};

export const CONTAINERS: ContainerPreset[] = [
  { id: 'mug', name: 'Mug', heightM: 0.1, volumeMl: 350, resonanceBaseHz: 858 },
  { id: 'pint', name: 'Pint Glass', heightM: 0.15, volumeMl: 568, resonanceBaseHz: 572 },
  { id: 'thermos', name: 'Thermos Bottle', heightM: 0.24, volumeMl: 750, resonanceBaseHz: 357 },
  { id: 'carafe', name: 'Coffee Carafe', heightM: 0.19, volumeMl: 1000, resonanceBaseHz: 451 },
];
