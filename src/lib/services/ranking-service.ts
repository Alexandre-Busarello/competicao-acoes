import { priceService } from './price-service';
import { calculatePortfolio, calculateReturns, calculateTotalFromSales } from '@/lib/utils/portfolio-calculator';
import { prisma } from '@/lib/prisma/client';
import { RankingCache } from '@/lib/cache/ranking-cache';
import { determineAssetType, getAssetName, getETFCategory } from '@/lib/utils/asset-type';
import { yahooFinanceService } from './yahoo-finance-service';
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { getCurrentPeriod, getPeriodRange, isValidPeriod } from '@/lib/utils/period-utils';
import { executeInParallel } from '@/lib/utils/parallel-executor';
import { checkpointService, type CheckpointData } from './checkpoint-service';
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

// Tipo para salvar no banco (sem name e avatar, que são buscados da tabela User)
export type RankingEntryForStorage = Omit<RankingEntry, 'name' | 'avatar'>;

export interface RankingResult {
  period: 'mensal' | 'anual';
  lastUpdate: Date;
  ranking: RankingEntry[];
  totalParticipants: number; // Total real de participantes no ranking completo
}

// Tipo para salvar no banco (sem name e avatar)
export interface RankingResultForStorage {
  period: 'mensal' | 'anual';
  lastUpdate: Date;
  ranking: RankingEntryForStorage[];
  totalParticipants: number;
}

export class RankingService {
  /**
   * Calcula ambos os rankings (mensal e anual) usando os mesmos preços
   * Com suporte a checkpoint e timeout
   * Garante consistência entre os dois rankings
   */
  async calculateBothRankingsWithCheckpoint(
    checkpoint: CheckpointData,
    timeoutMs: number = 60000
  ): Promise<{
    completed: boolean;
    monthly?: RankingResult;
    annual?: RankingResult;
    processedCount: number;
    totalCount: number;
  }> {
    const startTime = Date.now();
    const deadline = startTime + timeoutMs;

    // 1. Carrega transações e usuários do banco (uma vez para ambos)
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

      await checkpointService.completeCheckpoint(checkpoint.id);
      return {
        completed: true,
        monthly: { ...emptyResult, period: 'mensal' },
        annual: { ...emptyResult, period: 'anual' },
        processedCount: 0,
        totalCount: 0,
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

    // 6. Inicializar rankings (carregar do checkpoint se existir)
    const monthlyRankings: RankingEntryForStorage[] = checkpoint.monthlyRankings || [];
    const annualRankings: RankingEntryForStorage[] = checkpoint.annualRankings || [];
    const processedUserIds = new Set(checkpoint.processedUserIds || []);

    // Filtrar usuários não processados
    const usersToProcess = users.filter(user => !processedUserIds.has(user.id));

    // 7. Processar usuários restantes com timeout
    const processUserTask = async (user: typeof users[0]) => {
      // Verificar timeout antes de processar
      if (Date.now() >= deadline) {
        return null;
      }

      const userTransactions = userTransactionsMap.get(user.id);
      if (!userTransactions || userTransactions.length === 0) {
        return null;
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
          const etfCategory = assetType === 'etf' ? getETFCategory(pos.ticker) : undefined;
          
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
            etfCategory,
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
        rank: 0, // Será atribuído após ordenação
        totalInvested: Number(totalInvested.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        portfolio: assets,
      };

      return {
        monthly: {
          ...baseEntry,
          monthlyReturn,
          annualReturn: monthlyAnnualReturn,
        },
        annual: {
          ...baseEntry,
          monthlyReturn: annualMonthlyReturn,
          annualReturn,
        },
        userId: user.id,
      };
    };

    // Processa usuários em paralelo com concorrência controlada
    console.log(`[Ranking] Processando ${usersToProcess.length} usuários em paralelo (concorrência: 7)`);
    const parallelStartTime = Date.now();
    const tasks = usersToProcess.map((user, index) => async () => {
      const taskStartTime = Date.now();
      console.log(`[Ranking] Iniciando processamento do usuário ${index + 1}/${usersToProcess.length} (ID: ${user.id})`);
      const result = await processUserTask(user);
      const taskDuration = Date.now() - taskStartTime;
      console.log(`[Ranking] Usuário ${index + 1} processado em ${taskDuration}ms`);
      return result;
    });
    const results = await executeInParallel(tasks, {
      concurrency: 7,
      minDelay: 0,
      maxJitter: 0,
    });
    const parallelDuration = Date.now() - parallelStartTime;
    console.log(`[Ranking] Processamento paralelo concluído em ${parallelDuration}ms (${usersToProcess.length} usuários)`);

    // Coleta resultados e atualiza checkpoint periodicamente
    let lastCheckpointUpdate = Date.now();
    const CHECKPOINT_UPDATE_INTERVAL = 5000; // Atualiza checkpoint a cada 5 segundos

    for (const result of results) {
      // Verificar timeout
      if (Date.now() >= deadline) {
        break;
      }

      if (result.success && result.result) {
        monthlyRankings.push(result.result.monthly);
        annualRankings.push(result.result.annual);
        processedUserIds.add(result.result.userId);

        // Atualizar checkpoint periodicamente
        if (Date.now() - lastCheckpointUpdate >= CHECKPOINT_UPDATE_INTERVAL) {
          await checkpointService.updateCheckpoint(checkpoint.id, {
            processedUserIds: Array.from(processedUserIds),
            monthlyRankings,
            annualRankings,
          });
          lastCheckpointUpdate = Date.now();
        }
      }
    }

    // Verificar se completou
    const completed = processedUserIds.size >= users.length || Date.now() >= deadline;

    if (completed) {
      // 8. Ordenar e atribuir ranks
      monthlyRankings.sort((a, b) => b.monthlyReturn - a.monthlyReturn);
      monthlyRankings.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      annualRankings.sort((a, b) => (b.annualReturn || 0) - (a.annualReturn || 0));
      annualRankings.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // 9. Criar resultados para salvar no banco
      const monthlyResultForStorage: RankingResultForStorage = {
        period: 'mensal',
        lastUpdate: new Date(),
        ranking: monthlyRankings,
        totalParticipants: monthlyRankings.length,
      };

      const annualResultForStorage: RankingResultForStorage = {
        period: 'anual',
        lastUpdate: new Date(),
        ranking: annualRankings,
        totalParticipants: annualRankings.length,
      };

      // 10. Enriquecer com dados do usuário antes de retornar
      const monthlyResult = await this.enrichRankingWithUserData(monthlyResultForStorage as RankingResult);
      const annualResult = await this.enrichRankingWithUserData(annualResultForStorage as RankingResult);

      // 11. Salvar ambos no banco
      const current = getCurrentPeriod();
      try {
        await Promise.all([
          prisma.rankingCalculation.create({
            data: {
              period: 'mensal',
              year: current.year,
              month: current.month,
              rankingData: monthlyResultForStorage as any,
              totalParticipants: monthlyResultForStorage.totalParticipants,
              calculatedAt: monthlyResultForStorage.lastUpdate,
            } as any,
          }),
          prisma.rankingCalculation.create({
            data: {
              period: 'anual',
              year: current.year,
              month: null,
              rankingData: annualResultForStorage as any,
              totalParticipants: annualResultForStorage.totalParticipants,
              calculatedAt: annualResultForStorage.lastUpdate,
            } as any,
          }),
        ]);
      } catch (error) {
        console.error('Erro ao salvar rankings no banco:', error);
      }

      // 12. Atualizar cache
      RankingCache.setRanking('mensal', monthlyResult);
      RankingCache.setRanking('anual', annualResult);

      // 13. Marcar checkpoint como completo
      await checkpointService.completeCheckpoint(checkpoint.id);

      return {
        completed: true,
        monthly: monthlyResult,
        annual: annualResult,
        processedCount: processedUserIds.size,
        totalCount: users.length,
      };
    } else {
      // Salvar progresso parcial no checkpoint
      await checkpointService.updateCheckpoint(checkpoint.id, {
        phase: 'ranking',
        processedUserIds: Array.from(processedUserIds),
        monthlyRankings,
        annualRankings,
      });

      return {
        completed: false,
        processedCount: processedUserIds.size,
        totalCount: users.length,
      };
    }
  }

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
    // Paraleliza processamento de usuários com controle de concorrência
    // Limita a 5 usuários simultâneos para não sobrecarregar o banco de dados
    const monthlyRankings: RankingEntryForStorage[] = [];
    const annualRankings: RankingEntryForStorage[] = [];

    const processUserTask = async (user: typeof users[0]) => {
      const userTransactions = userTransactionsMap.get(user.id);
      if (!userTransactions || userTransactions.length === 0) {
        return null;
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
          const etfCategory = assetType === 'etf' ? getETFCategory(pos.ticker) : undefined;
          
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
            etfCategory,
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
        // name e avatar não são salvos aqui - serão buscados da tabela User ao listar
        rank: 0, // Será atribuído após ordenação
        totalInvested: Number(totalInvested.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        portfolio: assets,
      };

      return {
        monthly: {
          ...baseEntry,
          monthlyReturn,
          annualReturn: monthlyAnnualReturn,
        },
        annual: {
          ...baseEntry,
          monthlyReturn: annualMonthlyReturn,
          annualReturn,
        },
      };
    };

    // Processa usuários em paralelo com concorrência controlada
    const tasks = users.map(user => () => processUserTask(user));
    const results = await executeInParallel(tasks, {
      concurrency: 7, // Processa até 7 usuários simultaneamente (limite seguro para Supabase pgbouncer)
      minDelay: 0, // Sem delay entre processamento de usuários (já controlado pela concorrência)
      maxJitter: 0,
    });

    // Coleta resultados
    for (const result of results) {
      if (result.success && result.result) {
        monthlyRankings.push(result.result.monthly);
        annualRankings.push(result.result.annual);
      }
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

    // 8. Criar resultados para salvar no banco (sem name e avatar)
    const monthlyResultForStorage: RankingResultForStorage = {
      period: 'mensal',
      lastUpdate: new Date(),
      ranking: monthlyRankings,
      totalParticipants: monthlyRankings.length,
    };

    const annualResultForStorage: RankingResultForStorage = {
      period: 'anual',
      lastUpdate: new Date(),
      ranking: annualRankings,
      totalParticipants: annualRankings.length,
    };

    // 9. Enriquecer com dados do usuário antes de retornar
    const monthlyResult = await this.enrichRankingWithUserData(monthlyResultForStorage as RankingResult);
    const annualResult = await this.enrichRankingWithUserData(annualResultForStorage as RankingResult);

    // 10. Salvar ambos no banco (sem name e avatar)
    // Usar período vigente para calculateBothRankings
    const current = getCurrentPeriod();
    try {
      await Promise.all([
        prisma.rankingCalculation.create({
          data: {
            period: 'mensal',
            year: current.year,
            month: current.month,
            rankingData: monthlyResultForStorage as any,
            totalParticipants: monthlyResultForStorage.totalParticipants,
            calculatedAt: monthlyResultForStorage.lastUpdate,
          } as any,
        }),
        prisma.rankingCalculation.create({
          data: {
            period: 'anual',
            year: current.year,
            month: null,
            rankingData: annualResultForStorage as any,
            totalParticipants: annualResultForStorage.totalParticipants,
            calculatedAt: annualResultForStorage.lastUpdate,
          } as any,
        }),
      ]);
    } catch (error) {
      console.error('Erro ao salvar rankings no banco:', error);
    }

    // 11. Atualizar cache (com dados enriquecidos)
    RankingCache.setRanking('mensal', monthlyResult);
    RankingCache.setRanking('anual', annualResult);

    return {
      monthly: monthlyResult,
      annual: annualResult,
    };
  }

  /**
   * Calcula ranking completo para um período específico
   * Se year e month não forem fornecidos, usa o período vigente
   */
  async calculateRanking(
    period: 'mensal' | 'anual' = 'mensal',
    year?: number,
    month?: number
  ): Promise<RankingResult> {
    // Se não especificado, usar período vigente
    if (!year) {
      const current = getCurrentPeriod();
      year = current.year;
      month = period === 'mensal' ? current.month : undefined;
    }
    
    // Validar período
    if (!isValidPeriod(year, month)) {
      throw new Error(`Período inválido: ${period} ${year}${month ? `/${month}` : ''}`);
    }
    
    // 1. Obter intervalo de datas para o período
    const { start, end } = getPeriodRange(period, year, month);
    
    // 2. Carrega transações do período específico
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
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
    const userRankings: RankingEntryForStorage[] = [];

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
          const etfCategory = assetType === 'etf' ? getETFCategory(pos.ticker) : undefined;
          
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
            etfCategory,
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
        // name e avatar não são salvos aqui - serão buscados da tabela User ao listar
        rank: 0, // Será atribuído após ordenação
        monthlyReturn,
        annualReturn,
        totalInvested: Number(totalInvested.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
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

    const resultForStorage: RankingResultForStorage = {
      period,
      lastUpdate: new Date(),
      ranking: userRankings,
      totalParticipants: userRankings.length, // Total real de participantes com transações
    };

    // Salvar cálculo na tabela RankingCalculation (sem name e avatar)
    try {
      await prisma.rankingCalculation.create({
        data: {
          period,
          year,
          month: period === 'mensal' ? month : null,
          rankingData: resultForStorage as any, // Serializa sem name e avatar
          totalParticipants: resultForStorage.totalParticipants,
          calculatedAt: resultForStorage.lastUpdate,
        } as any,
      });
    } catch (error) {
      console.error(`Erro ao salvar ranking ${period} no banco:`, error);
      // Continua mesmo se falhar ao salvar - não quebra o fluxo
    }

    // Enriquecer com dados do usuário antes de retornar
    const result = await this.enrichRankingWithUserData(resultForStorage as RankingResult);

    // Armazenar no cache também (para compatibilidade) - com dados enriquecidos
    RankingCache.setRanking(period, result);

    return result;
  }

  /**
   * Enriquece ranking com dados atualizados da tabela User (nome e avatar)
   * @param ranking - Ranking sem nome e avatar (pode ser RankingResult ou RankingResultForStorage)
   * @returns Ranking enriquecido com nome e avatar atualizados
   */
  private async enrichRankingWithUserData(ranking: RankingResult | RankingResultForStorage): Promise<RankingResult> {
    const userIds = ranking.ranking.map(entry => entry.userId);
    
    if (userIds.length === 0) {
      return ranking as RankingResult;
    }

    // Buscar nome e avatar atualizados da tabela User
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    // Criar mapas de userId -> dados do usuário
    const nameMap = new Map(users.map(u => [u.id, u.name]));
    const avatarMap = new Map(users.map(u => [u.id, u.avatarUrl || undefined]));

    // Enriquecer ranking com nome e avatar atualizados
    const enrichedRanking: RankingEntry[] = ranking.ranking.map(entry => ({
      ...entry,
      name: nameMap.get(entry.userId) || 'Usuário',
      avatar: avatarMap.get(entry.userId),
    }));

    return {
      ...ranking,
      ranking: enrichedRanking,
    } as RankingResult;
  }

  /**
   * Obtém ranking mais recente do banco de dados
   * Busca o último cálculo salvo para o período especificado
   * Se year e month não forem fornecidos, usa o período vigente
   * Enriquece com nome e avatar atualizados da tabela User
   */
  async getRanking(
    period: 'mensal' | 'anual' = 'mensal',
    year?: number,
    month?: number
  ): Promise<RankingResult | null> {
    try {
      // Se não especificado, usar período vigente
      if (!year) {
        const current = getCurrentPeriod();
        year = current.year;
        month = period === 'mensal' ? current.month : undefined;
      }
      
      // Buscar o último cálculo do período específico no banco
      const whereClause: any = {
        period,
        year,
      };
      
      if (period === 'mensal' && month) {
        whereClause.month = month;
      } else {
        whereClause.month = null;
      }
      
      const lastCalculation = await prisma.rankingCalculation.findFirst({
        where: whereClause,
        orderBy: {
          calculatedAt: 'desc',
        },
      });

      if (!lastCalculation) {
        // Se não há cálculo no banco, tentar buscar do cache (fallback)
        const cachedRanking = RankingCache.getRanking(period);
        if (cachedRanking) {
          return this.enrichRankingWithUserData(cachedRanking);
        }
        return null;
      }

      // Converter dados do banco para RankingResultForStorage (sem name e avatar)
      const rankingData = lastCalculation.rankingData as any;
      const baseResult: RankingResultForStorage = {
        period: rankingData.period || period,
        lastUpdate: lastCalculation.calculatedAt,
        ranking: rankingData.ranking || [],
        totalParticipants: lastCalculation.totalParticipants,
      };

      // Enriquecer com nome e avatar atualizados da tabela User
      const result = await this.enrichRankingWithUserData(baseResult);

      // Atualizar cache com dados do banco (para performance)
      RankingCache.setRanking(period, result);

      return result;
    } catch (error) {
      console.error(`Erro ao buscar ranking ${period} do banco:`, error);
      // Fallback para cache em caso de erro
      const cachedRanking = RankingCache.getRanking(period);
      if (cachedRanking) {
        return this.enrichRankingWithUserData(cachedRanking);
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
        const etfCategory = assetType === 'etf' ? getETFCategory(pos.ticker) : undefined;
        
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
          etfCategory,
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
