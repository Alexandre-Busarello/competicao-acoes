import type { RankingResult } from '@/lib/services/ranking-service';

interface RankingCacheState {
  mensal: RankingResult | null;
  anual: RankingResult | null;
  lastUpdate: Date | null;
}

const rankingCache: RankingCacheState = {
  mensal: null,
  anual: null,
  lastUpdate: null,
};

export const RankingCache = {
  /**
   * Armazena ranking calculado no cache
   */
  setRanking(period: 'mensal' | 'anual', ranking: RankingResult) {
    // Garantir que lastUpdate seja um Date object preservando a data original do cálculo
    const rankingWithDate = {
      ...ranking,
      lastUpdate: ranking.lastUpdate instanceof Date 
        ? ranking.lastUpdate 
        : new Date(ranking.lastUpdate),
    };
    rankingCache[period] = rankingWithDate;
    // Usar o lastUpdate do ranking, não criar um novo Date()
    rankingCache.lastUpdate = rankingWithDate.lastUpdate;
  },

  /**
   * Obtém ranking do cache
   */
  getRanking(period: 'mensal' | 'anual'): RankingResult | null {
    return rankingCache[period];
  },

  /**
   * Obtém data da última atualização
   */
  getLastUpdate(): Date | null {
    return rankingCache.lastUpdate;
  },

  /**
   * Limpa o cache
   */
  clearCache() {
    rankingCache.mensal = null;
    rankingCache.anual = null;
    rankingCache.lastUpdate = null;
  },
};

