// Service Worker para HoneyToken Deception Lab
// Permite mostrar notificaciones nativas de escritorio incluso cuando la pestaña está en segundo plano o minimizada

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Manejo de mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/assets/aistudio/icono_81a3db5b.png',
        badge: '/assets/aistudio/icono_81a3db5b.png',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        ...options
      })
    );
  }
});

// Manejo de eventos Push del servidor (Web Push API)
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 ¡ALERTA HONEYTOKEN DETECTADA!',
    body: 'Un señuelo de seguridad ha sido abierto por un atacante.',
    url: '/?tab=radar'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/assets/aistudio/icono_81a3db5b.png',
    badge: '/assets/aistudio/icono_81a3db5b.png',
    data: { url: data.url || '/?tab=radar' },
    requireInteraction: true,
    tag: data.tag || 'honeytoken-push-alert',
    vibrate: [300, 100, 300, 100, 300]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Al hacer clic en la notificación del sistema operativo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una pestaña abierta de la aplicación, enfocarla
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE_TO_RADAR' });
          return client.focus();
        }
      }
      // Si la ventana estaba cerrada, abrirla
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?tab=radar');
      }
    })
  );
});
