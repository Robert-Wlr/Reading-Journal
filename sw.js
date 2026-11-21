// Reading Journal Service Worker: App offline verfügbar, Cover/Schriften werden zwischengespeichert
const V = 'readingjournal-v15';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Buch-APIs immer frisch aus dem Netz
  if (/openlibrary\.org$|googleapis\.com$/.test(u.hostname) && !/covers\./.test(u.hostname) && !/books\.google/.test(u.hostname)) return;
  if (r.mode === 'navigate' || u.origin === location.origin) {
    // App-Dateien: erst Netz (für Updates), sonst Cache
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
    return;
  }
  // Schriften, Cover, Scanner-Bibliothek: Cache zuerst
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; })));
});
