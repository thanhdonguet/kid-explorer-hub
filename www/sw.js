const CACHE_NAME = 'kid-explorer-hub-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'css/style.css',
  'css/dashboard.css',
  'css/games.css',
  'js/audio.js',
  'js/app.js',
  'js/games/math.js',
  'js/games/spelling.js',
  'js/games/drawing.js',
  'js/games/memory.js'
];

// Install event - Cache all core files
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache first (offline capabilities)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Cache dynamic Google Fonts stylesheets and assets
        if (e.request.url.includes('fonts.googleapis.com') || e.request.url.includes('fonts.gstatic.com')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback if offline and asset not cached
      if (e.request.mode === 'navigate') {
        return caches.match('index.html');
      }
    })
  );
});
