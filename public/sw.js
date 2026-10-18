const CACHE = "lca-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return (
          cached ||
          new Response(
            "<html dir='auto'><body style='font-family:sans-serif;display:grid;place-items:center;height:100vh;background:#FFF4DE;color:#3A2A2E'><p>Offline — اتصال اینترنت ندارید</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          )
        );
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      try {
        const res = await fetch(event.request);
        if (res && res.ok) cache.put(event.request, res.clone());
        return res;
      } catch {
        return hit || Response.error();
      }
    })
  );
});