import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  throw new Error('Android SDK required: set ANDROID_HOME. Alternatively run the Build Android workflow on GitHub.');
}
// Do not recursively package a previous APK inside the new APK.
const oldApk = 'public/releases/aquaspectra-release.apk';
if (existsSync(oldApk)) {
  const { unlinkSync } = await import('node:fs');
  unlinkSync(oldApk);
}
run('npm', ['run', 'build']);
if (!existsSync('android/app')) run('npx', ['cap', 'add', 'android']);
// Permissions must be declared in the native shell as well as requested in JS.
const path = 'android/app/src/main/AndroidManifest.xml';
let xml = readFileSync(path, 'utf8');
for (const permission of ['CAMERA', 'RECORD_AUDIO', 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'VIBRATE']) {
  if (!xml.includes(`android.permission.${permission}`)) {
    xml = xml.replace('</manifest>', `    <uses-permission android:name="android.permission.${permission}" />\n</manifest>`);
  }
}
writeFileSync(path, xml);
run('npx', ['cap', 'sync', 'android']);
// Debug-signed artifact is installable without storing a signing secret in Git.
run('bash', ['-c', 'cd android && chmod +x gradlew && ./gradlew assembleDebug --no-daemon']);
mkdirSync('public/releases', { recursive: true });
const target = 'public/releases/aquaspectra-release.apk';
copyFileSync('android/app/build/outputs/apk/debug/app-debug.apk', target);
const bytes = readFileSync(target);
writeFileSync('public/releases/manifest.json', JSON.stringify({
  version: 'v1.0.0', abi: 'universal WebView', buildId: process.env.GITHUB_SHA || 'local-debug',
  builtAt: new Date().toISOString(), bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  url: './releases/aquaspectra-release.apk', minSdk: 22, targetSdk: 34,
  engine: 'Lit 3.2 + AssemblyScript + Elixir mirror + Datalog + GLSL',
  signing: 'development debug signature; not a Play Store release',
}, null, 2) + '\n');
// Second build includes the APK in the deployable website, not inside itself.
run('npm', ['run', 'build']);
console.log(`Installable debug-signed APK: ${target}`);
