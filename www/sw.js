/* Bump this on every release – the fetch handler is cache-first, so returning
   visitors keep the old JS/CSS until the cache name changes. */
const CACHE_NAME = 'kid-explorer-hub-v3';
const ASSETS = [
  'index.html',
  'manifest.json',
  'css/style.css',
  'css/dashboard.css',
  'css/games.css',
  'js/audio.js',
  'js/app.js',
  'js/games/fruit-market.js',
  'js/games/alphabet-pop.js',
  'js/games/drawing.js',
  'js/games/memory.js',
  'js/games/color-mix.js',
  'js/games/vehicle-parking.js',
  'img/icon-192.png',
  'img/icon-512.png',
  'img/vocab/fire_truck.svg',
  'img/treasure_map_bg.png',
  'audio/dino/intro.wav',
  'audio/dino/banana.wav',
  'audio/dino/peach.wav',
  'audio/dino/tomato.wav',
  'audio/dino/cucumber.wav',
  'audio/dino/grapes.wav',
  'audio/dino/orange.wav',
  'audio/dino/full.wav'
];

// Install event - Cache all core files.
// Assets are added one by one: cache.addAll() rejects the whole install if a
// single file 404s, which would silently disable offline support entirely.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('SW: skipped', url, err))
        )
      );
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
