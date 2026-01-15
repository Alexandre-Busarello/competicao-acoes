'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface DeviceSubscription {
  id: string;
  deviceId: string | null;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'unknown';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook para gerenciar subscriptions de dispositivos
 */
export function useDeviceSubscriptions() {
  const queryClient = useQueryClient();

  // Buscar subscriptions
  const { data: subscriptions, isLoading, error, refetch } = useQuery<DeviceSubscription[]>({
    queryKey: ['device-subscriptions'],
    queryFn: async () => {
      const response = await fetch('/api/push/subscriptions');
      if (!response.ok) {
        throw new Error('Erro ao buscar subscriptions');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Atualizar subscription (ativar/desativar ou renomear)
  const updateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      enabled, 
      deviceName 
    }: { 
      id: string; 
      enabled?: boolean; 
      deviceName?: string;
    }) => {
      const response = await fetch(`/api/push/subscriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled, deviceName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao atualizar subscription');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache para buscar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['device-subscriptions'] });
    },
  });

  // Ativar/desativar subscription
  const toggleSubscription = (id: string, enabled: boolean) => {
    updateMutation.mutate({ id, enabled });
  };

  // Renomear dispositivo
  const renameDevice = (id: string, deviceName: string) => {
    updateMutation.mutate({ id, deviceName });
  };

  return {
    subscriptions: subscriptions || [],
    isLoading,
    error,
    toggleSubscription,
    renameDevice,
    updateSubscription: updateMutation.mutate,
    updateSubscriptionAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    refetch,
  };
}


