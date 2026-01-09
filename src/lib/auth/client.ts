'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  isPremium: boolean;
}

// Singleton para gerenciar sincronização globalmente
// Isso garante que apenas uma sincronização ocorra por vez, mesmo com múltiplos componentes
export const syncSessionManager = {
  isSyncing: false,
  lastSyncedToken: null as string | null,
  pendingSync: null as Promise<void> | null,
  
  async sync(session: any, source: string = 'unknown'): Promise<void> {
    if (!session?.access_token) {
      console.log('⏭️ [sync-session] No access token, skipping...');
      return;
    }
    
    // Se já está sincronizando, aguardar a sincronização pendente
    if (this.isSyncing && this.pendingSync) {
      const timestamp = new Date().toISOString();
      console.log(`⏸️ [${timestamp}] [sync-session] Already in progress, waiting... (source: ${source})`);
      await this.pendingSync;
      return;
    }
    
    // Se o token já foi sincronizado recentemente, pular
    if (this.lastSyncedToken === session.access_token) {
      const timestamp = new Date().toISOString();
      console.log(`⏭️ [${timestamp}] [sync-session] Token already synced, skipping... (source: ${source})`);
      return;
    }
    
    // Criar promise de sincronização
    this.isSyncing = true;
    this.lastSyncedToken = session.access_token;
    
    const timestamp = new Date().toISOString();
    console.log(`🟡 [${timestamp}] [sync-session] Starting sync... (source: ${source})`);
    
    this.pendingSync = (async () => {
      try {
        const response = await fetch('/api/auth/sync-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          }),
        });
        
        if (!response.ok) {
          console.warn(`❌ [${timestamp}] [sync-session] Failed to sync:`, response.status);
          // Reset em caso de erro para permitir nova tentativa
          this.lastSyncedToken = null;
        } else {
          const successTimestamp = new Date().toISOString();
          console.log(`✅ [${successTimestamp}] [sync-session] Synced successfully (source: ${source})`);
        }
      } catch (error) {
        const errorTimestamp = new Date().toISOString();
        console.warn(`❌ [${errorTimestamp}] [sync-session] Error:`, error);
        // Reset em caso de erro para permitir nova tentativa
        this.lastSyncedToken = null;
      } finally {
        this.isSyncing = false;
        this.pendingSync = null;
      }
    })();
    
    await this.pendingSync;
  },
  
  reset() {
    this.isSyncing = false;
    this.lastSyncedToken = null;
    this.pendingSync = null;
  }
};

/**
 * Hook para autenticação no client-side
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const [initialLoading, setInitialLoading] = useState(true);
  const invalidatingRef = useRef(false); // Proteção contra múltiplas invalidações simultâneas

  // Query para obter sessão atual
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obter usuário atual do banco
  // React Query deduplica automaticamente chamadas simultâneas com a mesma queryKey
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['auth', 'user', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        console.log('No session user, returning null');
        return null;
      }

      const timestamp = new Date().toISOString();
      console.log(`🔵 [${timestamp}] [React Query] Fetching user data for:`, session.user.id, session.user.email);
      console.log(`🔵 [${timestamp}] [React Query] Query Key:`, ['auth', 'user', session.user.id]);
      
      // Buscar dados do usuário no banco via API
      // React Query deduplica automaticamente - se múltiplos componentes chamarem ao mesmo tempo,
      // apenas 1 request será feito e todos compartilharão o resultado
      const response = await fetch('/api/auth/me', {
        // Adicionar cache: 'no-store' para garantir que sempre vai ao servidor
        // Mas React Query ainda deduplica múltiplas chamadas simultâneas
        cache: 'no-store',
      });
      if (!response.ok) {
        console.error('Failed to fetch user data:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      const fetchTimestamp = new Date().toISOString();
      console.log(`✅ [${fetchTimestamp}] [React Query] User data fetched from SERVER:`, data.user?.email);
      console.log(`✅ [${fetchTimestamp}] [React Query] This was a REAL network request (not cache)`);
      return data.user as AuthUser | null;
    },
    enabled: !!session?.user,
    staleTime: 10 * 60 * 1000, // 10 minutos - dados ficam "frescos" por 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos (cache time)
    retry: 1,
    refetchOnWindowFocus: false, // Não refetch quando janela ganha foco
    refetchOnMount: 'always', // Sempre refetch quando componente monta (mas React Query deduplica)
    // React Query automaticamente deduplica múltiplas chamadas simultâneas
    // Se vários componentes chamarem ao mesmo tempo, apenas 1 request será feito
  });

  // Mutation para sign out
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'session'], null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  useEffect(() => {
    // Usar o singleton global para sincronização
    // Isso garante que apenas uma sincronização ocorra por vez em toda a aplicação

    // Verificar sessão inicial
    supabase.auth.getSession().then(async ({ data }) => {
      queryClient.setQueryData(['auth', 'session'], data.session);
      
      // Sincronizar sessão com cookies do servidor se houver
      if (data.session) {
        await syncSessionManager.sync(data.session, 'getSession-initial');
      }
      
      setInitialLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email, 'Session:', !!session);
      queryClient.setQueryData(['auth', 'session'], session);
      
      if (session?.user) {
        console.log('Session has user, syncing...');
        // Sincronizar sessão com cookies do servidor apenas se o token mudou
        await syncSessionManager.sync(session, `onAuthStateChange-${event}`);
        
        // Invalidar query do usuário apenas em eventos específicos que realmente mudam o usuário
        // SIGNED_IN: novo login - SEMPRE invalidar para buscar dados atualizados
        // TOKEN_REFRESHED: token foi atualizado (pode ter mudado permissões)
        // USER_UPDATED: dados do usuário foram atualizados
        // INITIAL_SESSION: apenas se não temos dados do usuário ainda (evita múltiplas chamadas)
        const existingUser = queryClient.getQueryData(['auth', 'user', session.user.id]);
        const shouldFetchUser = 
          event === 'SIGNED_IN' || 
          event === 'TOKEN_REFRESHED' || 
          event === 'USER_UPDATED' ||
          (event === 'INITIAL_SESSION' && !existingUser);
        
        // Proteção contra múltiplas invalidações simultâneas
        if (shouldFetchUser && !invalidatingRef.current) {
          invalidatingRef.current = true;
          console.log('🟡 Invalidating user query for event:', event, 'existingUser:', !!existingUser);
          
          // Limpar cache primeiro apenas se necessário
          if (!existingUser) {
            queryClient.setQueryData(['auth', 'user'], undefined);
          }
          
          // Invalidar para que React Query busque novamente
          // React Query deduplica automaticamente se já houver uma requisição em andamento
          queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
          
          // Reset após um delay para permitir nova invalidação se necessário
          setTimeout(() => {
            invalidatingRef.current = false;
          }, 1000);
        } else if (!shouldFetchUser) {
          console.log('⏭️ Skipping user fetch for event:', event, 'existingUser:', !!existingUser);
        } else {
          console.log('⏸️ Invalidation already in progress, skipping...');
        }
        // Para outros eventos (SIGNED_OUT, etc), não invalidar se já temos dados
      } else {
        console.log('No session, clearing user data');
        // Limpar dados do usuário quando não há sessão
        queryClient.setQueryData(['auth', 'user'], null);
        syncSessionManager.reset(); // Reset quando logout
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Loading só é true enquanto está carregando sessão inicial OU carregando usuário quando há sessão
  const isLoading = initialLoading || sessionLoading || (!!session?.user && userLoading);

  // isAuthenticated só é true quando:
  // 1. Não está carregando (sessão e usuário já foram carregados)
  // 2. Há sessão válida do Supabase
  // 3. Usuário foi carregado com sucesso do banco (não null e sem erro)
  // Isso evita flickering: só considera autenticado quando realmente tem dados completos
  const isAuthenticated = !isLoading && !!session?.user && !!user && !userError;

  // Debug: log apenas quando mudar o estado de autenticação
  useEffect(() => {
    if (!isLoading) {
      console.log('Auth state:', { 
        hasSession: !!session?.user, 
        hasUser: !!user, 
        isAuthenticated,
        userEmail: user?.email 
      });
    }
  }, [isLoading, session?.user, user, isAuthenticated]);

  return {
    user: user || null,
    session: session || null,
    isLoading,
    isAuthenticated,
    signOut: () => signOutMutation.mutate(),
  };
}

