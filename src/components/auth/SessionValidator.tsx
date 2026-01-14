'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { syncSessionManager } from '@/lib/auth/client';

/**
 * Componente que valida a sessão quando a aplicação carrega
 * e quando o usuário retorna à aplicação (visibility change)
 * 
 * Isso garante que o usuário seja reconhecido mesmo após
 * retornar à aplicação após algum tempo
 */
export function SessionValidator() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Função para validar e atualizar a sessão
    const validateSession = async () => {
      try {
        console.log('🔍 [SessionValidator] Validating session...');
        
        // Buscar sessão atual do Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [SessionValidator] Error getting session:', sessionError);
          // Se houver erro, limpar cache
          queryClient.setQueryData(['auth', 'session'], null);
          queryClient.setQueryData(['auth', 'user'], null);
          return;
        }

        const currentSession = sessionData.session;
        const cachedSession = queryClient.getQueryData(['auth', 'session']);

        // Se não há sessão, limpar cache
        if (!currentSession) {
          console.log('⏭️ [SessionValidator] No session found, clearing cache');
          queryClient.setQueryData(['auth', 'session'], null);
          queryClient.setQueryData(['auth', 'user'], null);
          return;
        }

        // Verificar se a sessão mudou ou se não temos cache
        const sessionChanged = 
          !cachedSession || 
          cachedSession.access_token !== currentSession.access_token ||
          cachedSession.user?.id !== currentSession.user?.id;

        if (sessionChanged) {
          console.log('🔄 [SessionValidator] Session changed or not cached, updating...');
          
          // Atualizar cache da sessão
          queryClient.setQueryData(['auth', 'session'], currentSession);
          
          // Sincronizar com servidor
          await syncSessionManager.sync(currentSession, 'SessionValidator');
          
          // Invalidar query do usuário para buscar dados atualizados
          queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
          
          console.log('✅ [SessionValidator] Session validated and updated');
        } else {
          console.log('✅ [SessionValidator] Session is up to date');
        }
      } catch (error) {
        console.error('❌ [SessionValidator] Error validating session:', error);
      }
    };

    // Validar sessão imediatamente ao montar
    validateSession();

    // Validar sessão quando a aplicação ganha foco (usuário retorna)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [SessionValidator] App became visible, validating session...');
        validateSession();
      }
    };

    // Validar sessão quando a janela ganha foco
    const handleFocus = () => {
      console.log('🎯 [SessionValidator] Window focused, validating session...');
      validateSession();
    };

    // Adicionar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);

  // Este componente não renderiza nada
  return null;
}

