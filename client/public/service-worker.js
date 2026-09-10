/* ============================================================
   Hamsaad Lubricants — Service Worker
   Strategy:
     • App shell (HTML/JS/CSS/assets) → Cache-first
     • API calls (/api/) → Network-first with offline fallback
     • Images → Stale-while-revalidate
   ============================================================ */

const CACHE_NAME   = 'hamsaad-v1';
const OFFLINE_URL  = '/offline.html';

const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

/* ── INSTALL ──────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache app shell; failures on individual assets are non-fatal
      return Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

/* ── ACTIVATE ─────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH ────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin + Railway API requests
  if (!url.protocol.startsWith('http')) return;

  // POST / PUT / PATCH / DELETE → always network (never cache)
  if (request.method !== 'GET') return;

  // API calls → network-first
  if (url.pathname.startsWith('/api/') || url.hostname.includes('railway.app')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (JS/CSS/images/fonts) → cache-first
  if (
    request.destination === 'script'  ||
    request.destination === 'style'   ||
    request.destination === 'image'   ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation (HTML pages) → network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else → network-first
  event.respondWith(networkFirst(request));
});

/* ── STRATEGIES ───────────────────────────────────────────── */

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match('/offline.html');
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return cached page or the offline page
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response('You are offline', { headers: { 'Content-Type': 'text/plain' } });
  }
}

/* ── BACKGROUND SYNC (stub for future use) ────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    // Future: sync queued offline orders
  }
});

/* ── PUSH NOTIFICATIONS (stub for future use) ─────────────── */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'Hamsaad Lubricants', {
    body:  data.body  || '',
    icon:  '/logo192.png',
    badge: '/logo192.png',
    data:  data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
