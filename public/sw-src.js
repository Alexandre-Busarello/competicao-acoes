// Service Worker source para next-pwa (InjectManifest mode)
// O next-pwa injetará o precache manifest aqui usando: importScripts(self.__WB_MANIFEST)
// IMPORTANTE: Os handlers de push devem estar ANTES do código do workbox

// Handlers de push notifications (incluídos diretamente)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push notification received');

  let notificationData = {
    title: 'Hold Arena',
    body: 'Você tem uma nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {},
      };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.data.type || 'default',
    requireInteraction: false,
  });

  event.waitUntil(promiseChain);
});

// Handler para quando usuário clica na notificação
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const data = event.notification.data || {};
  let urlToOpen = '/';

  // Determinar URL baseada no tipo de notificação
  if (data.type === 'ranking') {
    urlToOpen = '/ranking';
  } else if (data.type === 'engagement' || data.type === 'following') {
    urlToOpen = data.postId ? `/feed/${data.postId}` : '/feed';
  } else {
    urlToOpen = '/feed';
  }

  const promiseChain = clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then(function(windowClients) {
      // Se já tem uma janela aberta, focar nela
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Se não tem janela aberta, abrir nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

// O next-pwa vai injetar o precache manifest aqui
// O formato esperado é que o next-pwa injete: importScripts(self.__WB_MANIFEST)
// Mas também precisamos importar o workbox

// Importar workbox (será injetado pelo next-pwa)
// O next-pwa vai injetar o código do workbox aqui automaticamente
// Por enquanto, vamos deixar vazio e o next-pwa vai injetar
