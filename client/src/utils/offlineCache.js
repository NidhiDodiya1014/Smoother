// Offline cache utility for Smoother songs
// Communicates with the Service Worker to cache/uncache audio files

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("SW registered:", reg.scope);
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });
  }
}

export function cacheSong(audioUrl) {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CACHE_AUDIO",
      url: audioUrl,
    });
  }
}

export function uncacheSong(audioUrl) {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "UNCACHE_AUDIO",
      url: audioUrl,
    });
  }
}

export function getCachedUrls() {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker?.controller) {
      resolve([]);
      return;
    }

    const handler = (event) => {
      if (event.data.type === "CACHED_LIST") {
        navigator.serviceWorker.removeEventListener("message", handler);
        resolve(event.data.urls);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    navigator.serviceWorker.controller.postMessage({ type: "CHECK_CACHED" });

    // Timeout after 3s
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", handler);
      resolve([]);
    }, 3000);
  });
}

export function getCacheSize() {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker?.controller) {
      resolve({ size: 0, count: 0 });
      return;
    }

    const handler = (event) => {
      if (event.data.type === "CACHE_SIZE") {
        navigator.serviceWorker.removeEventListener("message", handler);
        resolve({ size: event.data.size, count: event.data.count });
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    navigator.serviceWorker.controller.postMessage({ type: "GET_CACHE_SIZE" });

    setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", handler);
      resolve({ size: 0, count: 0 });
    }, 3000);
  });
}

export function clearAllCache() {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "CLEAR_ALL_CACHE" });
  }
}

export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function onSWMessage(callback) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", callback);
    return () => navigator.serviceWorker.removeEventListener("message", callback);
  }
  return () => {};
}
