/**
 * Utilitários para verificar suporte a Push API, Badge API e PWA instalado
 */

export interface PushSupport {
  pushSupported: boolean;
  badgeSupported: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerActive: boolean;
  pwaInstalled: boolean;
}

/**
 * Verifica se o navegador suporta Push API
 */
export function checkPushSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Verifica se o navegador suporta Badge API
 */
export function checkBadgeSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Verifica se o navegador suporta Service Workers
 */
export function checkServiceWorkerSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'serviceWorker' in navigator;
}

/**
 * Verifica se há um service worker ativo
 */
export async function checkServiceWorkerActive(): Promise<boolean> {
  if (!checkServiceWorkerSupport()) return false;
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.some(reg => reg.active !== null);
  } catch (error) {
    console.warn('Erro ao verificar service worker:', error);
    return false;
  }
}

/**
 * Verifica se o PWA está instalado (standalone mode)
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Verifica se está em modo standalone (iOS)
  const isStandalone = (window.navigator as any).standalone === true;
  
  // Verifica se está em modo standalone (Android/Desktop)
  const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
  
  // Verifica se foi aberto a partir da tela inicial (Android)
  const isFromHomeScreen = (window.matchMedia as any)('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  
  return isStandalone || isStandaloneMode || isFromHomeScreen;
}

/**
 * Verifica todas as capacidades de push notification de uma vez
 */
export async function checkPushNotificationSupport(): Promise<PushSupport> {
  const pushSupported = checkPushSupport();
  const badgeSupported = checkBadgeSupport();
  const serviceWorkerSupported = checkServiceWorkerSupport();
  const serviceWorkerActive = await checkServiceWorkerActive();
  const pwaInstalled = isPWAInstalled();
  
  return {
    pushSupported,
    badgeSupported,
    serviceWorkerSupported,
    serviceWorkerActive,
    pwaInstalled,
  };
}

/**
 * Verifica se a permissão de notificação está concedida
 */
export async function checkNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
}

/**
 * Solicita permissão de notificação
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Notifications não são suportadas neste navegador');
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    throw new Error('Permissão de notificação foi negada. Ative manualmente nas configurações do navegador.');
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

