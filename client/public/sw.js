const AUDIO_CACHE = "smoother-audio-v1";

// Install — just activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate — claim all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch — intercept audio requests and serve from cache if available
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Only intercept Cloudinary audio URLs
  if (url.includes("res.cloudinary.com") && (url.endsWith(".mp3") || url.includes("/video/upload/"))) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Not cached — fetch from network
          return fetch(event.request).then(networkResponse => {
            return networkResponse;
          }).catch(() => {
            // Network failed and no cache — return error
            return new Response("Offline - song not cached", { status: 503 });
          });
        });
      })
    );
  }
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  const { type, url } = event.data;

  if (type === "CACHE_AUDIO") {
    caches.open(AUDIO_CACHE).then(cache => {
      fetch(url, { mode: "cors" })
        .then(response => {
          if (response.ok) {
            cache.put(url, response.clone());
            // Notify all clients
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({ type: "AUDIO_CACHED", url });
              });
            });
          }
        })
        .catch(err => {
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: "CACHE_ERROR", url, error: err.message });
            });
          });
        });
    });
  }

  if (type === "UNCACHE_AUDIO") {
    caches.open(AUDIO_CACHE).then(cache => {
      cache.delete(url).then(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: "AUDIO_UNCACHED", url });
          });
        });
      });
    });
  }

  if (type === "CHECK_CACHED") {
    caches.open(AUDIO_CACHE).then(cache => {
      cache.keys().then(keys => {
        const cachedUrls = keys.map(k => k.url);
        event.source.postMessage({ type: "CACHED_LIST", urls: cachedUrls });
      });
    });
  }

  if (type === "GET_CACHE_SIZE") {
    caches.open(AUDIO_CACHE).then(cache => {
      cache.keys().then(async keys => {
        let totalSize = 0;
        for (const req of keys) {
          const resp = await cache.match(req);
          if (resp) {
            const blob = await resp.clone().blob();
            totalSize += blob.size;
          }
        }
        event.source.postMessage({ type: "CACHE_SIZE", size: totalSize, count: keys.length });
      });
    });
  }

  if (type === "CLEAR_ALL_CACHE") {
    caches.delete(AUDIO_CACHE).then(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: "ALL_CACHE_CLEARED" });
        });
      });
    });
  }
});
