import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const assets = readdirSync('dist/assets').filter(f => statSync(`dist/assets/${f}`).isFile()).map(f => `./assets/${f}`);
const hash = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 12);
let sw = readFileSync('dist/sw.js', 'utf8');
sw = sw.replace("const VERSION = 'aquaspectra-v1.0.0';", `const VERSION = 'aquaspectra-${hash}';`);
sw = sw.replace("const PRECACHE = ['./', './index.html', './manifest.webmanifest', './favicon.svg'];", `const PRECACHE = ${JSON.stringify(['./', './index.html', './manifest.webmanifest', './favicon.svg', ...assets])};`);
writeFileSync('dist/sw.js', sw);
console.log(`Offline precache: ${assets.length} bundled assets (${hash})`);
