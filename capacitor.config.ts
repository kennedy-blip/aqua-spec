/**
 * AQUA-SPECTRA — capacitor.config.ts
 * Wraps the built Lit bundle into an offline Android shell.
 * `webDir: dist` matches Vite's output, so `npm run build && npx cap sync android`
 * is the entire hand-off between the web instrument and the APK.
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aquaspectra.hydrolab',
  appName: 'AquaSpectra',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#030914',
  },
  server: {
    androidScheme: 'https',
    // The app is fully self-contained: no remote URL, no cleartext traffic.
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 900,
      backgroundColor: '#030914',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
