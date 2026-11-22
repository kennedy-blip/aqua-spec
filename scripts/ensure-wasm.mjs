#!/usr/bin/env node
/**
 * Vercel build safeguard.
 *
 * Guarantees src/wasm/nephelometry_dsp.wasm.b64.ts exists before `vite build`
 * runs. Precedence:
 *   1. the committed embedded module (always present in this repo) → exit 0
 *   2. recompile from assembly/ if the embedded module is missing and asc exists
 *   3. write a stub marker so the typed-array fallback is used at runtime
 *
 * The build must never fail because a WASM toolchain is unavailable.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const b64 = resolve(root, 'src/wasm/nephelometry_dsp.wasm.b64.ts');
const wasm = resolve(root, 'assembly/build/nephelometry_dsp.wasm');
const asc = resolve(root, 'node_modules/assemblyscript/bin/asc.js');

const MIN_BYTES = 2048;

if (existsSync(b64)) {
  const src = readFileSync(b64, 'utf8');
  const m = src.match(/export const DSP_WASM_BYTES = (\d+);/);
  const bytes = m ? Number(m[1]) : 0;
  if (bytes >= MIN_BYTES) {
    console.log(`[ensure-wasm] embedded kernel ok (${bytes} bytes) — skipping compile.`);
    process.exit(0);
  }
  console.log('[ensure-wasm] embedded kernel too small — recompiling.');
}

if (existsSync(asc)) {
  console.log('[ensure-wasm] compiling assembly/nephelometry_dsp.ts …');
  try {
    execFileSync(process.execPath, [resolve(root, 'scripts/build-wasm.mjs')], { cwd: root, stdio: 'inherit' });
    if (existsSync(b64)) process.exit(0);
  } catch (err) {
    console.warn('[ensure-wasm] compile failed:', err instanceof Error ? err.message : err);
  }
} else if (existsSync(wasm)) {
  console.log('[ensure-wasm] asc missing but a prebuilt .wasm exists — embedding it.');
  try {
    execFileSync(process.execPath, [resolve(root, 'scripts/build-wasm.mjs'), '--embed-only'], { cwd: root, stdio: 'inherit' });
    if (existsSync(b64)) process.exit(0);
  } catch {
    /* fall through to stub */
  }
}

console.warn('[ensure-wasm] no WASM toolchain — emitting an empty kernel; the TypedArray fallback will run.');
writeFileSync(
  b64,
  `// GENERATED FALLBACK — no WASM toolchain at build time.
// The bridge detects the empty binary and uses the numerically identical
// TypedArray implementation (src/wasm/assemblyScriptBridge.ts).
export const DSP_WASM_SHA256 = 'none';
export const DSP_WASM_BYTES = 0;
export const DSP_WASM_BASE64 = '';
`,
);
process.exit(0);
