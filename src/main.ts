/**
 * AQUA-SPECTRA — src/main.ts
 * Entry point: registers the custom-element graph, warms the WASM kernel,
 * wires the service worker (offline APK parity) and removes the splash.
 */
import './app-shell';
import { loadDspKernel } from './wasm/assemblyScriptBridge';
import { embedVaultSources } from './apk/apkArtifact';

import elixirSource from '../lib/aqua_chemistry.ex?raw';
import datalogSource from './rules/water_contaminants.dl?raw';
import glslSource from './shaders/caustic_refraction.glsl?raw';
import assemblySource from '../assembly/nephelometry_dsp.ts?raw';

// Make the five-language vault available to the APK synthesizer and inspector.
embedVaultSources({
  elixir: elixirSource,
  datalog: datalogSource,
  glsl: glslSource,
  assembly: assemblySource,
});

// Kick the kernel immediately — by the time the first module paints, the
// AssemblyScript instance is already warm.
void loadDspKernel();

const splash = document.getElementById('splash');
const app = document.querySelector('aqua-app');

customElements.whenDefined('aqua-app').then(() => {
  requestAnimationFrame(() => {
    app?.classList.add('hydrated');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 520);
    }
  });
});

// Offline parity: cache the shell + wasm bundle so the installed APK (and a
// browser tab) keeps working with the radio off.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(() => {
      /* offline shell is optional; the bundle is already local */
    });
  });
}
