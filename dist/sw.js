// Offline-first cache for the app's own files (stale-while-revalidate).
// The TV often closes the launcher to free memory, so Home reloads the page many times a day; answering from
// the cache makes that instant, while a fresh copy is fetched in the background for the next load.
// Only same-origin GET requests are handled: YouTube and other sites always go to the network.
const CACHE = 'nha-ti-yang-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(request, {ignoreSearch: true});
    // Revalidate with the server (a cheap 304 when unchanged) rather than reuse the browser's HTTP cache, which
    // GitHub Pages lets keep a file for 10 minutes and would delay every update by that long.
    // A navigation request cannot be re-issued with options, so its URL is fetched instead.
    const fresh = fetch(request.mode === 'navigate' ? request.url : request, {cache: 'no-cache'}).then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    }).catch(() => cached);
    if (cached) {
      event.waitUntil(fresh);
      return cached;
    }
    return fresh;
  }));
});
