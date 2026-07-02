const CACHE_NAME = "restaurant-app-v3";

const LOCAL_ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/config.js",
  "./js/app.js",
  "./js/router.js",
  "./js/services/api.js",
  "./js/services/icons.js",
  "./js/components/navbar.js",
  "./js/pages/login.js",
  "./js/pages/dashboard.js",
  "./js/pages/mesas.js",
  "./js/pages/pedidos.js",
  "./js/pages/platos.js",
  "./js/pages/ingredientes.js",
  "./js/pages/menu-publico.js",
  "./js/pages/seguimiento.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        LOCAL_ASSETS.map((url) =>
          cache.add(url).catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ detail: "Sin conexion. Intente de nuevo." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
