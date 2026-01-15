'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { badgeService } from '@/lib/services/badge-service';

/**
 * Componente que atualiza o badge do PWA com contagem de notificações não lidas
 * Atualiza periodicamente quando o app está aberto
 */
export function BadgeUpdater() {
  const { data: badgeCount } = useQuery({
    queryKey: ['notifications', 'badge'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/badge');
      if (!response.ok) {
        throw new Error('Erro ao buscar contagem de notificações');
      }
      const data = await response.json();
      return data.count as number;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000, // Considerar stale após 10 segundos
  });

  useEffect(() => {
    if (typeof badgeCount === 'number') {
      badgeService.updateBadge(badgeCount);
    }
  }, [badgeCount]);

  // Limpar badge quando componente desmontar (opcional)
  useEffect(() => {
    return () => {
      // Não limpar ao desmontar, manter badge mesmo quando app fecha
      // badgeService.clearBadge();
    };
  }, []);

  return null;
}

