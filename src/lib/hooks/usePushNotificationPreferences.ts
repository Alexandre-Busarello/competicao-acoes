'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PushNotificationPreferences {
  id: string;
  userId: string;
  rankingEnabled: boolean;
  engagementEnabled: boolean;
  followingEnabled: boolean;
  allEnabled: boolean;
  updatedAt: Date;
}

/**
 * Hook para gerenciar preferências de notificações push
 */
export function usePushNotificationPreferences() {
  const queryClient = useQueryClient();

  // Buscar preferências
  const { data: preferences, isLoading, error } = useQuery<PushNotificationPreferences>({
    queryKey: ['push-notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/push/preferences');
      if (!response.ok) {
        throw new Error('Erro ao buscar preferências');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Atualizar preferências
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<PushNotificationPreferences>) => {
      const response = await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar preferências');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache para buscar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['push-notification-preferences'] });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updateMutation.mutate,
    updatePreferencesAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

