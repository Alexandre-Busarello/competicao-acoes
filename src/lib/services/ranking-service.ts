import { priceService } from './price-service';
import { calculatePortfolio } from '@/lib/utils/portfolio-calculator';
import type { Transaction, User } from '@/types';
import { initializeMockData } from '@/lib/mock-data';
import { RankingCache } from '@/lib/cache/ranking-cache';

export interface RankingEntry {
  userId: string;
  name: string;
  rank: number;
  monthlyReturn: number;
  annualReturn?: number;
  totalInvested: number;
  currentValue: number;
  avatar?: string; // Avatar do competidor
  portfolio?: any[]; // Portfolio do competidor
}

export interface RankingResult {
  period: 'mensal' | 'anual';
  lastUpdate: Date;
  ranking: RankingEntry[];
  totalParticipants: number; // Total real de participantes no ranking completo
}

/**
 * Carrega transações do sistema (mockado para MVP, será substituído por Supabase)
 * TODO: Substituir por query real do banco de dados
 * 
 * NOTA: No servidor, não temos acesso ao localStorage. 
 * Para MVP, retornamos array vazio e o cálculo será feito no cliente.
 * Em produção, isso será uma query ao Supabase.
 */
function loadAllTransactions(): Transaction[] {
  // No servidor, não temos acesso ao localStorage
  // Em produção, isso será uma query ao Supabase
  if (typeof window === 'undefined') {
    // Server-side: retorna vazio por enquanto
    // TODO: Implementar query ao banco de dados
    return [];
  }

  // Client-side: carrega do localStorage
  const stored = localStorage.getItem('competicao_transactions');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Converter strings de data para Date objects
      return parsed.state?.transactions?.map((tx: any) => ({
        ...tx,
        date: new Date(tx.date),
        createdAt: new Date(tx.createdAt),
      })) || [];
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      return [];
    }
  }
  return [];
}

/**
 * Carrega usuários do sistema (mockado para MVP)
 * TODO: Substituir por query real do banco de dados
 */
function loadAllUsers(): User[] {
  // No servidor, não temos acesso ao localStorage
  if (typeof window === 'undefined') {
    // Server-side: retorna vazio por enquanto
    // TODO: Implementar query ao banco de dados
    return [];
  }

  // Client-side: carrega do localStorage
  const stored = localStorage.getItem('competicao_user');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const user = parsed.state?.user;
      if (user) {
        return [user];
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }
  return [];
}

export class RankingService {
  /**
   * Calcula ranking completo para um período
   */
  async calculateRanking(period: 'mensal' | 'anual' = 'mensal'): Promise<RankingResult> {
    // 1. Carrega dados
    const transactions = loadAllTransactions();
    const users = loadAllUsers();
    const prices = priceService.getCurrentPrices();

    // 2. Se não há transações reais, retorna dados mockados
    if (transactions.length === 0 || users.length === 0) {
      const { competitors } = initializeMockData();
      
      const mockRanking: RankingEntry[] = competitors.map((competitor) => {
        const monthlyReturn = competitor.monthlyReturn;
        const annualReturn = competitor.annualReturn ?? monthlyReturn * 12;
        const returnValue = period === 'anual' ? annualReturn : monthlyReturn;
        
        return {
          userId: competitor.id,
          name: competitor.name,
          rank: 0, // Será atribuído após ordenação
          monthlyReturn,
          annualReturn,
          totalInvested: 10000, // Valor mockado
          currentValue: 10000 * (1 + (returnValue / 100)), // Valor mockado
          avatar: competitor.avatar, // Incluir avatar
          portfolio: competitor.portfolio, // Incluir portfolio
        };
      });

      // Ordena por rentabilidade
      const returnField = period === 'anual' ? 'annualReturn' : 'monthlyReturn';
      mockRanking.sort((a, b) => {
        const aReturn = a[returnField] || 0;
        const bReturn = b[returnField] || 0;
        return bReturn - aReturn;
      });

      // Reatribui ranks após ordenação
      mockRanking.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      const result: RankingResult = {
        period,
        lastUpdate: new Date(),
        ranking: mockRanking,
        totalParticipants: mockRanking.length, // Total de participantes mockados
      };

      // Armazenar no cache
      RankingCache.setRanking(period, result);

      return result;
    }

    // 3. Coleta tickers únicos e adiciona ao PriceService
    priceService.collectTickersFromTransactions(transactions);

    // 4. Calcula portfolio de cada usuário
    const userRankings: RankingEntry[] = [];

    for (const user of users) {
      const userTransactions = transactions.filter(tx => tx.userId === user.id);
      
      if (userTransactions.length === 0) {
        continue;
      }

      const portfolio = calculatePortfolio(userTransactions, prices);

      // Calcula rentabilidade mensal e anual
      const monthlyReturn = portfolio.returnPercentage;
      const annualReturn = monthlyReturn * 12; // Simplificado para MVP

      userRankings.push({
        userId: user.id,
        name: user.name,
        rank: 0, // Será atribuído após ordenação
        monthlyReturn: Number(monthlyReturn.toFixed(2)),
        annualReturn: Number(annualReturn.toFixed(2)),
        totalInvested: Number(portfolio.totalInvested.toFixed(2)),
        currentValue: Number(portfolio.currentValue.toFixed(2)),
      });
    }

    // 5. Ordena por rentabilidade (decrescente)
    const returnField = period === 'anual' ? 'annualReturn' : 'monthlyReturn';
    userRankings.sort((a, b) => {
      const aReturn = a[returnField] || 0;
      const bReturn = b[returnField] || 0;
      return bReturn - aReturn;
    });

    // 6. Atribui ranks
    userRankings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const result: RankingResult = {
      period,
      lastUpdate: new Date(),
      ranking: userRankings,
      totalParticipants: userRankings.length, // Total real de participantes com transações
    };

    // Armazenar no cache
    RankingCache.setRanking(period, result);

    return result;
  }

  /**
   * Obtém ranking do cache (sem calcular)
   */
  getRanking(period: 'mensal' | 'anual' = 'mensal'): RankingResult | null {
    return RankingCache.getRanking(period);
  }

  /**
   * Calcula portfolio de um usuário específico
   */
  async calculateUserPortfolio(userId: string): Promise<{
    monthlyReturn: number;
    annualReturn: number;
    totalInvested: number;
    currentValue: number;
    positions: Array<{
      ticker: string;
      quantity: number;
      averagePrice: number;
      currentPrice: number;
      return: number;
    }>;
  }> {
    const transactions = loadAllTransactions();
    const userTransactions = transactions.filter(tx => tx.userId === userId);
    const prices = priceService.getCurrentPrices();

    const portfolio = calculatePortfolio(userTransactions, prices);

    // Calcula detalhes das posições
    const positions = portfolio.positions.map(pos => {
      const normalizedTicker = pos.ticker.endsWith('.SA') 
        ? pos.ticker 
        : `${pos.ticker}.SA`;
      const currentPrice = prices[normalizedTicker] || prices[pos.ticker] || 0;
      const positionValue = pos.quantity * currentPrice;
      const investedValue = pos.quantity * pos.averagePrice;
      const returnValue = investedValue > 0 
        ? ((positionValue - investedValue) / investedValue) * 100 
        : 0;

      return {
        ticker: pos.ticker,
        quantity: pos.quantity,
        averagePrice: pos.averagePrice,
        currentPrice,
        return: Number(returnValue.toFixed(2)),
      };
    });

    return {
      monthlyReturn: Number(portfolio.returnPercentage.toFixed(2)),
      annualReturn: Number((portfolio.returnPercentage * 12).toFixed(2)),
      totalInvested: Number(portfolio.totalInvested.toFixed(2)),
      currentValue: Number(portfolio.currentValue.toFixed(2)),
      positions,
    };
  }

  /**
   * Atualiza rank de um usuário específico
   * (Útil para atualizações incrementais)
   */
  async updateUserRank(userId: string): Promise<RankingEntry | null> {
    const ranking = await this.calculateRanking('mensal');
    const userEntry = ranking.ranking.find(entry => entry.userId === userId);
    return userEntry || null;
  }
}

// Singleton instance
export const rankingService = new RankingService();

