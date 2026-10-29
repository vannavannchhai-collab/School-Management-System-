/* Service Worker — Cambodia School ERP (Network-First + SPA Fallback + Offline PWA Cache) */
const CACHE_NAME = 'school-erp-v5';
const CORE_ASSETS = [
  './',
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
      .then((cache) =>
        Promise.allSettled(CORE_ASSETS.map((asset) => cache.add(asset)))
      )
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
  if (url.origin !== self.location.origin) return;

  // Never cache API endpoints or static-host API probe marker
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/api/') ||
    url.pathname.endsWith('/api-offline.json')
  ) {
    return;
  }

  // SPA navigation requests: always fetch fresh HTML, and fall back to root './' if host returns 404
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(async (resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./', copy));
            return resp;
          }
          if (resp && resp.status === 404) {
            const rootResp = await fetch('./').catch(() => null);
            if (rootResp && rootResp.ok) return rootResp;
          }
          return (await caches.match('./')) || resp;
        })
        .catch(async () => (await caches.match('./')) || (await caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return resp;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
