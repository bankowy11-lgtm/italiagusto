// Aplikacja winiarska (strona główna) — logika bez zmian.
const CACHE = 'italia-gusto-v1';
const ASSETS = ['./', './index.html'];

// Aplikacja do nauki (Klasa 5) — osobna pamięć i strategia „najpierw sieć, w razie braku internetu pamięć”.
const NAUKA_CACHE = 'nauka-v1';
const NAUKA_PATHS = ['nauka/', 'matematyka/', 'historia/', 'biologia/', 'jezyk-polski/', 'geografia/', 'powtorka/', 'plan/', 'rodzic/', 'shared/', 'stacja-gier/', 'potegowanie/'];
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== NAUKA_CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

function isNauka(url) {
  const u = new URL(url);
  if (u.origin !== self.location.origin) return false;
  const base = new URL(self.registration.scope).pathname;
  if (!u.pathname.startsWith(base)) return false;
  const rel = u.pathname.slice(base.length);
  return NAUKA_PATHS.some(p => rel.startsWith(p));
}

const OFFLINE_HTML = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Brak połączenia</title>' +
  '<body style="font-family:system-ui,sans-serif;max-width:480px;margin:12vh auto;padding:0 20px;line-height:1.55;color:#20242c">' +
  '<h1 style="font-size:22px">Brak połączenia z internetem</h1>' +
  '<p>Ta strona nie została jeszcze zapisana do pracy offline. Gdy będziesz online, otwórz <b>Panel rodzica</b> i naciśnij „Zapisz wszystko do pracy offline”.</p>' +
  '<p><a href="./" onclick="history.back();return false">&larr; Wróć</a></p></body>';

async function naukaHandler(request) {
  const cache = await caches.open(NAUKA_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request).then(res => {
    if (res && res.status === 200 && res.type === 'basic' && !res.redirected) cache.put(request, res.clone());
    return res;
  });
  if (!cached) {
    return network.catch(() => new Response(OFFLINE_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
  }
  return Promise.race([
    network.catch(() => cached),
    new Promise(resolve => setTimeout(() => resolve(cached), NETWORK_TIMEOUT))
  ]);
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (isNauka(e.request.url)) {
    e.respondWith(naukaHandler(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.url.startsWith('http')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
