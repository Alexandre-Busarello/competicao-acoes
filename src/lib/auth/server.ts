import { getServerUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';

export interface ServerAuthUser {
  id: string;
  authUserId: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  isPremium: boolean;
}

/**
 * Obtém a sessão do usuário no servidor
 * Retorna null se não autenticado
 */
export async function getServerSession() {
  try {
    // Usar getUser() que valida o token diretamente (mais confiável)
    const supabaseUser = await getServerUser();
    if (!supabaseUser) {
      console.log('No Supabase user found in getServerSession');
      return null;
    }
    
    console.log('Supabase user found:', supabaseUser.email, 'authUserId:', supabaseUser.id);

    // Buscar dados do usuário no banco
    const user = await prisma.user.findUnique({
      where: { authUserId: supabaseUser.id },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      console.log('User not found in database for authUserId:', supabaseUser.id);
      return null;
    }
    
    console.log('User found in database:', user.email, 'id:', user.id);

    // Verificar se tem assinatura ativa baseado na data de expiração
    // Se existe subscription, usar apenas a data de expiração (não confiar em isPremium)
    // Se não existe subscription, usar isPremium como fallback (legado/cache)
    let isPremium = false;
    
    if (user.subscription) {
      // Se existe subscription, verificar status e data de expiração
      isPremium =
        user.subscription.status === 'active' &&
        user.subscription.currentPeriodEnd !== null &&
        user.subscription.currentPeriodEnd > new Date();
    } else {
      // Se não existe subscription, usar isPremium como fallback
      isPremium = user.isPremium;
    }

    return {
      user: {
        id: user.id,
        authUserId: user.authUserId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isPremium,
      } as ServerAuthUser,
      subscription: user.subscription,
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Verifica se o usuário tem assinatura ativa
 */
export async function requirePremium() {
  const session = await requireAuth();
  if (!session.user.isPremium) {
    throw new Error('Premium subscription required');
  }
  return session;
}

