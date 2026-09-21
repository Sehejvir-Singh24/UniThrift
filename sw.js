// Service Worker for UniThrift & UniMatch
// Supports network-first caching, background Web Push notifications on Android, Desktop, and iOS 16.4+ (Home Screen PWA)

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// ── Web Push Event Listener ──────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'UniMatch Alert ✨',
    body: 'You have a new update waiting for you!',
    icon: '/assets/unithrift-app-icon.svg',
    badge: '/assets/unithrift-app-icon.svg',
    url: '/unimatch/discover.html'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = Object.assign(data, payload);
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/assets/unithrift-app-icon.svg',
    badge: data.badge || '/assets/unithrift-app-icon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/unimatch/discover.html'
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification Click Listener ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/unimatch/discover.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open on this origin, focus and navigate it
      for (const client of windowClients) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new tab/window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Message Listener (Trigger notification from active client) ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || 'UniMatch Alert 💕', options || {});
  }
});
