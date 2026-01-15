'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/client';

/**
 * Hook para rastrear acesso do usuário
 * Atualiza lastAccessAt no servidor a cada minuto quando o usuário está autenticado
 */
export function useTrackAccess() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Atualizar imediatamente ao montar
    const updateAccess = async () => {
      try {
        await fetch('/api/user/track-access', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        // Silenciar erros para não quebrar a experiência
        console.warn('Erro ao atualizar acesso:', error);
      }
    };

    updateAccess();

    // Atualizar a cada minuto
    const interval = setInterval(updateAccess, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);
}

