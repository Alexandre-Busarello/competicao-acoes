'use client';

import { useQuery } from '@tanstack/react-query';

interface FIIRankingItem {
  ticker: string;
  fundName: string | null;
  segment: string | null;
  dyScore: number | string;
  pvpScore: number | string;
  vacancyScore: number | string;
  debtScore: number | string;
  payoutScore: number | string;
  liquidityScore: number | string;
  finalScore: number | string;
  rank: number;
  financialData: Record<string, any>;
  breakdown?: Record<string, any>;
  lastUpdated?: string;
}

interface FIIRankingResponse {
  success: boolean;
  data: FIIRankingItem[];
  lastUpdate: string;
  totalFIIs: number;
  fromCache?: boolean;
  warning?: string;
  error?: string;
  isPro?: boolean;
}

/**
 * Hook para gerenciar ranking FII usando React Query
 */
export function useFIIRankingStore() {
  const { data, isLoading, error } = useQuery<FIIRankingResponse>({
    queryKey: ['fii-ranking'],
    queryFn: async () => {
      const response = await fetch('/api/ranking-fii');
      if (!response.ok) {
        throw new Error('Erro ao buscar ranking FII');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    data: data?.data || [],
    isLoading,
    error,
    lastUpdate: data?.lastUpdate || null,
    totalFIIs: data?.totalFIIs || 0,
    fromCache: data?.fromCache || false,
    warning: data?.warning,
    isPro: data?.isPro ?? false,
  };
}
