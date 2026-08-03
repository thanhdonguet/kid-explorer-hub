/* Bump this on every release – the fetch handler is cache-first, so returning
   visitors keep the old JS/CSS until the cache name changes. */
const CACHE_NAME = 'kid-explorer-hub-v4';
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

/* ================================================================
   Fetch strategy
   ----------------------------------------------------------------
   Code and markup (navigations, .html/.js/.css/.json) use NETWORK-FIRST
   so a refresh always picks up a new build. Cache-first was serving stale
   JS/CSS until CACHE_NAME was bumped by hand, which made testing on a phone
   nearly impossible. The cache is still written on every successful fetch,
   so going offline keeps working – it is just a fallback now, not the
   first choice.

   Everything else (images, audio, fonts) stays CACHE-FIRST: those files are
   large and effectively immutable, so there is nothing to go stale.
   ================================================================ */

const CODE_PATTERN = /\.(?:html|js|css|json)$/i;

function isAppCode(request) {
  if (request.mode === 'navigate') return true;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return CODE_PATTERN.test(url.pathname);
}

function isCacheableAsset(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin ||
         url.hostname === 'fonts.googleapis.com' ||
         url.hostname === 'fonts.gstatic.com';
}

/** Fetch bypassing the browser's own HTTP cache where the browser allows it.
    GitHub Pages sends a max-age, so even a plain fetch can hand back a file
    the phone cached minutes ago. Navigation requests reject a custom `cache`
    option in some browsers, hence the fallback. */
async function fetchBypassingHttpCache(request) {
  if (request.mode !== 'navigate') {
    try {
      return await fetch(request, { cache: 'no-store' });
    } catch (err) {
      if (err instanceof TypeError && err.message && /cache/i.test(err.message)) {
        return fetch(request);
      }
      throw err;
    }
  }
  return fetch(request);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetchBypassingHttpCache(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await cache.match('index.html');
      if (shell) return shell;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  if (fresh && fresh.ok && isCacheableAsset(request)) {
    cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener('fetch', (e) => {
  // Never interfere with POST/PUT or non-http(s) schemes
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(isAppCode(e.request) ? networkFirst(e.request) : cacheFirst(e.request));
});
