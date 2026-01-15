// Handlers de push notifications que serão importados pelo service worker principal
// Este arquivo será carregado via importScripts no service worker gerado pelo next-pwa

// Handler para mensagens do cliente (ex: SKIP_WAITING)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handler para receber notificações push
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
      urlToOpen = data.postId ? `/feed/${data.postId}` : '/feed';
    } else if (data.type === 'reengagement') {
      urlToOpen = '/'; // Home
    } else if (data.type === 'manual') {
      urlToOpen = data.url || '/'; // Usar URL do payload ou home
    } else if (data.type === 'test') {
      urlToOpen = '/perfil/notificacoes';
    } else {
      urlToOpen = '/';
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

