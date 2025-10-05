// Força atualização do cache ao publicar esta versão
const CACHE_NAME = 'trato-certo-v8.6';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: cache-first para GET (offline). POST passa direto (sincronização é feita no app).
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // não intercepta POST
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // cacheia navegando
      const resClone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(()=>{});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
