const CACHE_NAME = 'smartmart-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './payment.html',
  './bill.html',
  './admin.html',
  './admin.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Adding assets, gracefully handle errors if external CDNs fail to pre-cache natively
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
         console.warn('Partial cache formulation constraint executed natively:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Ignore dynamic endpoints natively enforcing explicit network rules structurally 
  if (event.request.url.includes('/api/') || event.request.url.includes('localhost:5001/scan')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Serve explicitly cached payload when offline structurally overriding network failures!
      if (cachedResponse) return cachedResponse;
      
      // Fallback natively to standard dynamic network execution perfectly formatting fallback states natively 
      return fetch(event.request).then(response => {
        return response;
      }).catch(() => {
        console.log("Offline Fallback Mode Invoked globally: Fetch operation denied implicitly:", event.request.url);
      });
    })
  );
});
