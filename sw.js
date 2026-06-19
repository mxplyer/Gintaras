// Gintaras service worker — enables installability, basic offline caching,
// and background notification scheduling.

const CACHE_NAME = 'gintaras-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Fired when the user taps the notification itself
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('./index.html');
    })
  );
});

// Listens for a scheduled trigger message from app.js to show the reminder
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_STREAK_REMINDER') {
    self.registration.showNotification('Gintaras', {
      body: event.data.body || "Don't lose your streak! Practice a quick lesson today.",
      icon: './icons/icon-192.png',
      badge: './icons/icon-96.png',
      tag: 'daily-streak-reminder',
      renotify: true,
    });
  }
});
