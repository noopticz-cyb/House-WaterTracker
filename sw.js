// Water Tracker service worker
// Strategy: network-first. Always try to fetch the freshest copy when online,
// silently updating the offline cache in the background. Only fall back to the
// cached copy when there's no connection at all. This means updates you push
// to GitHub Pages show up the next time the app opens with a connection —
// no reinstall needed — while the app still works with zero signal.

const CACHE_VERSION = 'water-tracker-v2'; // bump this string whenever you push a real update
const CACHE_NAME = `wt-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {}) // don't block install if an asset is briefly unreachable
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
