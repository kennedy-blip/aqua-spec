# AQUA-SPECTRA

A local-first experimental hydro-optical workbench built with Lit 3.2, AssemblyScript/WebAssembly, Elixir source with a TypeScript runtime mirror, a browser Datalog engine, and WebGL2 GLSL caustics.

## Run

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev       # listens on 0.0.0.0:5173
npm test          # numerical and inference smoke tests
npm run build    # typecheck, Vite build, offline precache
npm run preview  # serve dist for production/offline checks
```

The normal build uses the checked-in embedded WASM; no AssemblyScript or Elixir compiler needs to run on Vercel. `npm run build:wasm` explicitly regenerates the kernel and checksum. If the embedded kernel is unavailable, the bridge provides a deterministic TypeScript fallback.

## Modules

- **Optics:** Siemens target, camera/simulator controls, five sample profiles, seven-pad CIEDE2000 matching.
- **Chemistry:** LSI/RSI, corrosion and scale estimates, SCA target matrix, ammonia estimates.
- **Acoustics:** microphone and Web Audio simulators, vessel-fill and faucet-flow estimates.
- **Purification:** dose/contact-time planner, saved batches, altitude boiling curve.
- **Vault:** editable stratified Datalog, inference trace, source inspector, local persistence and report export.

Switch themes, desktop/phone preview, or demonstration privilege tiers from the header. Sensor access requires HTTPS or localhost and explicit browser permissions. Privilege tiers are local UI gates, **not authenticated authorization**.

## Safety and scientific limitations

**Research/educational prototype — not a certified water-testing instrument or emergency-treatment authority.** Camera NTU, TSS, acoustic flow, corrosion, and scale predictions are unvalidated estimates dependent on hardware, geometry, lighting and calibration. Low turbidity cannot establish potability. Neither camera colors nor LSI detect lead, pathogens or all dissolved contaminants. Certificates are app-generated summaries, not regulatory certification. Use accredited testing for drinking-water decisions.

The dosing and boiling models are illustrative calculations and have not been independently validated against all products or conditions. Follow the actual disinfectant label and current local public-health instructions. Chemical disinfection does not remove metals/nitrate and is not reliable for every parasite. Do not infer safe drinking water from a green badge.

## Android

The checked-in `android/` is a real Capacitor 6 Android project, with camera, microphone, location and vibration permissions. Configuration uses `com.aquaspectra.hydrolab`, `AquaSpectra`, and `dist`.

```sh
# Requires Java 21 and Android SDK; set ANDROID_HOME.
npm run build:apk
```

Or run **Build Android and web bundle** in GitHub Actions (also runs on main pushes). It installs dependencies, compiles WASM, builds the web app, syncs Capacitor and runs Gradle `assembleDebug`. The installable **debug-signed** APK is copied to `public/releases/aquaspectra-release.apk`, with a SHA-256 manifest; a second web build includes it in `dist/releases/`. Download the workflow artifact for both the APK and deployable website. Production distribution needs a securely managed release signing key and appropriate target-SDK updates; no signing secrets are committed.

**A real installable APK is bundled** at `public/releases/aquaspectra-release.apk` (about 3.9 MB). GitHub Actions built it and verified its Android signature; its exact size and SHA-256 are recorded in `public/releases/manifest.json`. The header button downloads it as `AquaSpectra-HydroLab-v1.0.0.apk`. The QR opens the web app. The APK is debug-signed for sideloading, not a Play Store release; a future build with a different debug key may require uninstalling the old app first (export local data before uninstalling). A source ZIP is used only if the bundled APK is missing; that ZIP is not installable. Physical-device installation is not yet tested.

## Vercel

`vercel.json` selects Vite, `npm run build`, and `dist`. The repository is connected to the Vercel **aqua-spectra** project at https://aqua-spectra.vercel.app. To self-host the APK, deploy the **second** `dist` build produced by the Android workflow, or include its generated `public/releases/` artifacts in your deployment source. The verified APK is now checked into this branch, so a regular Git-based Vercel build includes it automatically. The workflow can refresh the bundled binary on this working branch; main builds upload artifacts without directly pushing to main.

## Offline and storage

The production service worker precaches the shell and all emitted JS chunks during installation; wait for installation to complete before going offline. Capacitor also bundles web assets locally. IndexedDB via Dexie stores scans, batches, inference runs and queued jobs, with a volatile memory fallback if browser persistence is blocked.

**Cloud sync is not configured.** Queue entries remain queued; an online browser is not proof of upload. Connect `drainSyncQueue()` to an authenticated backend with acknowledgements before enabling remote synchronization. No Supabase schema, remote water-data upload or server-side RBAC is provisioned.

## Source map

| Runtime | Source |
|---|---|
| Lit UI | `src/components/`, `src/modules/`, `src/app-shell.ts` |
| Spring ODE | `src/controllers/springController.ts` |
| AssemblyScript DSP | `assembly/nephelometry_dsp.ts` |
| WASM bridge | `src/wasm/assemblyScriptBridge.ts` |
| Elixir chemistry | `lib/aqua_chemistry.ex` |
| Runtime chemistry mirror | `src/elixir/aquaChemistry.ts` |
| Datalog rules/engine | `src/rules/water_contaminants.dl`, `src/logic/datalog.ts` |
| WebGL2 shader | `src/shaders/caustic_refraction.glsl` |
| Android pipeline | `.github/workflows/build-and-bundle-apk.yml`, `scripts/make-apk.mjs` |

Tests cover WASM integrity/self-test, reference CIEDE2000, chemistry smoke cases, Datalog parsing/fixpoint, and QR construction. Device sensors, physical calibration, Android installation, Elixir execution and end-to-end browser interactions still require device/browser validation.

## Dependency audit

`npm audit --omit=dev` reports no production dependency advisories. The pinned Capacitor 6 CLI toolchain currently has five development-only advisories (including transitive `tar`); do not process untrusted native templates. npm proposes a major Capacitor upgrade, which has not been applied or tested here.
