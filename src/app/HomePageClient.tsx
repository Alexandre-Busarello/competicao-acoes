'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/client';

/**
 * Componente client-side que redireciona usuários autenticados
 * Isso garante que usuários logados sejam redirecionados mesmo após hydration
 */
export function HomePageClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Se usuário estiver autenticado após hydration, redirecionar
    if (!isLoading && isAuthenticated) {
      router.replace('/ranking');
    }
  }, [isAuthenticated, isLoading, router]);

  return null;
}

