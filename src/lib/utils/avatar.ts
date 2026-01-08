/**
 * Calcula hash MD5 de uma string (apenas server-side)
 * No cliente, retorna hash simples baseado em string
 */
function md5Hash(str: string): string {
  if (typeof window === 'undefined') {
    // Server-side: usar crypto do Node.js
    const crypto = require('crypto');
    return crypto.createHash('md5').update(str).digest('hex');
  } else {
    // Client-side: usar uma função hash simples
    // Para produção, considere usar crypto-js ou fazer requisição ao servidor
    let hash = 0;
    const normalizedStr = str.toLowerCase().trim();
    for (let i = 0; i < normalizedStr.length; i++) {
      const char = normalizedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Converter para hex (não é MD5 real, mas serve como identificador único)
    return Math.abs(hash).toString(16).padStart(32, '0');
  }
}

/**
 * Gera URL do avatar usando Gravatar com fallback para DiceBear
 * @param email - Email do usuário
 * @param name - Nome do usuário (opcional, usado como fallback)
 * @returns URL do avatar
 */
export function generateAvatarUrl(email: string, name?: string): string {
  if (!email) {
    // Se não tiver email, usa DiceBear com seed baseado no nome ou string aleatória
    const seed = name || Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  }

  // Calcula hash MD5 do email para Gravatar
  const hash = md5Hash(email.toLowerCase().trim());
  
  // URL do Gravatar com parâmetro d=404 para retornar 404 se não existir imagem
  const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;
  
  return gravatarUrl;
}

/**
 * Verifica se uma URL de imagem existe (para Gravatar)
 * @param url - URL da imagem
 * @returns Promise<boolean>
 */
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Gera URL do avatar com verificação automática de fallback
 * @param email - Email do usuário
 * @param name - Nome do usuário (opcional)
 * @returns Promise<string> - URL do avatar (Gravatar ou DiceBear)
 */
export async function generateAvatarUrlWithFallback(
  email: string,
  name?: string
): Promise<string> {
  if (!email) {
    const seed = name || Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  }

  const hash = md5Hash(email.toLowerCase().trim());
  const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;
  
  // Verifica se Gravatar existe
  const exists = await checkImageExists(gravatarUrl);
  
  if (exists) {
    return gravatarUrl;
  }
  
  // Fallback para DiceBear
  const dicebearSeed = email || name || Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dicebearSeed)}`;
}

