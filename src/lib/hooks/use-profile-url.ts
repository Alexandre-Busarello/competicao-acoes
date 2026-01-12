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
      const response = await fetch(`/api/users/${userId}/public`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  return getProfileUrlSync(userId, profile?.slug);
}

