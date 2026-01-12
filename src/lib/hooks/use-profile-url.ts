'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfileUrlSync } from '@/lib/utils/profile-url';

/**
 * Hook para obter URL do perfil usando slug se disponível
 * Busca o perfil público para obter o slug
 */
export function useProfileUrl(userId: string): string {
  const { data: profile } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/users/${userId}/public`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!userId, // Só faz a query se userId existir
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  if (!userId) {
    return '/perfil';
  }

  return getProfileUrlSync(userId, profile?.slug);
}

