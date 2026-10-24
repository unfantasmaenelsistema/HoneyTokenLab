import { TriggerAlert } from '../types/token';

let swRegistration: ServiceWorkerRegistration | null = null;

// Inicializa el Service Worker para notificaciones nativas de escritorio
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    swRegistration = registration;
    return registration;
  } catch (err) {
    console.warn('Service Worker registration skipped or unavailable:', err);
    return null;
  }
}

// Obtiene el estado actual del permiso de notificaciones del navegador
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Solicita permiso al usuario para enviar notificaciones de escritorio
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await initServiceWorker();
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

// Envía una notificación nativa del navegador / sistema operativo (Windows, macOS, Linux, Android)
export async function sendBrowserNotification(alert: TriggerAlert): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const title = `🚨 ALERTA HONEYTOKEN: ${alert.tokenName}`;
  const body = `El archivo señuelo fue abierto desde la IP ${alert.ip} (${alert.detectedApp}).\nAviso enviado a ${alert.alertEmail}.`;
  const icon = '/assets/aistudio/icono_81a3db5b.png';
  const tag = `honeytoken-alert-${alert.id}`;

  try {
    // 1. Intentar mostrar a través del Service Worker (funciona óptimamente en segundo plano)
    if (!swRegistration && 'serviceWorker' in navigator) {
      swRegistration = (await navigator.serviceWorker.getRegistration()) || null;
    }

    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, {
        body,
        icon,
        badge: icon,
        tag,
        requireInteraction: true,
        data: { alertId: alert.id, url: '/?tab=radar' }
      });
      return true;
    }

    // 2. Fallback a la API de Notificaciones estándar de la ventana
    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag,
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Error dispatching native browser notification:', err);
    return false;
  }
}

// Lanza una notificación de prueba retardada para que el usuario pueda cambiar de pestaña y verificar que salta en segundo plano
export function triggerDelayedBackgroundTestNotification(seconds: number = 3): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const mockAlert: TriggerAlert = {
        id: `test-${Date.now()}`,
        tokenId: 'tok-test',
        tokenName: 'Documento Confidencial Salarios (Prueba Segundo Plano)',
        tokenType: 'docx',
        alertEmail: 'tu-correo@empresa.com',
        timestamp: new Date().toISOString(),
        ip: '194.38.20.14',
        userAgent: 'Microsoft Office Word 16.0',
        detectedApp: 'Microsoft Word (Office XML Engine)',
        os: 'Windows 10 Pro',
        headers: {},
        severity: 'critical',
        emailSentStatus: 'delivered'
      };

      await sendBrowserNotification(mockAlert);
      resolve();
    }, seconds * 1000);
  });
}
