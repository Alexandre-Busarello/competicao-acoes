// Service Worker customizado com handlers de push
// Este arquivo será usado no lugar do gerado pelo next-pwa

// Importar workbox (será injetado pelo next-pwa durante o build)
// O workbox será carregado automaticamente pelo next-pwa
// Este arquivo precisa ser processado pelo next-pwa para incluir o workbox

// Handlers de push notifications
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
  
  // Usar URL do payload se disponível, senão determinar baseado no tipo
  let urlToOpen = data.url || '/';

  // Fallback: determinar URL baseada no tipo se não houver URL no payload
  if (!data.url) {
    if (data.type === 'ranking') {
      urlToOpen = '/ranking';
    } else if (data.type === 'engagement' || data.type === 'following') {
      // Usar slug quando disponível, caso contrário usar postId como fallback
      if (data.postSlug) {
        urlToOpen = `/posts/${data.postSlug}`;
      } else if (data.postId) {
        urlToOpen = `/feed/${data.postId}`;
      } else {
        urlToOpen = '/feed';
      }
    } else if (data.type === 'interactions') {
      // Usar slug quando disponível para interações também
      if (data.postSlug) {
        urlToOpen = `/posts/${data.postSlug}`;
      } else if (data.postId) {
        urlToOpen = `/posts/${data.postId}`;
      } else {
        urlToOpen = '/feed';
      }
    } else {
      urlToOpen = '/feed';
    }
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

