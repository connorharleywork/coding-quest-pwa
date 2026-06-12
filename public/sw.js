// CodeQuest stays local-first: this service worker caches the app shell and
// same-origin files after they are requested so the installed PWA can reopen
// after the first successful load. Paths are scoped from the service worker
// registration so the same file works at / locally and /coding-quest-pwa/ on
// GitHub Pages.
const CACHE_NAME = 'codequest-shell-v4';
const APP_BASE = new URL(self.registration.scope).pathname;
const appUrl = (path = '') => new URL(path, self.registration.scope).pathname;
const APP_SHELL = [
  appUrl(),
  appUrl('index.html'),
  appUrl('manifest.webmanifest'),
  appUrl('favicon.svg'),
  appUrl('icons/codequest-icon.svg'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(APP_BASE)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(appUrl('index.html'), responseToCache));
          return networkResponse;
        })
        .catch(() => caches.match(appUrl('index.html')).then((cachedResponse) => cachedResponse || caches.match(appUrl())))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }

        return networkResponse;
      });
    })
  );
});
