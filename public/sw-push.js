// Service Worker pour gérer les notifications push
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Nettoyer les anciens caches
cleanupOutdatedCaches();

// Injecter le manifest Workbox (nécessaire pour vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST || []);

// Ne PAS forcer l'activation immédiate - attendre que l'utilisateur accepte
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation en cours - en attente de l\'activation');
  // Ne PAS appeler skipWaiting() ici pour éviter les crashes
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation en cours');
  event.waitUntil(
    Promise.all([
      // Prendre le contrôle de tous les clients
      clients.claim(),
      // Nettoyer tous les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith('workbox-') && !cacheName.includes('supabase-cache')) {
              console.log('[Service Worker] Suppression du cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Écouter les messages pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] SKIP_WAITING reçu, activation forcée');
    self.skipWaiting();
  }
});

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push reçu', event);

  let notificationData = {
    title: 'G-Suite Sel',
    body: 'Nouvelle notification',
    icon: '/salt-logo.png',
    badge: '/salt-logo.png',
    vibrate: [200, 100, 200],
    tag: 'notification',
    requireInteraction: false,
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        tag: data.tag || data.notification_type || notificationData.tag,
        data: {
          url: data.url || '/',
          notificationId: data.id
        }
      };
    } catch (e) {
      console.error('[Service Worker] Erreur lors du parsing des données:', e);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification cliquée', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Si une fenêtre est déjà ouverte, la focaliser
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Gérer la fermeture de la notification
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification fermée', event);
});
