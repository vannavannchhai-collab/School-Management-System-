/* Service Worker — Cambodia School ERP (Network-First + Offline PWA Cache) */
const CACHE_NAME = 'school-erp-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Skip API endpoints at root (/api/...) or under any subpath (.../api/...)
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) return;

  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.ok && url.origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return resp;
      })
      .catch(() =>
        caches
          .match(req, { ignoreSearch: true })
          .then((cached) => cached || caches.match('./index.html'))
      )
  );
});
