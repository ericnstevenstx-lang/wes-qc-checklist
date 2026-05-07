// Cache version - bump this number whenever we ship a deploy that needs cache invalidation
const CACHE_NAME = "hardin-qc-v5";
const PRECACHE = ["/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // HTML pages: always fetch fresh so deploys take effect immediately
  if (e.request.mode === "navigate" || (e.request.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // API routes: never cache, always hit server
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Supabase calls: network first, cached fallback if offline
  if (url.pathname.includes("/rest/v1/") || url.pathname.includes("/storage/v1/")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Static assets (JS/CSS/images with hashed filenames): cache first, then network
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
    )
  );
});
