import { build } from 'esbuild';
await build({ entryPoints: ['tests/core.ts'], bundle: true, platform: 'node', format: 'esm', outfile: '.cache/core-test.mjs' });
await import('../.cache/core-test.mjs');
