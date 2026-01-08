'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Competitor, RankingPeriod, BrunoPortfolio } from '@/types';
import { SHOW_MIC_METHOD } from '@/lib/config/features';

/**
 * Hook para gerenciar ranking usando React Query
 */
export function useRankingStore() {
  const [period, setPeriod] = useState<RankingPeriod>('mensal');

  // Query para buscar ranking
  const { data: rankingData, isLoading } = useQuery({
    queryKey: ['ranking', period === 'bruno-method' ? 'mensal' : period],
    queryFn: async () => {
      if (period === 'bruno-method' && SHOW_MIC_METHOD) {
        // Buscar portfolio do Bruno
        const response = await fetch('/api/bruno-portfolio');
        if (!response.ok) {
          throw new Error('Erro ao buscar portfolio do Bruno');
        }
        const data = await response.json();
        return {
          competitors: [],
          brunoPortfolio: data.portfolio,
          totalParticipants: 0,
        };
      }

      const response = await fetch(`/api/ranking?period=${period}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar ranking');
      }

      const data = await response.json();
      
      // Converter ranking para formato Competitor
      const competitors: Competitor[] = data.ranking.map((entry: any) => ({
        id: entry.userId,
        name: entry.name,
        avatar: entry.avatar,
        rank: entry.rank,
        monthlyReturn: entry.monthlyReturn,
        annualReturn: entry.annualReturn,
        displayedPeriod: period === 'anual' ? 'anual' : 'mensal',
        portfolio: entry.portfolio || [],
      }));

      return {
        competitors,
        brunoPortfolio: null,
        totalParticipants: data.totalParticipants || 0,
        lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : new Date(),
      };
    },
    enabled: period !== 'bruno-method' || SHOW_MIC_METHOD,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para buscar portfolio do Bruno
  const { data: brunoData } = useQuery({
    queryKey: ['bruno-portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/bruno-portfolio');
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    period,
    setPeriod,
    competitors: rankingData?.competitors || [],
    brunoPortfolio: period === 'bruno-method' && SHOW_MIC_METHOD
      ? (brunoData?.portfolio || null)
      : (rankingData?.brunoPortfolio || null),
    totalParticipants: rankingData?.totalParticipants || 0,
    lastUpdate: rankingData?.lastUpdate,
    isLoading,
  };
}
