'use client';

import { useAuth } from '@/lib/auth/client';

/**
 * Hook para acessar dados do usuário atual
 * Usa React Query internamente via useAuth
 */
export function useUserStore() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
