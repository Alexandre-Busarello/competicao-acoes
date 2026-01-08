'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  isPremium: boolean;
}

/**
 * Hook para autenticação no client-side
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const [initialLoading, setInitialLoading] = useState(true);
  const syncingRef = useRef(false);
  const lastSyncedTokenRef = useRef<string | null>(null);

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
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['auth', 'user', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;

      // Buscar dados do usuário no banco via API
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        console.error('Failed to fetch user data:', response.status);
        return null;
      }
      
      const data = await response.json();
      return data.user as AuthUser | null;
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
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
    // Função auxiliar para sincronizar sessão com cookies do servidor
    // Com proteção contra múltiplas chamadas simultâneas
    const syncSessionToServer = async (session: any) => {
      if (!session?.access_token) return;
      
      // Verificar se já está sincronizando
      if (syncingRef.current) {
        console.log('Sync already in progress, skipping...');
        return;
      }
      
      // Verificar se o token já foi sincronizado recentemente
      if (lastSyncedTokenRef.current === session.access_token) {
        console.log('Token already synced, skipping...');
        return;
      }
      
      syncingRef.current = true;
      lastSyncedTokenRef.current = session.access_token;
      
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
          console.warn('Failed to sync session to server');
          // Reset ref em caso de erro para permitir nova tentativa
          lastSyncedTokenRef.current = null;
        } else {
          console.log('Session synced to server successfully');
        }
      } catch (error) {
        console.warn('Failed to sync session to server:', error);
        // Reset ref em caso de erro para permitir nova tentativa
        lastSyncedTokenRef.current = null;
      } finally {
        syncingRef.current = false;
      }
    };

    // Verificar sessão inicial
    supabase.auth.getSession().then(async ({ data }) => {
      queryClient.setQueryData(['auth', 'session'], data.session);
      
      // Sincronizar sessão com cookies do servidor se houver
      if (data.session) {
        await syncSessionToServer(data.session);
      }
      
      setInitialLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      queryClient.setQueryData(['auth', 'session'], session);
      
      if (session?.user) {
        // Sincronizar sessão com cookies do servidor apenas se o token mudou
        await syncSessionToServer(session);
        
        // Invalidar query do usuário para buscar dados atualizados
        queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      } else {
        // Limpar dados do usuário quando não há sessão
        queryClient.setQueryData(['auth', 'user'], null);
        lastSyncedTokenRef.current = null; // Reset quando logout
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

