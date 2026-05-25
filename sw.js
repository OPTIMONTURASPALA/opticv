// Service Worker - OPTI CV
const CACHE_NAME = 'opticv-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Instalación: guarda los archivos en caché
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: limpia cachés viejos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: sirve desde caché, luego red
self.addEventListener('fetch', function(event) {
  // No interceptar llamadas a Google Sheets / APIs externas
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        // Guardar en caché si es un recurso local
        if (event.request.url.startsWith(self.location.origin)) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      });
    }).catch(function() {
      // Sin red y sin caché: devolver index.html como fallback
      return caches.match('./index.html');
    })
  );
});
