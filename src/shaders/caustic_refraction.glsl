// ═════════════════════════════════════════════════════════════════════════════
// AQUA-SPECTRA — src/shaders/caustic_refraction.glsl
// WebGL2 fragment shader · 60 fps Snell's-law underwater caustics.
//
// Two refractive layers are ray-bent per pixel and summed with an inverse-
// square focal caustic term (the classic "photon convergence" model):
//
//     caustic(p) ≈ 1 / (1 + k·|∇·F|)          divergence of the refracted field
//
// Turbidity and pH feed the medium: higher NTU absorbs and forward-scatters
// more light (Beer–Lambert extinction), while pH < 6.5 / > 8.5 shifts the
// absorption spectrum toward corrosion amber or mineral violet.
//
// Uniform contract (set from src/gl/causticRenderer.ts):
//   uTime      float  seconds since boot
//   uRes       vec2   drawing-buffer size in px
//   uNtu       float  0..100 turbidity (drives turbidity + extinction)
//   uPh        float  5..9.5
//   uLsi       float  −3..3
//   uLight     vec2   −1..1 gyroscope/cursor specular tilt
//   uEnergy    float  0..1 hazard intensity (drives red/amber shift)
//   uPalette   vec3   primary hue anchor
//   uPalette2  vec3   accent hue anchor
//   uLowPower  float  1.0 = skip the second refraction layer
// ═════════════════════════════════════════════════════════════════════════════
#version 300 es
precision highp float;

out vec4 fragColor;

uniform float uTime;
uniform vec2 uRes;
uniform float uNtu;
uniform float uPh;
uniform float uLsi;
uniform vec2 uLight;
uniform float uEnergy;
uniform vec3 uPalette;
uniform vec3 uPalette2;
uniform float uLowPower;

const float TAU = 6.28318530718;

// ── value noise & fbm ───────────────────────────────────────────────────────
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += amp * vnoise(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return v;
}

// Refracted photon density: the divergence of a warped gradient field.
// Bright filaments appear where neighbouring rays converge (Snell focusing).
float causticLayer(vec2 uv, float t, float scale, float speed) {
  vec2 p = uv * scale;
  p += vec2(fbm(p * 0.5 + t * speed), fbm(p * 0.5 - t * speed * 0.7));
  vec2 grad = vec2(
    fbm(p + vec2(0.01, 0.0)) - fbm(p - vec2(0.01, 0.0)),
    fbm(p + vec2(0.0, 0.01)) - fbm(p - vec2(0.0, 0.01))
  );
  float divergence = length(grad) * 40.0;
  return 1.0 / (1.0 + divergence * 6.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;

  // Perspective-corrected vessel coordinates (light enters from top-left).
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  p += uLight * 0.12;                       // gyroscope / cursor specular slosh

  // ── medium model: turbidity + pH ─────────────────────────────────────────
  float turbidity = clamp(uNtu / 25.0, 0.0, 1.0);
  float acidity = clamp((7.0 - uPh) / 2.5, 0.0, 1.0);
  float alkalinity = clamp((uPh - 7.5) / 2.0, 0.0, 1.0);

  // Snell's law: index of refraction rises with suspended solids.
  float ior = 1.333 + turbidity * 0.09;
  float bend = (ior - 1.0) * 2.4;
  vec2 wobble = vec2(
    sin(p.y * 3.2 + uTime * 0.35),
    cos(p.x * 2.7 - uTime * 0.28)
  ) * bend;

  vec2 q = p + wobble * 0.06;

  float t = uTime * 0.22;
  float c1 = causticLayer(q, t, 3.1, 1.0);
  float c2 = 0.0;
  if (uLowPower < 0.5) {
    c2 = causticLayer(q * 1.45 + 7.3, t * 1.28, 4.7, 0.82);
  }
  float caustic = pow(c1, 2.2) * 1.35 + pow(c2, 2.6) * 0.9;

  // Depth vignette: water darkens away from the light source.
  float depth = smoothstep(1.25, 0.05, length(p - uLight * 0.22));
  caustic *= mix(0.22, 1.0, depth);

  // Beer–Lambert extinction: 1 NTU removes ~1.2 %/cm through a 30 cm vessel.
  float pathLen = 0.30 * (1.0 + turbidity * 0.6);
  float extinction = exp(-uNtu * 0.0125 * pathLen * 100.0 * 0.01 * 30.0);
  extinction = mix(0.18, 1.0, extinction);

  // Forward scattering veils contrast (haze) — the Tyndall effect.
  float veil = turbidity * 0.30;

  // ── chroma: water-state palette blending ─────────────────────────────────
  vec3 glacial = uPalette;
  vec3 mineral = vec3(0.545, 0.361, 0.965);   // #8B5CF6
  vec3 hazard = vec3(0.960, 0.620, 0.043);    // #F59E0B
  vec3 deep = vec3(0.012, 0.035, 0.078);      // #030914 abyss

  vec3 base = mix(vec3(0.02, 0.06, 0.11), glacial * 0.22, 0.55);
  base = mix(base, mineral * 0.20, alkalinity * 0.55);
  base = mix(base, hazard * 0.22, clamp(uEnergy * 0.85 + acidity * 0.25, 0.0, 1.0));
  base = mix(deep, base, 0.86);

  vec3 spec = mix(glacial, uPalette2, 0.45 + 0.25 * sin(uTime * 0.18));
  spec = mix(spec, hazard, clamp(uEnergy, 0.0, 1.0));
  spec = mix(spec, mineral, alkalinity * 0.6);

  vec3 col = base + spec * caustic * extinction * (1.0 - veil);
  col += vec3(0.85, 0.95, 1.0) * veil * 0.16;

  // Meniscus: a bright refractive rim where the liquid meets the glass.
  float rim = smoothstep(0.42, 0.62, length(p * vec2(0.85, 1.0)));
  rim *= 1.0 - smoothstep(0.62, 0.9, length(p * vec2(0.85, 1.0)));
  col += spec * rim * 0.18 * (1.0 - turbidity * 0.5);

  // Subtle dither to defeat 8-bit banding in the dark abyss.
  float dither = (hash21(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  col += dither;

  fragColor = vec4(col, 1.0);
}
