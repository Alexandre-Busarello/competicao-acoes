'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/client';
import type { Transaction } from '@/types';

/**
 * Hook para gerenciar transações usando React Query
 */
export function useTransactionStore() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar transações
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const response = await fetch('/api/transactions');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return [];
}
        throw new Error('Erro ao buscar transações');
      }

      const data = await response.json();
      return data.transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.createdAt),
      }));
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Mutation para adicionar transação
  const addTransactionMutation = useMutation({
    mutationFn: async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transactionData,
          date: transactionData.date.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Criar erro customizado com informações adicionais
        const customError = new Error(error.error || 'Erro ao criar transação') as Error & {
          availableQuantity?: number;
          requestedQuantity?: number;
          ticker?: string;
        };
        customError.availableQuantity = error.availableQuantity;
        customError.requestedQuantity = error.requestedQuantity;
        customError.ticker = error.ticker;
        throw customError;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
  });

  // Mutation para remover transação (se implementado no backend)
  const removeTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao remover transação');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      },
  });

  return {
    transactions,
    isLoading,
    addTransaction: (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return addTransactionMutation.mutateAsync(transactionData);
    },
    removeTransaction: (id: string) => removeTransactionMutation.mutateAsync(id),
    getTransactionsByUser: (userId: string) => transactions.filter((t) => t.userId === userId),
  };
}
