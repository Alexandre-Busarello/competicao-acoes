import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Competitor, RankingPeriod, BrunoPortfolio } from '@/types';

interface RankingState {
  period: RankingPeriod;
  competitors: Competitor[];
  brunoPortfolio: BrunoPortfolio | null;
  totalParticipants: number;
  setPeriod: (period: RankingPeriod) => void;
  setCompetitors: (competitors: Competitor[]) => void;
  setBrunoPortfolio: (portfolio: BrunoPortfolio) => void;
  setTotalParticipants: (total: number) => void;
  reset: () => void;
}

export const useRankingStore = create<RankingState>()(
  persist(
    (set) => ({
      period: 'mensal',
      competitors: [],
      brunoPortfolio: null,
      totalParticipants: 0,
      setPeriod: (period) => set({ period }),
      setCompetitors: (competitors) => set({ competitors }),
      setBrunoPortfolio: (brunoPortfolio) => set({ brunoPortfolio }),
      setTotalParticipants: (totalParticipants) => set({ totalParticipants }),
      reset: () =>
        set({
          period: 'mensal',
          competitors: [],
          brunoPortfolio: null,
          totalParticipants: 0,
        }),
    }),
    {
      name: 'competicao_competitors',
    }
  )
);

