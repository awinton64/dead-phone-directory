// Dead Phone Directory: Service Worker
// Plain JavaScript (not TypeScript). Vite copies public/ verbatim to dist/.
// Registered from main.ts only in production builds (import.meta.env.PROD).

const CACHE_NAME = "dpd-v2";

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
// Fetch: three strategies by request type
//   - Navigation requests (HTML pages): network-first, cache fallback.
//   - Vite content-hashed assets (assets/): cache-first, no revalidation needed.
//   - Everything else same-origin GET: stale-while-revalidate.
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first so a new deploy is picked up immediately.
  // Fall back to the cached copy when offline.
  if (request.mode === "navigate" || url.pathname.endsWith("index.html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Vite hashed assets: cache-first. The hash in the filename guarantees freshness.
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else (manifest.json, sw.js itself, etc.): stale-while-revalidate.
  // Serve from cache immediately if available, then refresh the cache in the background.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached || networkFetch;
      });
    })
  );
});
