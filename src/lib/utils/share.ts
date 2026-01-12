/**
 * Utilitários de compartilhamento em redes sociais
 */

export interface ShareData {
  url: string;
  title: string;
  description?: string;
}

/**
 * Usa Web Share API nativo (mobile)
 */
export async function shareViaWebAPI(data: ShareData): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.description || data.title,
        url: data.url,
      });
    } catch (error) {
      // Usuário cancelou ou erro ao compartilhar
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing via Web API:', error);
      }
      throw error;
    }
  } else {
    throw new Error('Web Share API not available');
  }
}

/**
 * Verifica se Web Share API está disponível
 */
export function isWebShareAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Compartilha via WhatsApp
 */
export function shareViaWhatsApp(url: string, text?: string): void {
  const message = text ? `${text} ${url}` : url;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Compartilha via Twitter/X
 */
export function shareViaTwitter(url: string, text?: string): void {
  const tweetText = text || '';
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(tweetText)}`;
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Compartilha via Facebook
 */
export function shareViaFacebook(url: string): void {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Compartilha via LinkedIn
 */
export function shareViaLinkedIn(url: string, title?: string): void {
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}${title ? `&title=${encodeURIComponent(title)}` : ''}`;
  window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Copia URL para clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback para método antigo
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } else {
    throw new Error('Clipboard API not available');
  }
}

/**
 * Gera URL completa para compartilhamento
 */
export function getShareUrl(type: 'post' | 'profile' | 'ranking', id: string, slug?: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  switch (type) {
    case 'post':
      return `${baseUrl}/post/${slug || id}`;
    case 'profile':
      return `${baseUrl}/perfil/${id}`;
    case 'ranking':
      return `${baseUrl}/ranking`;
    default:
      return baseUrl;
  }
}



