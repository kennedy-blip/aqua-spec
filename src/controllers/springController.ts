/**
 * AQUA-SPECTRA — src/controllers/springController.ts
 *
 * A Lit ReactiveController that integrates a real damped-harmonic spring:
 *
 *      m·ẍ + c·ẋ + k·(x − target) = 0
 *
 * solved with semi-implicit Euler at a fixed 1 kHz substep (so results are
 * frame-rate independent) and reported to the host on every animation frame.
 * Used for meniscus gauges, turbidity dials, acoustic fill columns, and card
 * tilt — anything that should settle like liquid rather than tween linearly.
 */
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type SpringConfig = {
  stiffness: number;
  damping: number;
  mass: number;
  precision: number;
  /** Velocity inherited by a new target (0 = dead stop, 1 = full carry-over). */
  velocityCarry: number;
};

export const SPRING_DEFAULTS: SpringConfig = {
  stiffness: 310,
  damping: 24,
  mass: 0.85,
  precision: 0.0008,
  velocityCarry: 0.35,
};

export const SPRING_PRESETS = {
  meniscus: { stiffness: 310, damping: 24, mass: 0.85, precision: 0.0008, velocityCarry: 0.35 },
  dial: { stiffness: 180, damping: 20, mass: 1.1, precision: 0.001, velocityCarry: 0.2 },
  tilt: { stiffness: 420, damping: 30, mass: 0.7, precision: 0.002, velocityCarry: 0.5 },
  gooey: { stiffness: 260, damping: 18, mass: 0.9, precision: 0.001, velocityCarry: 0.6 },
} satisfies Record<string, SpringConfig>;

export type SpringFrame = {
  value: number;
  velocity: number;
  target: number;
  atRest: boolean;
  progress: number;
};

const FRAME = 1 / 60;
const SUBSTEP = 1 / 1000;

export class SpringController implements ReactiveController {
  private raf = 0;
  private config: SpringConfig;
  private value: number;
  private velocity = 0;
  private target: number;
  private from = 0;
  private onChange: (frame: SpringFrame) => void;
  private restCallbacks: (() => void)[] = [];
  private reducedMotion = false;
  private lastTime = 0;

  constructor(
    host: ReactiveControllerHost,
    onChange: (frame: SpringFrame) => void,
    initial = 0,
    config: Partial<SpringConfig> = {},
  ) {
    this.onChange = onChange;
    this.config = { ...SPRING_DEFAULTS, ...config };
    this.value = initial;
    this.target = initial;
    this.from = initial;
    host.addController(this);
  }

  hostConnected(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  hostDisconnected(): void {
    this.stop();
  }

  /** Set a new target. Preserves a fraction of existing momentum for liquid feel. */
  setTarget(target: number): void {
    if (!Number.isFinite(target)) return;
    if (this.reducedMotion) {
      this.value = target;
      this.target = target;
      this.velocity = 0;
      this.emit(true);
      return;
    }
    // Carry momentum only when the target reverses or extends the motion.
    this.velocity *= this.config.velocityCarry;
    this.target = target;
    this.start();
  }

  /** Jump instantly — used when a user drags or a sample preset loads. */
  setValue(value: number): void {
    this.value = value;
    this.from = value;
    this.target = value;
    this.velocity = 0;
    this.emit(true);
  }

  tick(dt: number): void {
    const { stiffness, damping, mass } = this.config;
    let remaining = Math.min(dt, 0.05);
    while (remaining > 0) {
      const h = Math.min(SUBSTEP, remaining);
      const displacement = this.value - this.target;
      const accel = (-stiffness * displacement - damping * this.velocity) / mass;
      this.velocity += accel * h;
      this.value += this.velocity * h;
      remaining -= h;
    }
    const atRest =
      Math.abs(this.value - this.target) < this.config.precision && Math.abs(this.velocity) < this.config.precision * 8;
    if (atRest) {
      this.value = this.target;
      this.velocity = 0;
    }
    this.emit(atRest);
    if (atRest) this.stop();
  }

  get current(): number {
    return this.value;
  }

  get displacementFromStart(): number {
    return this.target - this.from;
  }

  whenAtRest(cb: () => void): void {
    this.restCallbacks.push(cb);
  }

  private start(): void {
    if (this.raf || typeof requestAnimationFrame === 'undefined') {
      if (typeof requestAnimationFrame === 'undefined') {
        // Non-browser (SSR/tests): resolve immediately with a coarse integration.
        for (let i = 0; i < 240; i++) this.tick(FRAME);
      }
      return;
    }
    this.lastTime = performance.now();
    const loop = (now: number) => {
      this.raf = 0;
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.tick(dt || FRAME);
      if (this.raf === 0 && !this.isAtRest()) this.start();
    };
    this.raf = requestAnimationFrame(loop);
  }

  private isAtRest(): boolean {
    return Math.abs(this.value - this.target) < this.config.precision && Math.abs(this.velocity) < this.config.precision * 8;
  }

  private stop(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    if (this.restCallbacks.length) {
      const cbs = this.restCallbacks;
      this.restCallbacks = [];
      cbs.forEach((cb) => cb());
    }
  }

  private emit(atRest: boolean): void {
    const span = Math.abs(this.target - this.from) || 1;
    this.onChange({
      value: this.value,
      velocity: this.velocity,
      target: this.target,
      atRest,
      progress: Math.min(1, Math.abs(this.value - this.from) / span),
    });
    if (atRest) this.from = this.value;
  }
}

/**
 * 2-D spring pair for pointer/tilt shadows. Integrates both axes with the same
 * differential equation and exposes a normalised (-1..1) light vector.
 */
export class Spring2D {
  private x: SpringController;
  private y: SpringController;

  constructor(host: ReactiveControllerHost, onChange: (x: number, y: number) => void) {
    let latestX = 0;
    let latestY = 0;
    const publish = () => onChange(latestX, latestY);
    this.x = new SpringController(host, (f) => {
      latestX = f.value;
      publish();
    }, 0, SPRING_PRESETS.tilt);
    this.y = new SpringController(host, (f) => {
      latestY = f.value;
      publish();
    }, 0, SPRING_PRESETS.tilt);
  }

  moveTo(x: number, y: number): void {
    this.x.setTarget(clamp(x, -1, 1));
    this.y.setTarget(clamp(y, -1, 1));
  }

  reset(): void {
    this.x.setTarget(0);
    this.y.setTarget(0);
  }
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Fluid-simulation helper: a 1-D shallow-water column used by the acoustic
 * pour gauge so the surface has real slosh inertia, not a sine wave.
 */
export class LiquidColumn {
  private heights: Float32Array;
  private velocities: Float32Array;
  private readonly n: number;

  constructor(samples = 48) {
    this.n = samples;
    this.heights = new Float32Array(samples);
    this.velocities = new Float32Array(samples);
  }

  disturbance(index: number, strength: number): void {
    const i = Math.max(0, Math.min(this.n - 1, Math.round(index)));
    for (let d = -3; d <= 3; d++) {
      const j = i + d;
      if (j < 0 || j >= this.n) continue;
      this.velocities[j] += (strength * (4 - Math.abs(d))) / 4;
    }
  }

  step(dt: number, fillLevel: number): Float32Array {
    const tension = 0.045;
    const damp = 0.988;
    const h = this.heights;
    const v = this.velocities;
    for (let i = 0; i < this.n; i++) {
      const left = h[i === 0 ? 0 : i - 1];
      const right = h[i === this.n - 1 ? this.n - 1 : i + 1];
      const laplace = left + right - 2 * h[i];
      v[i] = (v[i] + laplace * tension) * damp;
    }
    for (let i = 0; i < this.n; i++) {
      h[i] = h[i] + v[i] * Math.min(dt, 0.05) * 60;
      // soft anchor toward the fill level so the column settles
      h[i] += (fillLevel - h[i]) * 0.02;
    }
    return h;
  }
}
