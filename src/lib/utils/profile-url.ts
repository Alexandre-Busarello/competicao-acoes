import { prisma } from '@/lib/prisma/client';

/**
 * Obtém a URL do perfil usando slug se disponível, senão usa ID
 * Pode ser usado tanto no servidor quanto no cliente
 */
export async function getProfileUrl(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { slug: true },
    });
    
    if (user?.slug) {
      return `/perfil/${user.slug}`;
    }
    
    return `/perfil/${userId}`;
  } catch (error) {
    // Em caso de erro, retornar URL com ID
    console.error('Error getting profile URL:', error);
    return `/perfil/${userId}`;
  }
}

/**
 * Obtém a URL do perfil usando slug se disponível, senão usa ID
 * Versão síncrona para uso no cliente quando já temos os dados do usuário
 */
export function getProfileUrlSync(userId: string, slug?: string | null): string {
  if (slug) {
    return `/perfil/${slug}`;
  }
  return `/perfil/${userId}`;
}

