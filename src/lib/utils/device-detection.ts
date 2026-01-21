/**
 * Utilitários para detecção e identificação de dispositivos
 */

const DEVICE_ID_STORAGE_KEY = 'push_notification_device_id';

/**
 * Detecta o tipo de dispositivo baseado na largura da tela e user agent
 */
export function detectDeviceType(): 'desktop' | 'mobile' | 'unknown' {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  // Verificar largura da tela (mobile geralmente < 768px)
  const isMobileWidth = window.innerWidth < 768;

  // Verificar user agent para mobile
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUserAgent =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  if (isMobileWidth || isMobileUserAgent) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Obtém o nome amigável do dispositivo baseado no navegador e tipo
 */
export function getDeviceName(): string {
  if (typeof window === 'undefined') {
    return 'Outro';
  }

  const deviceType = detectDeviceType();
  const userAgent = navigator.userAgent;

  // Detectar navegador
  let browserName = 'Navegador';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browserName = 'Opera';
  }

  // Detectar sistema operacional para mobile
  if (deviceType === 'mobile') {
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return `${browserName} iOS`;
    } else if (/android/i.test(userAgent)) {
      return `${browserName} Android`;
    }
    return `${browserName} Mobile`;
  }

  // Desktop
  if (/windows/i.test(userAgent)) {
    return `${browserName} Windows`;
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    return `${browserName} macOS`;
  } else if (/linux/i.test(userAgent)) {
    return `${browserName} Linux`;
  }

  return `${browserName} Desktop`;
}

/**
 * Gera ou recupera um deviceId único do localStorage
 */
export function generateDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: gerar UUID simples
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  try {
    // Tentar recuperar deviceId existente
    const existingId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existingId) {
      return existingId;
    }

    // Gerar novo deviceId
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    return deviceId;
  } catch (error) {
    // Se localStorage não estiver disponível, gerar ID temporário
    console.warn('Não foi possível acessar localStorage para deviceId:', error);
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Obtém o user agent do navegador
 */
export function getUserAgent(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return navigator.userAgent;
}







