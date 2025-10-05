// Força atualização do PWA
const CACHE_NAME = 'trato-certo-v8.8';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest'
  // adicione ícones aqui caso use (ex: './icons/icon-192.png', './icons/icon-512.png')
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) && caches.delete(k)));
  })());
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Deixa POST/PUT/etc passarem (sincronização não é cacheada)
  if (req.method !== 'GET') return;

  // Navegação: tenta rede, cai para index do cache se offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Assets GET: cache-first, cai para rede se faltar
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') {
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      return caches.match('./index.html');
    }
  })());
});
