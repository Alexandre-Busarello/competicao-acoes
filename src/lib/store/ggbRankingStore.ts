'use client';

import { useQuery } from '@tanstack/react-query';

interface GGBRankingItem {
  ticker: string;
  companyName: string | null;
  sector: string | null;
  industry: string | null;
  greenblattScore: number;
  grahamScore: number;
  bazinScore: number;
  finalScore: number;
  rank: number;
  financialData: Record<string, any>;
  breakdown?: {
    roic: number;
    earningsYield: number;
    divida: number;
    liquidez: number;
    historicoLucro: number;
    dy: number;
    payout: number;
    consistencia: number;
  };
  lastUpdated?: string;
}

interface GGBRankingResponse {
  success: boolean;
  data: GGBRankingItem[];
  lastUpdate: string;
  totalStocks: number;
  fromCache?: boolean;
  warning?: string;
  error?: string;
  isPro?: boolean;
}

/**
 * Hook para gerenciar ranking GGB usando React Query
 */
export function useGGBRankingStore() {
  const { data, isLoading, error } = useQuery<GGBRankingResponse>({
    queryKey: ['ggb-ranking'],
    queryFn: async () => {
      const response = await fetch('/api/ranking-ggb');
      if (!response.ok) {
        throw new Error('Erro ao buscar ranking GGB');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - dados são atualizados a cada 24h no servidor
    refetchOnWindowFocus: false, // Não refetch automático ao focar na janela
    refetchOnMount: true, // Refetch ao montar o componente
  });

  return {
    data: data?.data || [],
    isLoading,
    error,
    lastUpdate: data?.lastUpdate || null,
    totalStocks: data?.totalStocks || 0,
    fromCache: data?.fromCache || false,
    warning: data?.warning,
    isPro: data?.isPro ?? false,
  };
}

