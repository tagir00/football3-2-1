const CACHE_NAME = 'futbol-3-2-1-v6';
const APP_ASSETS = [
  './',
  './index.html',
  './src/app.js',
  './src/data.js',
  './src/styles.css',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;
  const isClubLogo = sameOrigin && requestUrl.pathname.startsWith('/assets/logos/clubs/');

  if (isClubLogo) {
    // Always prefer fresh network image for club logos so deploy updates are visible immediately.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached ?? Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        const cacheable = response.ok && sameOrigin;

        if (cacheable) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(() => {});
        }

        return response;
      });
    }),
  );
});