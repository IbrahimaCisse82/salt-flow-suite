// Service Worker pour gérer les notifications push
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
