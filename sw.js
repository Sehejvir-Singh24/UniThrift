// Lightweight install worker. App content remains network-first so marketplace
// and account data are always current when UniThrift is reopened from a shortcut.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
