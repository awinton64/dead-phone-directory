// Dead Phone Directory: Service Worker
// Plain JavaScript (not TypeScript). Vite copies public/ verbatim to dist/.
// Registered from main.ts only in production builds (import.meta.env.PROD).

const CACHE_NAME = "dpd-v1";

// Assets to pre-cache on install. The base path /dead-phone-directory/ is
// baked into the Vite build; the SW is served from the same scope.
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
];

// ---------------------------------------------------------------------------
// Install: pre-cache known assets
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // Activate immediately without waiting for existing clients to close.
      return self.skipWaiting();
    })
  );
});

// ---------------------------------------------------------------------------
// Activate: delete caches from previous versions
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      // Take control of all open clients immediately.
      return self.clients.claim();
    })
  );
});

// ---------------------------------------------------------------------------
// Fetch: cache-first for same-origin GET requests, network fallback
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      // Not in cache: fetch from network and cache for next time.
      return fetch(request).then((response) => {
        // Only cache valid responses.
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      });
    })
  );
});
