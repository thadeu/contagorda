// Makes the landing installable and keeps it readable offline.
//
// Pages are network-first, so a deploy shows up on the next visit and the cache
// is only the fallback. Hashed build files and images never change under the
// same URL, so they are cache-first.

const VERSION = 'v1';
const PAGES_CACHE = `pages-${VERSION}`;
const ASSETS_CACHE = `assets-${VERSION}`;
const CACHE_NAMES = [PAGES_CACHE, ASSETS_CACHE];
const PRECACHE = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES_CACHE);

      await cache.addAll(PRECACHE);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();

      await Promise.all(names.filter(name => !CACHE_NAMES.includes(name)).map(name => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));

    return;
  }

  if (url.pathname.startsWith('/_next/static/') || request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('/')) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok && response.type !== 'opaque') {
    await cache.put(request, response.clone());
  }

  return response;
}
