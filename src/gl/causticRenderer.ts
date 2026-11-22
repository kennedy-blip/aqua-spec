/**
 * AQUA-SPECTRA — src/gl/causticRenderer.ts
 *
 * Minimal WebGL2 full-screen-triangle renderer for caustic_refraction.glsl.
 * Owns its own canvas, resizes from a ResizeObserver, throttles to a target FPS
 * in low-power mode, pauses when the tab is hidden, and degrades to a CSS
 * gradient if WebGL2 is unavailable (old Android WebViews).
 */
import type { WaterPalette } from '../styles/tokens';

import CAUSTIC_FRAGMENT from '../shaders/caustic_refraction.glsl?raw';

const VERTEX = `#version 300 es
layout(location = 0) in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const DEFAULT_FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec3 uPalette;
uniform vec3 uPalette2;
void main() { fragColor = vec4(mix(vec3(0.012, 0.035, 0.078), uPalette * 0.25, 0.6), 1.0); }`;

export type CausticUniforms = {
  ntu: number;
  ph: number;
  lsi: number;
  light: { x: number; y: number };
  energy: number;
  palette: WaterPalette;
  lowPower: boolean;
};

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

export class CausticRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private uniforms = new Map<string, WebGLUniformLocation | null>();
  private raf = 0;
  private start = 0;
  private lastFrame = 0;
  private observer: ResizeObserver | null = null;
  private state: CausticUniforms = {
    ntu: 0.35,
    ph: 7.3,
    lsi: -0.05,
    light: { x: 0, y: 0 },
    energy: 0,
    palette: {
      primary: '#06B6D4',
      secondary: '#0EA5E9',
      accent: '#10B981',
      glow: 'rgba(6,182,212,0.55)',
      state: 'pristine',
      label: '',
    },
    lowPower: false,
  };
  private targetFps = 60;
  private visible = true;
  private onVisibility = () => {
    this.visible = !document.hidden;
    if (this.visible) this.startLoop();
  };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'aqa-caustics';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.init();
  }

  private init(): void {
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      this.canvas.dataset.fallback = 'true';
      return;
    }
    this.gl = gl;
    const frag = this.compileShader(gl, gl.FRAGMENT_SHADER, CAUSTIC_FRAGMENT) ?? this.compileShader(gl, gl.FRAGMENT_SHADER, DEFAULT_FRAGMENT);
    const vert = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX);
    if (!frag || !vert) {
      this.gl = null;
      this.canvas.dataset.fallback = 'true';
      return;
    }
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.gl = null;
      this.canvas.dataset.fallback = 'true';
      return;
    }
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    this.program = program;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const name of ['uTime', 'uRes', 'uNtu', 'uPh', 'uLsi', 'uLight', 'uEnergy', 'uPalette', 'uPalette2', 'uLowPower']) {
      this.uniforms.set(name, gl.getUniformLocation(program, name));
    }
    this.start = performance.now();
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // The shader source is user-inspectable in the Polyglot Vault; log once.
      console.warn('[caustics] shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.canvas);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(parent);
    this.resize();
    this.startLoop();
  }

  unmount(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.observer?.disconnect();
    this.observer = null;
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas.remove();
  }

  setState(patch: Partial<CausticUniforms>): void {
    this.state = { ...this.state, ...patch };
    if (patch.lowPower) this.targetFps = patch.lowPower ? 24 : 60;
    if (patch.lowPower) this.canvas.style.opacity = patch.lowPower ? '0.35' : '1';
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.state.lowPower ? 1 : 1.75);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  private startLoop(): void {
    if (this.raf || !this.gl || !this.program) return;
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const minDelta = 1000 / this.targetFps;
      if (now - this.lastFrame < minDelta) return;
      this.lastFrame = now;
      this.draw(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private draw(now: number): void {
    const gl = this.gl;
    if (!gl || !this.program) return;
    this.resize();
    const { state } = this;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const u = this.uniforms;
    gl.uniform1f(u.get('uTime') ?? null, (now - this.start) / 1000);
    gl.uniform2f(u.get('uRes') ?? null, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.get('uNtu') ?? null, state.ntu);
    gl.uniform1f(u.get('uPh') ?? null, state.ph);
    gl.uniform1f(u.get('uLsi') ?? null, state.lsi);
    gl.uniform2f(u.get('uLight') ?? null, state.light.x, state.light.y);
    gl.uniform1f(u.get('uEnergy') ?? null, state.energy);
    gl.uniform3fv(u.get('uPalette') ?? null, hexToVec3(state.palette.primary));
    gl.uniform3fv(u.get('uPalette2') ?? null, hexToVec3(state.palette.accent));
    gl.uniform1f(u.get('uLowPower') ?? null, state.lowPower ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  get isLive(): boolean {
    return this.gl !== null;
  }
}
