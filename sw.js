/* iloe : pour jouer sans réseau.
   La page et ses images sont gardées sur le téléphone. Avec du réseau, on prend toujours la dernière version ;
   sans réseau, on rejoue celle qu'on a gardée. */
const CACHE = 'iloe-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // la page : le réseau d'abord (pour les mises à jour), la copie gardée si on est hors ligne
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))){
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // le reste (icônes, polices) : la copie gardée d'abord, et on la complète au passage
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')){
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')){ const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }))
    );
  }
});
