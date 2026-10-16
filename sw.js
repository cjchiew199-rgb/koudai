// Offline support: app files are cached on install and refreshed in the background.
// Bump VERSION whenever app files change so phones pick up the new build.
const VERSION = 'pk-v1.2.1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/lib.js',
  './js/tools.js',
  './js/data.js',
  './js/ai.js',
  './js/links.js',
  './js/screens/home.js',
  './js/screens/tools.js',
  './js/screens/me.js',
  './js/screens/calc.js',
  './js/screens/convert.js',
  './js/screens/fx.js',
  './js/screens/split.js',
  './js/screens/money.js',
  './js/screens/countdown.js',
  './js/screens/expense.js',
  './js/screens/life.js',
  './js/screens/trip.js',
  './js/screens/scan.js',
  './js/screens/sensors.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png',
  './vendor/jsQR.js',
  './vendor/anthropic.mjs',
];
// Web fonts are kept offline once fetched.
const RUNTIME_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'pk-runtime').map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Stale-while-revalidate for the app itself; navigations fall back to the cached shell.
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const key = req.mode === 'navigate' ? './index.html' : req;
        const cached = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
        const network = fetch(req)
          .then((res) => {
            if (res.ok && req.mode !== 'navigate') cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open('pk-runtime').then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      }),
    );
  }
  // Everything else (exchange-rate APIs, Anthropic API) goes straight to the network.
});
