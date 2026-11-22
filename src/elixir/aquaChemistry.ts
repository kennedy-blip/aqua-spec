/**
 * AQUA-SPECTRA — src/elixir/aquaChemistry.ts
 *
 * Deterministic TypeScript mirror of lib/aqua_chemistry.ex (Elixir 1.17).
 * Every formula, clamp, rounding step, and threshold is replicated
 * line-for-line so the browser and the BEAM produce bit-identical results.
 * The Polyglot Inspector cross-checks both implementations at runtime.
 */

export type Regime = 'corrosive' | 'balanced' | 'scale';
export type Severity = 'critical' | 'high' | 'moderate' | 'none';
export type Verdict = 'optimal' | 'acceptable' | 'warning' | 'critical';

export type DrivingTerms = { a: number; b: number; c: number; d: number };

export type StabilityReport = {
  phs: number;
  lsi: number;
  rsi: number;
  regime: Regime;
  severity: Severity;
  verdict: Verdict;
  leadCopperRiskPct: number;
  leadCopperClass: 'low' | 'watch' | 'elevated' | 'critical';
  remediation: string;
  scaleMmPerYear: number;
  scaleClass: 'none' | 'trace' | 'moderate' | 'heavy' | 'severe';
  applianceLifespanYears: number;
  descaleRecipe: DescaleRecipe;
  drivingTerms: DrivingTerms;
};

export type DescaleRecipe = {
  urgency: 'routine' | 'quarterly' | 'immediate';
  plan: string;
  citricGPerL?: number;
  minutes?: number;
};

export type ScaReport = {
  score: number;
  grade: 'gold_cup' | 'excellent' | 'workable' | 'compromised' | 'unsuitable';
  deviations: { key: string; state: 'ok' | 'low' | 'high'; penalty: number; advice: string | null }[];
  advice: string[];
};

const round = (x: number, d: number) => {
  const f = 10 ** d;
  return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
};

export const round1 = (x: number) => round(x, 1);
export const round2 = (x: number) => round(x, 2);
const round4 = (x: number) => round(x, 4);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// ── 1. LSI / RSI ─────────────────────────────────────────────────────────────

export const termA = (tds: number) => (Math.log10(Math.max(tds, 1)) - 1) / 10;
export const termB = (tC: number) => -13.12 * Math.log10(tC + 273) + 34.55;
export const termC = (ca: number) => Math.log10(Math.max(ca, 1)) - 0.4;
export const termD = (alk: number) => Math.log10(Math.max(alk, 1));

export function saturationPh(tC: number, tds: number, hardness: number, alkalinity: number): number {
  return 9.3 + termA(tds) + termB(tC) - (termC(hardness) + termD(alkalinity));
}

export function assess(ph: number, tC: number, tds: number, ca: number, alk: number): StabilityReport {
  const phs = saturationPh(tC, tds, ca, alk);
  const lsi = ph - phs;
  const rsi = 2 * phs - ph;
  const regime: Regime = lsi < -0.5 ? 'corrosive' : lsi > 0.5 ? 'scale' : 'balanced';
  const severity: Severity =
    lsi < -1.2 ? 'critical' : lsi < -0.5 ? 'high' : lsi > 1.2 ? 'high' : lsi > 0.5 ? 'moderate' : 'none';
  const verdict: Verdict = lsi < -0.5 || lsi > 0.5 ? 'warning' : lsi < -0.2 || lsi > 0.2 ? 'acceptable' : 'optimal';
  const corrosion = plumbosolvency(ph, lsi, tC, alk);
  const scale = scaleProjection(lsi, tC, ca);

  return {
    phs: round2(phs),
    lsi: round2(lsi),
    rsi: round2(rsi),
    regime,
    severity,
    verdict,
    leadCopperRiskPct: corrosion.pct,
    leadCopperClass: corrosion.cls,
    remediation: corrosion.remediation,
    scaleMmPerYear: scale.mmPerYear,
    scaleClass: scale.cls,
    applianceLifespanYears: scale.lifespanYears,
    descaleRecipe: descaleRecipe(scale.mmPerYear),
    drivingTerms: {
      a: round2(termA(tds)),
      b: round2(termB(tC)),
      c: round2(termC(ca)),
      d: round2(termD(alk)),
    },
  };
}

// ── 2. plumbosolvency ───────────────────────────────────────────────────────

export function plumbosolvency(ph: number, lsi: number, tC: number, alkalinity: number) {
  const phRisk = clamp01((7.2 - ph) / 2.2) * 35;
  const lsiRisk = clamp01(-lsi / 1.5) * 30;
  const alkRisk = clamp01((60 - alkalinity) / 60) * 20;
  const tempRisk = clamp01((tC - 15) / 45) * 15;
  const pct = round1(phRisk + lsiRisk + alkRisk + tempRisk);
  const cls = pct >= 70 ? 'critical' : pct >= 40 ? 'elevated' : pct >= 20 ? 'watch' : 'low';
  const remediation =
    pct >= 70
      ? 'CRITICAL: flush cold tap 90 s before every drink; install NSF/ANSI 53 lead filter; have first-draw water lab-tested; never mix infant formula from hot tap.'
      : pct >= 40
        ? 'ELEVATED: flush cold tap 60 s each morning, replace any lead solder/brass fittings, raise pH with a calcite neutraliser to LSI ≥ −0.2.'
        : pct >= 20
          ? 'WATCH: flush standing water 30 s, verify alkalinity ≥ 40 mg/L, re-test after any plumbing work.'
          : 'LOW: plumbing is passivated. Maintain LSI within −0.2…+0.2 with annual alkalinity checks.';
  return { pct, cls: cls as 'low' | 'watch' | 'elevated' | 'critical', remediation };
}

// ── 3. limescale ────────────────────────────────────────────────────────────

export function scaleProjection(lsi: number, tC: number, hardness: number) {
  if (lsi <= 0.1) return { mmPerYear: 0, cls: 'none' as const, lifespanYears: 20 };
  const thermal = 1.065 ** (tC - 25);
  const excess = lsi - 0.1;
  const hw = hardness / 150;
  const mm = round2(0.42 * excess * thermal * hw);
  const cls = mm === 0 ? 'none' : mm < 0.25 ? 'trace' : mm < 0.75 ? 'moderate' : mm < 1.5 ? 'heavy' : 'severe';
  return { mmPerYear: mm, cls: cls as 'none' | 'trace' | 'moderate' | 'heavy' | 'severe', lifespanYears: round1(20 / (1 + mm / 0.35)) };
}

export function descaleRecipe(mm: number): DescaleRecipe {
  if (mm < 0.25) {
    return { urgency: 'routine', plan: 'No action. Keep alkalinity 40–80 mg/L as CaCO₃ and LSI ≤ +0.2.' };
  }
  if (mm < 1.5) {
    return {
      urgency: 'quarterly',
      plan: 'Quarterly descale: recirculate 2 % citric acid at 60 °C for 20 min (≈20 g/L), neutralise with 1 tsp baking soda per litre, flush 3× volume. Blend 20 % remineralised (RO + third-wave mineral packet) back into brew water.',
      citricGPerL: 20,
      minutes: 20,
    };
  }
  return {
    urgency: 'immediate',
    plan: 'IMMEDIATE heavy scale: replace element if output drops >15 %. Then install a 5 µm carbon + polyphosphate scale inhibitor, or switch to RO blending (calcium hardness 40–70 mg/L, alkalinity 30–50 mg/L). Descale with 3 % citric acid in short 10-min cycles until effluent is clear.',
    citricGPerL: 30,
    minutes: 10,
  };
}

// ── 4. unionized ammonia ────────────────────────────────────────────────────

export function unionizedAmmoniaFraction(ph: number, tC: number): number {
  const pka = 9.25 - 0.018 * (tC - 25);
  return round4(1 / (1 + 10 ** (pka - ph)));
}

export function ammoniaRisk(totalN: number, ph: number, tC: number) {
  const fraction = unionizedAmmoniaFraction(ph, tC);
  const free = round4(totalN * fraction);
  const band = free < 0.02 ? 'safe' : free < 0.05 ? 'caution' : free < 0.2 ? 'stress' : 'lethal';
  const waterChangePct = free <= 0.02 ? 0 : round1((1 - 0.02 / free) * 100);
  const advice = {
    safe: 'Free NH₃ is below the 0.02 mg/L chronic threshold. Hold feeding and keep pH stable.',
    caution: 'Approaching the 0.05 mg/L stress line. Do a 25 % water change and add a nitrifying bio-starter.',
    stress: 'NH₃ is stressing stock. 50 % water change, drop pH toward 7.0, increase surface agitation, stop feeding 48 h.',
    lethal: 'LETHAL free ammonia. Immediate 75 % change with temperature-matched dechlorinated water; dose a binding agent; test hourly.',
  }[band]!;
  return { fraction, freeNh3: free, band: band as 'safe' | 'caution' | 'stress' | 'lethal', waterChangePct, advice };
}

// ── 5. SCA scorecard ────────────────────────────────────────────────────────

type Check = { key: string; state: 'ok' | 'low' | 'high'; penalty: number; advice: string | null };

export function scaScore(w: {
  ph: number;
  tds: number;
  alkalinity: number;
  hardness: number;
  sodium: number;
  chloride: number;
}): ScaReport {
  const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  const fix = (state: 'low' | 'high', key: string): string => {
    const table: Record<string, Record<'low' | 'high', string>> = {
      alkalinity: {
        low: 'Add 0.1 g/L baking soda (NaHCO₃) per 10 mg/L alkalinity to buffer acidity.',
        high: 'Dilute 50–70 % with RO or distilled water; alkalinity is the #1 flat-taste culprit.',
      },
      hardness: {
        low: 'Blend in 20 % hard tap water or add a Ca/Mg mineral packet (Epsom + calcium lactate).',
        high: 'Cut with soft/RO water; keep Ca hardness under 150 mg/L to protect the boiler.',
      },
      tds: {
        low: 'Add a third-wave mineral concentrate to reach 80–120 mg/L TDS.',
        high: 'Dilute with RO water until TDS lands at 100–150 mg/L.',
      },
      ph: {
        low: 'Bicarbonate buffer up toward pH 7.0 in 0.05 increments.',
        high: 'Use a pinch of food-grade citric acid (0.02 g/L) or blend in RO water.',
      },
      sodium: { low: 'Sodium is fine — no action.', high: 'Sodium reads soapy at espresso strength — switch to a non-sodium softener.' },
      chloride: {
        low: 'Chloride is fine — no action.',
        high: 'Chloride corrodes stainless boilers above 30 mg/L — use catalytic carbon, not a chloride-based ion exchange.',
      },
    };
    return table[key]?.[state] ?? `Adjust ${key} into the SCA band.`;
  };

  const mk = (key: string, value: number, lo: number, hi: number, slope: number, label: string): Check => {
    if (value >= lo && value <= hi) return { key, state: 'ok', penalty: 0, advice: null };
    if (value < lo) {
      const gap = lo - value;
      return {
        key,
        state: 'low',
        penalty: Math.min(Math.round(gap * slope), 45),
        advice: `${label} is ${fmt(value)} — ${fmt(lo)} is the floor. ${fix('low', key)}`,
      };
    }
    const gap = value - hi;
    return {
      key,
      state: 'high',
      penalty: Math.min(Math.round(gap * slope), 45),
      advice: `${label} is ${fmt(value)} — cap is ${fmt(hi)}. ${fix('high', key)}`,
    };
  };

  const checks: Check[] = [
    mk('ph', w.ph, 6.5, 7.5, 0.35, 'pH'),
    mk('tds', w.tds, 75, 250, 40, 'TDS mg/L'),
    mk('alkalinity', w.alkalinity, 40, 70, 8, 'Alkalinity'),
    mk('hardness', w.hardness, 50, 175, 20, 'Hardness'),
    mk('sodium', w.sodium, 0, 10, 5, 'Sodium'),
    mk('chloride', w.chloride, 0, 30, 12, 'Chloride'),
  ];
  const score = Math.max(0, 100 - checks.reduce((a, c) => a + c.penalty, 0));
  const grade: ScaReport['grade'] =
    score >= 90 ? 'gold_cup' : score >= 75 ? 'excellent' : score >= 60 ? 'workable' : score >= 40 ? 'compromised' : 'unsuitable';
  return { score, grade, deviations: checks.filter((c) => c.state !== 'ok'), advice: checks.filter((c) => c.advice).map((c) => c.advice!) };
}

// ── 6. emergency disinfection ───────────────────────────────────────────────

export type DisinfectantAgent =
  | { kind: 'bleach'; pct: 5.25 | 6.0 | 8.25 }
  | { kind: 'aquatabs'; mg: 8.5 | 17 }
  | { kind: 'iodine'; pct: 2 };

export type DosePlan = {
  agent: string;
  ml: number;
  drops: number;
  tablets?: number;
  contactMin: number;
  targetMgPerL: number;
  steps: string[];
  warning: string | null;
};

export function disinfectionDose(opts: {
  litres: number;
  ntu: number;
  tempC: number;
  agent: DisinfectantAgent;
}): DosePlan {
  const { litres, ntu, tempC, agent } = opts;
  const multiplier = ntu > 5 || tempC < 10 ? 2 : 1;
  const contactMin = ntu > 5 || tempC < 10 ? 60 : 30;
  const target = 2 * multiplier;

  if (agent.kind === 'bleach') {
    const table: Record<number, number> = { 5.25: 2.0, 6.0: 1.75, 8.25: 1.25 };
    const mgPerL = (table[agent.pct] ?? 2.0) * multiplier;
    const ml = (litres * mgPerL) / (agent.pct * 10);
    return {
      agent: `NaOCl ${agent.pct}%`,
      ml: round2(ml),
      drops: Math.round(ml * 20),
      contactMin,
      targetMgPerL: target,
      steps: [
        'Pre-filter through cloth/0.2 µm if NTU > 5 (chlorine is inactivated by sediment).',
        `Measure ${Math.round(ml * 20)} drops (${round2(ml)} mL) into ${round1(litres)} L of water.`,
        `Stir 30 s, wait ${contactMin} min before drinking.`,
        'Re-dose by half if free chlorine smell is gone after the wait.',
      ],
      warning:
        ntu > 5
          ? 'TURBID WATER: chlorine is consumed by organics — the dose has been DOUBLED. Pre-filter or SODIS instead if possible.'
          : null,
    };
  }

  if (agent.kind === 'aquatabs') {
    const litresPerTab = agent.mg === 8.5 ? 1.5 : 3;
    const tablets = Math.trunc(Math.ceil((litres * multiplier) / litresPerTab));
    return {
      agent: `NaDCC ${agent.mg} mg tablet`,
      ml: 0,
      drops: 0,
      tablets,
      contactMin,
      targetMgPerL: target,
      steps: [
        'Pre-filter water before dosing.',
        `Dissolve ${tablets} tablet(s) in ${round1(litres)} L.`,
        `Wait ${contactMin} min — 4 h if Cryptosporidium is suspected.`,
        'Tablets do NOT kill Crypto; boil or use a 1 µm absolute filter.',
      ],
      warning: null,
    };
  }

  const ml = (litres * 0.35 * multiplier) / (agent.pct / 2);
  return {
    agent: `Iodine tincture ${agent.pct}%`,
    ml: round2(ml),
    drops: Math.round(ml * 20),
    contactMin,
    targetMgPerL: target,
    steps: [
      `${Math.round(ml * 20)} drops in ${round1(litres)} L (double for cold/turbid).`,
      `Wait ${contactMin} min.`,
      'Add vitamin C to remove iodine taste.',
    ],
    warning: 'Do NOT use iodine for pregnancy, thyroid disorders, or > 3 weeks continuous use.',
  };
}

// ── 7. altitude boiling ─────────────────────────────────────────────────────

export function boilingPoint(elevationM: number) {
  const p = 101.325 * (1 - 2.25577e-5 * elevationM) ** 5.25588;
  const boilingC = round1(100 * (p / 101.325) ** 0.2304);
  const rollingBoilMin = boilingC >= 95 ? 3 : 3 + Math.ceil((95 - boilingC) / 5);
  const note =
    boilingC >= 95
      ? 'Full rolling boil 3 min kills bacteria, viruses, protozoa and Crypto oocysts.'
      : boilingC >= 85
        ? `Reduced boiling point — hold a rolling boil for at least ${rollingBoilMin} min.`
        : 'Above ~5 500 m water may boil below pasteurisation temperature. Use covered simmer + 10 min, or chemical disinfection.';
  return {
    pressureKpa: round2(p),
    boilingC,
    boilingF: round1((boilingC * 9) / 5 + 32),
    rollingBoilMin,
    pasteuriseC: 70,
    pasteuriseMin: boilingC >= 70 ? 1 : null,
    note,
  };
}

/** Convenience: derive LSI inputs from a 7-pad strip reading and a TDS guess. */
export function stripToLsiInputs(strip: { ph: number; hardness: number; alkalinity: number; tds: number }, tempC: number) {
  return {
    ph: strip.ph,
    tempC,
    tds: strip.tds > 0 ? strip.tds : strip.hardness * 1.4 + 40,
    ca: strip.hardness,
    alk: strip.alkalinity,
  };
}
