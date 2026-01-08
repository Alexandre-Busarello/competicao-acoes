import { priceService } from './price-service';
import { calculatePortfolio, calculateReturns, calculateTotalFromSales } from '@/lib/utils/portfolio-calculator';
import { prisma } from '@/lib/prisma/client';
import { RankingCache } from '@/lib/cache/ranking-cache';
import { determineAssetType, getAssetName } from '@/lib/utils/asset-type';
import { yahooFinanceService } from './yahoo-finance-service';
import { startOfYear, endOfYear } from 'date-fns';
import type { Asset } from '@/types';

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

export class RankingService {
  /**
   * Calcula ambos os rankings (mensal e anual) usando os mesmos preços
   * Garante consistência entre os dois rankings
   */
  async calculateBothRankings(): Promise<{
    monthly: RankingResult;
    annual: RankingResult;
  }> {
    // 1. Carrega transações e usuários do banco (uma vez para ambos)
    // Filtrar apenas transações do ano atual
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        user: true,
      },
    });

    // Filtrar apenas usuários com assinatura ativa
    const users = await prisma.user.findMany({
      where: {
        isPremium: true,
        subscription: {
          status: 'active',
        },
      },
      include: {
        subscription: true,
      },
    });

    // 2. Obter preços uma única vez (garante consistência)
    const prices = priceService.getCurrentPrices();

    // 3. Se não há transações ou usuários, retorna rankings vazios
    if (transactions.length === 0 || users.length === 0) {
      const emptyResult: RankingResult = {
        period: 'mensal',
        lastUpdate: new Date(),
        ranking: [],
        totalParticipants: 0,
      };

      return {
        monthly: { ...emptyResult, period: 'mensal' },
        annual: { ...emptyResult, period: 'anual' },
      };
    }

    // 4. Coleta tickers únicos e adiciona ao PriceService
    priceService.collectTickersFromTransactions(
      transactions.map(t => ({ ticker: t.ticker }))
    );

    // 5. Preparar transações dos usuários (uma vez para ambos)
    const userTransactionsMap = new Map<string, any[]>();
    
    for (const user of users) {
      const userTransactions = transactions
        .filter(tx => tx.userId === user.id)
        .map(tx => ({
          id: tx.id,
          userId: tx.userId,
          ticker: tx.ticker,
          type: tx.type as 'compra' | 'venda',
          quantity: tx.quantity.toNumber(),
          price: tx.price.toNumber(),
          date: tx.date,
          createdAt: tx.createdAt,
        }));
      
      if (userTransactions.length > 0) {
        userTransactionsMap.set(user.id, userTransactions);
      }
    }

    // 6. Calcular portfolios e rankings usando os mesmos preços
    const monthlyRankings: RankingEntry[] = [];
    const annualRankings: RankingEntry[] = [];

    for (const user of users) {
      const userTransactions = userTransactionsMap.get(user.id);
      if (!userTransactions || userTransactions.length === 0) {
        continue;
      }

      // Calcular posições usando os mesmos preços
      const portfolio = calculatePortfolio(userTransactions, prices);

      // Criar assets com tipo e nome (usando os mesmos preços)
      const assets: Asset[] = await Promise.all(
        portfolio.positions.map(async (pos) => {
          const normalizedTicker = pos.ticker.endsWith('.SA') 
            ? pos.ticker 
            : `${pos.ticker}.SA`;
          
          const tickerVariations = [
            normalizedTicker,
            pos.ticker,
            normalizedTicker.toUpperCase(),
            pos.ticker.toUpperCase(),
          ];
          
          let currentPrice = 0;
          for (const variation of tickerVariations) {
            if (prices[variation] && prices[variation] > 0) {
              currentPrice = prices[variation];
              break;
            }
          }
          
          if (currentPrice === 0) {
            try {
              let price = await yahooFinanceService.getCurrentPrice(pos.ticker);
              if (!price || price === 0) {
                price = await yahooFinanceService.getCurrentPrice(normalizedTicker);
              }
              if (price && price > 0) {
                currentPrice = price;
              }
            } catch (error) {
              console.error(`Erro ao buscar preço de ${pos.ticker}:`, error);
            }
          }
          
          let quoteData: any = null;
          try {
            const normalized = normalizedTicker;
            quoteData = await yahooFinanceService.getQuoteData(normalized);
          } catch (error) {
            // Ignorar erro
          }
          
          const assetType = determineAssetType(pos.ticker, quoteData);
          const assetName = getAssetName(pos.ticker, quoteData);
          
          const positionValue = pos.quantity * currentPrice;
          const investedValue = pos.quantity * pos.averagePrice;
          const returnValue = investedValue > 0 
            ? ((positionValue - investedValue) / investedValue) * 100 
            : 0;
          
          return {
            id: `${user.id}-${pos.ticker}`,
            ticker: pos.ticker,
            name: assetName,
            type: assetType,
            quantity: pos.quantity,
            averagePrice: pos.averagePrice,
            currentPrice: currentPrice,
            return: Number(returnValue.toFixed(2)),
          };
        })
      );

      // Recalcular currentValue usando preços atualizados dos assets + dinheiro de vendas
      const totalInvested = portfolio.totalInvested;
      
      // Calcular valor das posições com preços atualizados dos assets
      const positionsValue = assets.reduce((sum, asset) => {
        return sum + (asset.quantity * asset.currentPrice);
      }, 0);
      
      // Calcular dinheiro recebido em vendas
      const cashFromSales = calculateTotalFromSales(userTransactions);
      
      // Valor total atual = posições + dinheiro de vendas
      const currentValue = positionsValue + cashFromSales;
      
      const firstTransactionDate = userTransactions.length > 0
        ? new Date(Math.min(...userTransactions.map(tx => tx.date.getTime())))
        : new Date();
      
      // Calcular retornos para ambos os períodos usando os mesmos valores
      const { monthlyReturn, annualReturn: monthlyAnnualReturn } = calculateReturns(
        currentValue,
        totalInvested,
        firstTransactionDate,
        'mensal'
      );
      
      const { monthlyReturn: annualMonthlyReturn, annualReturn } = calculateReturns(
        currentValue,
        totalInvested,
        firstTransactionDate,
        'anual'
      );

      const baseEntry = {
        userId: user.id,
        name: user.name,
        rank: 0, // Será atribuído após ordenação
        totalInvested: Number(totalInvested.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        // Avatar não é salvo aqui - será buscado da tabela User ao listar
        portfolio: assets,
      };

      monthlyRankings.push({
        ...baseEntry,
        monthlyReturn,
        annualReturn: monthlyAnnualReturn,
      });

      annualRankings.push({
        ...baseEntry,
        monthlyReturn: annualMonthlyReturn,
        annualReturn,
      });
    }

    // 7. Ordenar e atribuir ranks
    monthlyRankings.sort((a, b) => b.monthlyReturn - a.monthlyReturn);
    monthlyRankings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    annualRankings.sort((a, b) => (b.annualReturn || 0) - (a.annualReturn || 0));
    annualRankings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // 8. Criar resultados
    const monthlyResult: RankingResult = {
      period: 'mensal',
      lastUpdate: new Date(),
      ranking: monthlyRankings,
      totalParticipants: monthlyRankings.length,
    };

    const annualResult: RankingResult = {
      period: 'anual',
      lastUpdate: new Date(),
      ranking: annualRankings,
      totalParticipants: annualRankings.length,
    };

    // 9. Salvar ambos no banco
    try {
      await Promise.all([
        prisma.rankingCalculation.create({
          data: {
            period: 'mensal',
            rankingData: monthlyResult as any,
            totalParticipants: monthlyResult.totalParticipants,
            calculatedAt: monthlyResult.lastUpdate,
          },
        }),
        prisma.rankingCalculation.create({
          data: {
            period: 'anual',
            rankingData: annualResult as any,
            totalParticipants: annualResult.totalParticipants,
            calculatedAt: annualResult.lastUpdate,
          },
        }),
      ]);
    } catch (error) {
      console.error('Erro ao salvar rankings no banco:', error);
    }

    // 10. Atualizar cache
    RankingCache.setRanking('mensal', monthlyResult);
    RankingCache.setRanking('anual', annualResult);

    return {
      monthly: monthlyResult,
      annual: annualResult,
    };
  }

  /**
   * Calcula ranking completo para um período
   */
  async calculateRanking(period: 'mensal' | 'anual' = 'mensal'): Promise<RankingResult> {
    // 1. Carrega transações e usuários do banco
    // Filtrar apenas transações do ano atual
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        user: true,
      },
    });

    // Filtrar apenas usuários com assinatura ativa
    const users = await prisma.user.findMany({
      where: {
        isPremium: true,
        subscription: {
          status: 'active',
        },
      },
      include: {
        subscription: true,
      },
    });

    const prices = priceService.getCurrentPrices();

    // 2. Se não há transações ou usuários, retorna ranking vazio
    if (transactions.length === 0 || users.length === 0) {
      const result: RankingResult = {
        period,
        lastUpdate: new Date(),
        ranking: [],
        totalParticipants: 0,
      };

      RankingCache.setRanking(period, result);
      return result;
    }

    // 3. Coleta tickers únicos e adiciona ao PriceService
    priceService.collectTickersFromTransactions(
      transactions.map(t => ({ ticker: t.ticker }))
    );

    // 4. Calcula portfolio de cada usuário
    const userRankings: RankingEntry[] = [];

    for (const user of users) {
      const userTransactions = transactions
        .filter(tx => tx.userId === user.id)
        .map(tx => ({
          id: tx.id,
          userId: tx.userId,
          ticker: tx.ticker,
          type: tx.type as 'compra' | 'venda',
          quantity: tx.quantity.toNumber(),
          price: tx.price.toNumber(),
          date: tx.date,
          createdAt: tx.createdAt,
        }));
      
      if (userTransactions.length === 0) {
        continue;
      }

      // Calcular posições primeiro
      const portfolio = calculatePortfolio(userTransactions, prices);

      // Criar assets com tipo e nome, buscando preços atualizados
      const assets: Asset[] = await Promise.all(
        portfolio.positions.map(async (pos) => {
          // Normalizar ticker para buscar preço
          const normalizedTicker = pos.ticker.endsWith('.SA') 
            ? pos.ticker 
            : `${pos.ticker}.SA`;
          
          // Buscar preço atual (tentar diferentes variações)
          // Tentar: normalizedTicker, ticker original, uppercase de ambos
          const tickerVariations = [
            normalizedTicker,
            pos.ticker,
            normalizedTicker.toUpperCase(),
            pos.ticker.toUpperCase(),
          ];
          
          let currentPrice = 0;
          for (const variation of tickerVariations) {
            if (prices[variation] && prices[variation] > 0) {
              currentPrice = prices[variation];
              break;
            }
          }
          
          // Se preço não encontrado no cache, tentar buscar do Yahoo Finance
          if (currentPrice === 0) {
            try {
              // Tentar com o ticker original primeiro
              let price = await yahooFinanceService.getCurrentPrice(pos.ticker);
              if (!price || price === 0) {
                // Tentar com o ticker normalizado
                price = await yahooFinanceService.getCurrentPrice(normalizedTicker);
              }
              if (price && price > 0) {
                currentPrice = price;
              }
            } catch (error) {
              console.error(`Erro ao buscar preço de ${pos.ticker}:`, error);
            }
          }
          
          // Buscar informações adicionais do Yahoo Finance para determinar tipo
          let quoteData: any = null;
          try {
            const normalized = normalizedTicker;
            quoteData = await yahooFinanceService.getQuoteData(normalized);
          } catch (error) {
            // Ignorar erro - usaremos padrão do ticker
          }
          
          // Determinar tipo e nome do ativo
          const assetType = determineAssetType(pos.ticker, quoteData);
          const assetName = getAssetName(pos.ticker, quoteData);
          
          // Calcular rentabilidade individual do ativo
          const positionValue = pos.quantity * currentPrice;
          const investedValue = pos.quantity * pos.averagePrice;
          const returnValue = investedValue > 0 
            ? ((positionValue - investedValue) / investedValue) * 100 
            : 0;
          
          return {
            id: `${user.id}-${pos.ticker}`,
            ticker: pos.ticker,
            name: assetName,
            type: assetType,
            quantity: pos.quantity,
            averagePrice: pos.averagePrice,
            currentPrice: currentPrice,
            return: Number(returnValue.toFixed(2)),
          };
        })
      );

      // Recalcular currentValue usando preços atualizados dos assets + dinheiro de vendas
      const totalInvested = portfolio.totalInvested;
      
      // Calcular valor das posições com preços atualizados dos assets
      const positionsValue = assets.reduce((sum, asset) => {
        return sum + (asset.quantity * asset.currentPrice);
      }, 0);
      
      // Calcular dinheiro recebido em vendas
      const cashFromSales = calculateTotalFromSales(userTransactions);
      
      // Valor total atual = posições + dinheiro de vendas
      const currentValue = positionsValue + cashFromSales;
      
      // Calcular retorno mensal e anualizado usando função centralizada
      const firstTransactionDate = userTransactions.length > 0
        ? new Date(Math.min(...userTransactions.map(tx => tx.date.getTime())))
        : new Date();
      
      const { monthlyReturn, annualReturn } = calculateReturns(
        currentValue,
        totalInvested,
        firstTransactionDate,
        period // Passar período para calcular corretamente (acumulado para anual, projetado para mensal)
      );
      
      userRankings.push({
        userId: user.id,
        name: user.name,
        rank: 0, // Será atribuído após ordenação
        monthlyReturn,
        annualReturn,
        totalInvested: Number(totalInvested.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        // Avatar não é salvo aqui - será buscado da tabela User ao listar
        portfolio: assets,
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

    // Salvar cálculo na tabela RankingCalculation
    try {
      await prisma.rankingCalculation.create({
        data: {
          period,
          rankingData: result as any, // Serializa o resultado completo como JSON
          totalParticipants: result.totalParticipants,
          calculatedAt: result.lastUpdate,
        },
      });
    } catch (error) {
      console.error(`Erro ao salvar ranking ${period} no banco:`, error);
      // Continua mesmo se falhar ao salvar - não quebra o fluxo
    }

    // Armazenar no cache também (para compatibilidade)
    RankingCache.setRanking(period, result);

    return result;
  }

  /**
   * Enriquece ranking com avatares atualizados da tabela User
   * @param ranking - Ranking sem avatares
   * @returns Ranking enriquecido com avatares
   */
  private async enrichRankingWithAvatars(ranking: RankingResult): Promise<RankingResult> {
    const userIds = ranking.ranking.map(entry => entry.userId);
    
    if (userIds.length === 0) {
      return ranking;
    }

    // Buscar avatares atualizados da tabela User
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    // Criar mapa de userId -> avatarUrl
    const avatarMap = new Map(users.map(u => [u.id, u.avatarUrl || undefined]));

    // Enriquecer ranking com avatares atualizados
    const enrichedRanking = ranking.ranking.map(entry => ({
      ...entry,
      avatar: avatarMap.get(entry.userId),
    }));

    return {
      ...ranking,
      ranking: enrichedRanking,
    };
  }

  /**
   * Obtém ranking mais recente do banco de dados
   * Busca o último cálculo salvo para o período especificado
   * Enriquece com avatares atualizados da tabela User
   */
  async getRanking(period: 'mensal' | 'anual' = 'mensal'): Promise<RankingResult | null> {
    try {
      // Buscar o último cálculo do período no banco
      const lastCalculation = await prisma.rankingCalculation.findFirst({
        where: {
          period,
        },
        orderBy: {
          calculatedAt: 'desc',
        },
      });

      if (!lastCalculation) {
        // Se não há cálculo no banco, tentar buscar do cache (fallback)
        const cachedRanking = RankingCache.getRanking(period);
        if (cachedRanking) {
          return this.enrichRankingWithAvatars(cachedRanking);
        }
        return null;
      }

      // Converter dados do banco para RankingResult
      const rankingData = lastCalculation.rankingData as any;
      const baseResult: RankingResult = {
        period: rankingData.period || period,
        lastUpdate: lastCalculation.calculatedAt,
        ranking: rankingData.ranking || [],
        totalParticipants: lastCalculation.totalParticipants,
      };

      // Enriquecer com avatares atualizados
      const result = await this.enrichRankingWithAvatars(baseResult);

      // Atualizar cache com dados do banco (para performance)
      RankingCache.setRanking(period, result);

      return result;
    } catch (error) {
      console.error(`Erro ao buscar ranking ${period} do banco:`, error);
      // Fallback para cache em caso de erro
      const cachedRanking = RankingCache.getRanking(period);
      if (cachedRanking) {
        return this.enrichRankingWithAvatars(cachedRanking);
      }
      return null;
    }
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
    // Filtrar apenas transações do ano atual
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });

    const userTransactions = transactions.map(tx => ({
      id: tx.id,
      userId: tx.userId,
      ticker: tx.ticker,
      type: tx.type as 'compra' | 'venda',
      quantity: tx.quantity.toNumber(),
      price: tx.price.toNumber(),
      date: tx.date,
      createdAt: tx.createdAt,
    }));

    const prices = priceService.getCurrentPrices();
    const portfolio = calculatePortfolio(userTransactions, prices);

    // Calcula detalhes das posições com tipo e nome
    const positions = await Promise.all(
      portfolio.positions.map(async (pos) => {
        // Normalizar ticker para buscar preço
        const normalizedTicker = pos.ticker.endsWith('.SA') 
          ? pos.ticker 
          : `${pos.ticker}.SA`;
        
        // Buscar preço atual (tentar diferentes variações)
        // Tentar: normalizedTicker, ticker original, uppercase de ambos
        const tickerVariations = [
          normalizedTicker,
          pos.ticker,
          normalizedTicker.toUpperCase(),
          pos.ticker.toUpperCase(),
        ];
        
        let currentPrice = 0;
        for (const variation of tickerVariations) {
          if (prices[variation] && prices[variation] > 0) {
            currentPrice = prices[variation];
            break;
          }
        }
        
        // Se preço não encontrado no cache, tentar buscar do Yahoo Finance
        if (currentPrice === 0) {
          try {
            // Tentar com o ticker original primeiro
            let price = await yahooFinanceService.getCurrentPrice(pos.ticker);
            if (!price || price === 0) {
              // Tentar com o ticker normalizado
              price = await yahooFinanceService.getCurrentPrice(normalizedTicker);
            }
            if (price && price > 0) {
              currentPrice = price;
            }
          } catch (error) {
            console.error(`Erro ao buscar preço de ${pos.ticker}:`, error);
          }
        }
        
        // Buscar informações adicionais do Yahoo Finance para determinar tipo
        let quoteData: any = null;
        try {
          const normalized = normalizedTicker;
          quoteData = await yahooFinanceService.getQuoteData(normalized);
        } catch (error) {
          // Ignorar erro - usaremos padrão do ticker
        }
        
        // Determinar tipo e nome do ativo
        const assetType = determineAssetType(pos.ticker, quoteData);
        const assetName = getAssetName(pos.ticker, quoteData);
        
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
          type: assetType,
          name: assetName,
        };
      })
    );

    // Recalcular currentValue usando preços atualizados das posições + dinheiro de vendas
    const totalInvested = portfolio.totalInvested;
    
    // Calcular valor das posições com preços atualizados
    const positionsValue = positions.reduce((sum, pos) => {
      return sum + (pos.quantity * pos.currentPrice);
    }, 0);
    
    // Calcular dinheiro recebido em vendas
    const cashFromSales = calculateTotalFromSales(userTransactions);
    
    // Valor total atual = posições + dinheiro de vendas
    const currentValue = positionsValue + cashFromSales;
    
    // Calcular retorno mensal e anualizado usando função centralizada
    const firstTransactionDate = userTransactions.length > 0
      ? new Date(Math.min(...userTransactions.map(tx => tx.date.getTime())))
      : new Date();
    
    // Para calculateUserPortfolio, sempre usar período 'mensal' (retorno anualizado/projetado)
    // O ranking anual será calculado quando necessário via calculateRanking('anual')
    const { monthlyReturn, annualReturn } = calculateReturns(
      currentValue,
      totalInvested,
      firstTransactionDate,
      'mensal'
    );

    return {
      monthlyReturn,
      annualReturn,
      totalInvested: Number(totalInvested.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
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
