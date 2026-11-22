/**
 * AQUA-SPECTRA — service worker
 * Precache the app shell + WASM-embedded bundle so the instrument boots with
 * the radio physically off (also what makes the Capacitor APK truly offline).
 * Strategy: cache-first for hashed assets, stale-while-revalidate for the
 * document, and never cache camera/audio requests (there are none).
 */
const VERSION = 'aquaspectra-v1.0.0';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const PRECACHE = ['./', './index.html', './manifest.webmanifest', './favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Hashed build assets never change under the same name.
  const isHashed = /\/assets\/.+-[A-Za-z0-9_-]{8}\.(js|css|woff2?|png|svg)$/.test(url.pathname);
  if (isHashed) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Documents + everything else: network first, fall back to cache, then shell.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html').then((shell) => shell || Response.error())),
      ),
  );
});
