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
export type RankingEntryForStorage = Omit<RankingEntry, 'name' | 'avatar'> & {
  lastTransactionDate?: Date; // Data da última transação (para critério de desempate)
  accountCreatedAt?: Date; // Data de criação da conta (para critério de desempate)
};

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

    // 1. Carrega transações do ano atual primeiro
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

    // 2. Extrair IDs únicos de usuários que têm transações
    const userIdsWithTransactions = new Set(
      transactions.map(tx => tx.userId)
    );

    // 3. Buscar todos os usuários que têm transações (qualquer usuário pode participar do ranking)
    // Isso garante que novos usuários com transações sejam incluídos
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(userIdsWithTransactions),
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

    // 5. Preparar transações dos usuários separadas por período
    // Obter intervalo do mês atual para ranking mensal
    const currentPeriod = getCurrentPeriod();
    const { start: monthStart, end: monthEnd } = getPeriodRange('mensal', currentPeriod.year, currentPeriod.month);
    
    const userTransactionsMapMonthly = new Map<string, any[]>();
    const userTransactionsMapAnnual = new Map<string, any[]>();
    
    for (const user of users) {
      // Transações do mês atual (para ranking mensal)
      const monthlyTransactions = transactions
        .filter(tx => tx.userId === user.id && tx.date >= monthStart && tx.date <= monthEnd)
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
      
      // Transações do ano atual (para ranking anual)
      const annualTransactions = transactions
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
      
      if (monthlyTransactions.length > 0) {
        userTransactionsMapMonthly.set(user.id, monthlyTransactions);
      }
      
      if (annualTransactions.length > 0) {
        userTransactionsMapAnnual.set(user.id, annualTransactions);
      }
    }

    // 8. Inicializar rankings (carregar do checkpoint se existir)
    const monthlyRankings: RankingEntryForStorage[] = checkpoint.monthlyRankings || [];
    const annualRankings: RankingEntryForStorage[] = checkpoint.annualRankings || [];
    const processedUserIds = new Set(checkpoint.processedUserIds || []);

    // Filtrar usuários não processados
    const usersToProcess = users.filter(user => !processedUserIds.has(user.id));

    // 9. Processar usuários restantes com timeout
    const processUserTask = async (user: typeof users[0]) => {
      // Verificar timeout antes de processar
      if (Date.now() >= deadline) {
        return { userId: user.id, skipped: true };
      }

      const monthlyTransactions = userTransactionsMapMonthly.get(user.id);
      const annualTransactions = userTransactionsMapAnnual.get(user.id);
      
      if ((!monthlyTransactions || monthlyTransactions.length === 0) && 
          (!annualTransactions || annualTransactions.length === 0)) {
        // Usuário sem transações - marcar como processado mas não adicionar ao ranking
        return { userId: user.id, skipped: true };
      }

      // Calcular portfolios separados para mensal e anual
      const monthlyPortfolio = monthlyTransactions && monthlyTransactions.length > 0
        ? calculatePortfolio(monthlyTransactions, prices)
        : { positions: [], totalInvested: 0 };
      
      const annualPortfolio = annualTransactions && annualTransactions.length > 0
        ? calculatePortfolio(annualTransactions, prices)
        : { positions: [], totalInvested: 0 };

      // Função auxiliar para criar assets a partir de um portfolio
      const createAssetsFromPortfolio = async (portfolio: typeof monthlyPortfolio): Promise<Asset[]> => {
        return await Promise.all(
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
      };

      // Calcular assets separados para mensal e anual
      const monthlyAssets = monthlyPortfolio.positions.length > 0
        ? await createAssetsFromPortfolio(monthlyPortfolio)
        : [];
      
      const annualAssets = annualPortfolio.positions.length > 0
        ? await createAssetsFromPortfolio(annualPortfolio)
        : [];

      // Calcular valores mensais
      const monthlyTotalInvested = monthlyPortfolio.totalInvested;
      const monthlyPositionsValue = monthlyAssets.reduce((sum, asset) => {
        return sum + (asset.quantity * asset.currentPrice);
      }, 0);
      const monthlyCashFromSales = monthlyTransactions && monthlyTransactions.length > 0
        ? calculateTotalFromSales(monthlyTransactions)
        : 0;
      const monthlyCurrentValue = monthlyPositionsValue + monthlyCashFromSales;
      
      const monthlyFirstTransactionDate = monthlyTransactions && monthlyTransactions.length > 0
        ? new Date(Math.min(...monthlyTransactions.map(tx => tx.date.getTime())))
        : new Date();
      const monthlyLastTransactionDate = monthlyTransactions && monthlyTransactions.length > 0
        ? new Date(Math.max(...monthlyTransactions.map(tx => tx.createdAt.getTime())))
        : new Date();

      // Calcular valores anuais
      const annualTotalInvested = annualPortfolio.totalInvested;
      const annualPositionsValue = annualAssets.reduce((sum, asset) => {
        return sum + (asset.quantity * asset.currentPrice);
      }, 0);
      const annualCashFromSales = annualTransactions && annualTransactions.length > 0
        ? calculateTotalFromSales(annualTransactions)
        : 0;
      const annualCurrentValue = annualPositionsValue + annualCashFromSales;
      
      const annualFirstTransactionDate = annualTransactions && annualTransactions.length > 0
        ? new Date(Math.min(...annualTransactions.map(tx => tx.date.getTime())))
        : new Date();
      const annualLastTransactionDate = annualTransactions && annualTransactions.length > 0
        ? new Date(Math.max(...annualTransactions.map(tx => tx.createdAt.getTime())))
        : new Date();

      // Data de criação da conta (para critério de desempate)
      const accountCreatedAt = user.createdAt;
      
      // Calcular retornos separados para cada período
      const { monthlyReturn, annualReturn: monthlyAnnualReturn } = calculateReturns(
        monthlyCurrentValue,
        monthlyTotalInvested,
        monthlyFirstTransactionDate,
        'mensal'
      );
      
      const { monthlyReturn: annualMonthlyReturn, annualReturn } = calculateReturns(
        annualCurrentValue,
        annualTotalInvested,
        annualFirstTransactionDate,
        'anual'
      );

      // Criar entradas separadas para mensal e anual
      const monthlyEntry: RankingEntryForStorage | null = monthlyTransactions && monthlyTransactions.length > 0 ? {
        userId: user.id,
        rank: 0, // Será atribuído após ordenação
        totalInvested: Number(monthlyTotalInvested.toFixed(2)),
        currentValue: Number(monthlyCurrentValue.toFixed(2)),
        portfolio: monthlyAssets,
        monthlyReturn,
        annualReturn: monthlyAnnualReturn,
        lastTransactionDate: monthlyLastTransactionDate,
        accountCreatedAt,
      } : null;

      const annualEntry: RankingEntryForStorage | null = annualTransactions && annualTransactions.length > 0 ? {
        userId: user.id,
        rank: 0, // Será atribuído após ordenação
        totalInvested: Number(annualTotalInvested.toFixed(2)),
        currentValue: Number(annualCurrentValue.toFixed(2)),
        portfolio: annualAssets,
        monthlyReturn: annualMonthlyReturn,
        annualReturn,
        lastTransactionDate: annualLastTransactionDate,
        accountCreatedAt,
      } : null;

      return {
        monthly: monthlyEntry,
        annual: annualEntry,
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
        // Se foi pulado (sem transações), apenas marcar como processado
        if ('skipped' in result.result && result.result.skipped) {
          processedUserIds.add(result.result.userId);
        } else if ('monthly' in result.result && 'annual' in result.result) {
          // Adicionar ao ranking apenas se houver entrada válida para cada período
          if (result.result.monthly) {
            monthlyRankings.push(result.result.monthly);
          }
          if (result.result.annual) {
            annualRankings.push(result.result.annual);
          }
          // Marcar como processado se pelo menos um período foi processado
          if (result.result.monthly || result.result.annual) {
            processedUserIds.add(result.result.userId);
          }
        }

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

    // Atualizar checkpoint final antes de verificar conclusão
    // Garantir que todo progresso seja salvo
    await checkpointService.updateCheckpoint(checkpoint.id, {
      phase: 'ranking',
      processedUserIds: Array.from(processedUserIds),
      monthlyRankings,
      annualRankings,
    });

    // Verificar se completou (apenas quando todos os usuários foram processados)
    const completed = processedUserIds.size >= users.length;

    if (completed) {
      // 8. Ordenar e atribuir ranks com critério de desempate
      // Critério 1: Rentabilidade (maior ganha)
      // Critério 2: Número de ativos (mais ativos ganha)
      // Critério 3: Data da última transação (mais recente ganha)
      // Critério 4: Data de criação da conta (mais antiga ganha)
      monthlyRankings.sort((a, b) => {
        // Comparar por rentabilidade
        if (Math.abs(b.monthlyReturn - a.monthlyReturn) > 0.01) {
          return b.monthlyReturn - a.monthlyReturn;
        }
        // Desempate: número de ativos
        const aAssetsCount = a.portfolio?.length || 0;
        const bAssetsCount = b.portfolio?.length || 0;
        if (aAssetsCount !== bAssetsCount) {
          return bAssetsCount - aAssetsCount;
        }
        // Desempate: data da última transação (mais recente ganha)
        const aLastDate = a.lastTransactionDate?.getTime() || 0;
        const bLastDate = b.lastTransactionDate?.getTime() || 0;
        if (aLastDate !== bLastDate) {
          return bLastDate - aLastDate;
        }
        // Desempate: data de criação da conta (mais antiga ganha)
        const aAccountDate = a.accountCreatedAt?.getTime() || 0;
        const bAccountDate = b.accountCreatedAt?.getTime() || 0;
        return aAccountDate - bAccountDate;
      });
      monthlyRankings.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      annualRankings.sort((a, b) => {
        const aReturn = a.annualReturn || 0;
        const bReturn = b.annualReturn || 0;
        // Comparar por rentabilidade
        if (Math.abs(bReturn - aReturn) > 0.01) {
          return bReturn - aReturn;
        }
        // Desempate: número de ativos
        const aAssetsCount = a.portfolio?.length || 0;
        const bAssetsCount = b.portfolio?.length || 0;
        if (aAssetsCount !== bAssetsCount) {
          return bAssetsCount - aAssetsCount;
        }
        // Desempate: data da última transação (mais recente ganha)
        const aLastDate = a.lastTransactionDate?.getTime() || 0;
        const bLastDate = b.lastTransactionDate?.getTime() || 0;
        if (aLastDate !== bLastDate) {
          return bLastDate - aLastDate;
        }
        // Desempate: data de criação da conta (mais antiga ganha)
        const aAccountDate = a.accountCreatedAt?.getTime() || 0;
        const bAccountDate = b.accountCreatedAt?.getTime() || 0;
        return aAccountDate - bAccountDate;
      });
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
      // Progresso parcial já foi salvo acima, apenas retornar
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

    // Extrair IDs únicos de usuários que têm transações
    const userIdsWithTransactions = new Set(
      transactions.map(tx => tx.userId)
    );

    // Buscar todos os usuários que têm transações (qualquer usuário pode participar do ranking)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(userIdsWithTransactions),
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

    // 5. Preparar transações dos usuários separadas por período
    // Obter intervalo do mês atual para ranking mensal
    const currentPeriod = getCurrentPeriod();
    const { start: monthStart, end: monthEnd } = getPeriodRange('mensal', currentPeriod.year, currentPeriod.month);
    
    const userTransactionsMapMonthly = new Map<string, any[]>();
    const userTransactionsMapAnnual = new Map<string, any[]>();
    
    for (const user of users) {
      // Transações do mês atual (para ranking mensal)
      const monthlyTransactions = transactions
        .filter(tx => tx.userId === user.id && tx.date >= monthStart && tx.date <= monthEnd)
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
      
      // Transações do ano atual (para ranking anual)
      const annualTransactions = transactions
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
      
      if (monthlyTransactions.length > 0) {
        userTransactionsMapMonthly.set(user.id, monthlyTransactions);
      }
      
      if (annualTransactions.length > 0) {
        userTransactionsMapAnnual.set(user.id, annualTransactions);
      }
    }

    // 6. Calcular portfolios e rankings usando os mesmos preços
    // Paraleliza processamento de usuários com controle de concorrência
    // Limita a 5 usuários simultâneos para não sobrecarregar o banco de dados
    const monthlyRankings: RankingEntryForStorage[] = [];
    const annualRankings: RankingEntryForStorage[] = [];

    const processUserTask = async (user: typeof users[0]) => {
      const monthlyTransactions = userTransactionsMapMonthly.get(user.id);
      const annualTransactions = userTransactionsMapAnnual.get(user.id);
      
      if ((!monthlyTransactions || monthlyTransactions.length === 0) && 
          (!annualTransactions || annualTransactions.length === 0)) {
        return null;
      }

      // Calcular portfolios separados para mensal e anual
      const monthlyPortfolio = monthlyTransactions && monthlyTransactions.length > 0
        ? calculatePortfolio(monthlyTransactions, prices)
        : { positions: [], totalInvested: 0 };
      
      const annualPortfolio = annualTransactions && annualTransactions.length > 0
        ? calculatePortfolio(annualTransactions, prices)
        : { positions: [], totalInvested: 0 };

      // Função auxiliar para criar assets a partir de um portfolio
      const createAssetsFromPortfolio = async (portfolio: typeof monthlyPortfolio): Promise<Asset[]> => {
        return await Promise.all(
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
      };

      // Calcular assets separados para mensal e anual
      const monthlyAssets = monthlyPortfolio.positions.length > 0
        ? await createAssetsFromPortfolio(monthlyPortfolio)
        : [];
      
      const annualAssets = annualPortfolio.positions.length > 0
        ? await createAssetsFromPortfolio(annualPortfolio)
        : [];

      // Calcular valores mensais
      const monthlyTotalInvested = monthlyPortfolio.totalInvested;
      const monthlyPositionsValue = monthlyAssets.reduce((sum, asset) => {
        return sum + (asset.quantity * asset.currentPrice);
      }, 0);
      const monthlyCashFromSales = monthlyTransactions && monthlyTransactions.length > 0
        ? calculateTotalFromSales(monthlyTransactions)
        : 0;
      const monthlyCurrentValue = monthlyPositionsValue + monthlyCashFromSales;
      
      const monthlyFirstTransactionDate = monthlyTransactions && monthlyTransactions.length > 0
        ? new Date(Math.min(...monthlyTransactions.map(tx => tx.date.getTime())))
        : new Date();
      const monthlyLastTransactionDate = monthlyTransactions && monthlyTransactions.length > 0
        ? new Date(Math.max(...monthlyTransactions.map(tx => tx.createdAt.getTime())))
        : new Date();

      // Calcular valores anuais
      const annualTotalInvested = annualPortfolio.totalInvested;
      const annualPositionsValue = annualAssets.reduce((sum, asset) => {
        return sum + (asset.quantity * asset.currentPrice);
      }, 0);
      const annualCashFromSales = annualTransactions && annualTransactions.length > 0
        ? calculateTotalFromSales(annualTransactions)
        : 0;
      const annualCurrentValue = annualPositionsValue + annualCashFromSales;
      
      const annualFirstTransactionDate = annualTransactions && annualTransactions.length > 0
        ? new Date(Math.min(...annualTransactions.map(tx => tx.date.getTime())))
        : new Date();
      const annualLastTransactionDate = annualTransactions && annualTransactions.length > 0
        ? new Date(Math.max(...annualTransactions.map(tx => tx.createdAt.getTime())))
        : new Date();

      // Data de criação da conta (para critério de desempate)
      const accountCreatedAt = user.createdAt;
      
      // Calcular retornos separados para cada período
      const { monthlyReturn, annualReturn: monthlyAnnualReturn } = calculateReturns(
        monthlyCurrentValue,
        monthlyTotalInvested,
        monthlyFirstTransactionDate,
        'mensal'
      );
      
      const { monthlyReturn: annualMonthlyReturn, annualReturn } = calculateReturns(
        annualCurrentValue,
        annualTotalInvested,
        annualFirstTransactionDate,
        'anual'
      );

      // Criar entradas separadas para mensal e anual
      const monthlyEntry: RankingEntryForStorage | null = monthlyTransactions && monthlyTransactions.length > 0 ? {
        userId: user.id,
        rank: 0, // Será atribuído após ordenação
        totalInvested: Number(monthlyTotalInvested.toFixed(2)),
        currentValue: Number(monthlyCurrentValue.toFixed(2)),
        portfolio: monthlyAssets,
        monthlyReturn,
        annualReturn: monthlyAnnualReturn,
        lastTransactionDate: monthlyLastTransactionDate,
        accountCreatedAt,
      } : null;

      const annualEntry: RankingEntryForStorage | null = annualTransactions && annualTransactions.length > 0 ? {
        userId: user.id,
        rank: 0, // Será atribuído após ordenação
        totalInvested: Number(annualTotalInvested.toFixed(2)),
        currentValue: Number(annualCurrentValue.toFixed(2)),
        portfolio: annualAssets,
        monthlyReturn: annualMonthlyReturn,
        annualReturn,
        lastTransactionDate: annualLastTransactionDate,
        accountCreatedAt,
      } : null;

      return {
        monthly: monthlyEntry,
        annual: annualEntry,
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
        if (result.result.monthly) {
          monthlyRankings.push(result.result.monthly);
        }
        if (result.result.annual) {
          annualRankings.push(result.result.annual);
        }
      }
    }

    // 7. Ordenar e atribuir ranks com critério de desempate
    // Critério 1: Rentabilidade (maior ganha)
    // Critério 2: Número de ativos (mais ativos ganha)
    // Critério 3: Data da última transação (mais recente ganha)
    // Critério 4: Data de criação da conta (mais antiga ganha)
    monthlyRankings.sort((a, b) => {
      // Comparar por rentabilidade
      if (Math.abs(b.monthlyReturn - a.monthlyReturn) > 0.01) {
        return b.monthlyReturn - a.monthlyReturn;
      }
      // Desempate: número de ativos
      const aAssetsCount = a.portfolio?.length || 0;
      const bAssetsCount = b.portfolio?.length || 0;
      if (aAssetsCount !== bAssetsCount) {
        return bAssetsCount - aAssetsCount;
      }
      // Desempate: data da última transação (mais recente ganha)
      const aLastDate = a.lastTransactionDate?.getTime() || 0;
      const bLastDate = b.lastTransactionDate?.getTime() || 0;
      if (aLastDate !== bLastDate) {
        return bLastDate - aLastDate;
      }
      // Desempate: data de criação da conta (mais antiga ganha)
      const aAccountDate = a.accountCreatedAt?.getTime() || 0;
      const bAccountDate = b.accountCreatedAt?.getTime() || 0;
      return aAccountDate - bAccountDate;
    });
    monthlyRankings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    annualRankings.sort((a, b) => {
      const aReturn = a.annualReturn || 0;
      const bReturn = b.annualReturn || 0;
      // Comparar por rentabilidade
      if (Math.abs(bReturn - aReturn) > 0.01) {
        return bReturn - aReturn;
      }
      // Desempate: número de ativos
      const aAssetsCount = a.portfolio?.length || 0;
      const bAssetsCount = b.portfolio?.length || 0;
      if (aAssetsCount !== bAssetsCount) {
        return bAssetsCount - aAssetsCount;
      }
      // Desempate: data da última transação (mais recente ganha)
      const aLastDate = a.lastTransactionDate?.getTime() || 0;
      const bLastDate = b.lastTransactionDate?.getTime() || 0;
      if (aLastDate !== bLastDate) {
        return bLastDate - aLastDate;
      }
      // Desempate: data de criação da conta (mais antiga ganha)
      const aAccountDate = a.accountCreatedAt?.getTime() || 0;
      const bAccountDate = b.accountCreatedAt?.getTime() || 0;
      return aAccountDate - bAccountDate;
    });
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

    // Detectar mudanças de ranking e enviar notificações
    await this.detectRankingChanges(monthlyResult, 'mensal', currentPeriod.year, currentPeriod.month);
    await this.detectRankingChanges(annualResult, 'anual', currentPeriod.year, undefined);

    return {
      monthly: monthlyResult,
      annual: annualResult,
    };
  }

  /**
   * Detecta mudanças significativas no ranking e envia notificações
   */
  private async detectRankingChanges(
    ranking: RankingResult,
    period: 'mensal' | 'anual',
    year: number,
    month: number | undefined
  ): Promise<void> {
    try {
      const { pushNotificationService } = await import('./push-notification-service');

      // Buscar histórico anterior de posições
      const historyRecords = await prisma.userRankingHistory.findMany({
        where: {
          period,
          year,
          month: period === 'mensal' ? (month ?? null) : null,
        },
      });

      const previousPositions = new Map<string, number>();
      historyRecords.forEach(record => {
        previousPositions.set(record.userId, record.position);
      });

      // Comparar posições atuais com anteriores
      for (const entry of ranking.ranking) {
        const userId = entry.userId;
        const currentPosition = entry.rank;
        const previousPosition = previousPositions.get(userId);

        // Se não tinha posição anterior, é novo no ranking - não notificar
        if (previousPosition === undefined) {
          // Salvar posição atual no histórico
          const monthValue = period === 'mensal' ? (month ?? null) : null;
          await prisma.userRankingHistory.upsert({
            where: {
              userId_period_year_month: {
                userId,
                period,
                year,
                month: monthValue,
              } as any,
            },
            create: {
              userId,
              period,
              year,
              month: monthValue,
              position: currentPosition,
            },
            update: {
              position: currentPosition,
              updatedAt: new Date(),
            },
          });
          continue;
        }

        // Verificar se mudou significativamente
        const positionChange = previousPosition - currentPosition; // positivo = subiu, negativo = desceu
        const absChange = Math.abs(positionChange);

        let shouldNotify = false;
        let changeType: 'top3' | 'up' | 'down' = 'up';

        // Entrou no top 3
        if (currentPosition <= 3 && previousPosition > 3) {
          shouldNotify = true;
          changeType = 'top3';
        }
        // Subiu mais de 5 posições
        else if (positionChange > 5) {
          shouldNotify = true;
          changeType = 'up';
        }
        // Desceu mais de 5 posições
        else if (positionChange < -5) {
          shouldNotify = true;
          changeType = 'down';
        }

        if (shouldNotify) {
          // Enviar notificação (não bloquear se falhar)
          pushNotificationService.sendRankingNotification(userId, {
            previousPosition,
            currentPosition,
            changeType,
            period,
          }).catch(error => {
            console.error(`Erro ao enviar notificação de ranking para usuário ${userId}:`, error);
          });
        }

        // Atualizar histórico
        const monthValue = period === 'mensal' ? (month ?? null) : null;
        await prisma.userRankingHistory.upsert({
          where: {
            userId_period_year_month: {
              userId,
              period,
              year,
              month: monthValue,
            } as any,
          },
          create: {
            userId,
            period,
            year,
            month: monthValue,
            position: currentPosition,
          },
          update: {
            position: currentPosition,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      // Não quebrar o fluxo se houver erro nas notificações
      console.error('Erro ao detectar mudanças de ranking:', error);
    }
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

    // 3. Extrair IDs únicos de usuários que têm transações
    const userIdsWithTransactions = new Set(
      transactions.map(tx => tx.userId)
    );

    // 4. Buscar todos os usuários que têm transações (qualquer usuário pode participar do ranking)
    // Isso garante que novos usuários com transações sejam incluídos
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(userIdsWithTransactions),
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
      
      // Calcular data da última transação (para critério de desempate)
      const lastTransactionDate = userTransactions.length > 0
        ? new Date(Math.max(...userTransactions.map(tx => tx.createdAt.getTime())))
        : new Date();
      
      // Data de criação da conta (para critério de desempate)
      const accountCreatedAt = user.createdAt;
      
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
        lastTransactionDate,
        accountCreatedAt,
      });
    }

    // 5. Ordena por rentabilidade com critério de desempate
    // Critério 1: Rentabilidade (maior ganha)
    // Critério 2: Número de ativos (mais ativos ganha)
    // Critério 3: Data da última transação (mais recente ganha)
    // Critério 4: Data de criação da conta (mais antiga ganha)
    const returnField = period === 'anual' ? 'annualReturn' : 'monthlyReturn';
    userRankings.sort((a, b) => {
      const aReturn = a[returnField] || 0;
      const bReturn = b[returnField] || 0;
      // Comparar por rentabilidade
      if (Math.abs(bReturn - aReturn) > 0.01) {
        return bReturn - aReturn;
      }
      // Desempate: número de ativos
      const aAssetsCount = a.portfolio?.length || 0;
      const bAssetsCount = b.portfolio?.length || 0;
      if (aAssetsCount !== bAssetsCount) {
        return bAssetsCount - aAssetsCount;
      }
      // Desempate: data da última transação (mais recente ganha)
      const aLastDate = a.lastTransactionDate?.getTime() || 0;
      const bLastDate = b.lastTransactionDate?.getTime() || 0;
      if (aLastDate !== bLastDate) {
        return bLastDate - aLastDate;
      }
      // Desempate: data de criação da conta (mais antiga ganha)
      const aAccountDate = a.accountCreatedAt?.getTime() || 0;
      const bAccountDate = b.accountCreatedAt?.getTime() || 0;
      return aAccountDate - bAccountDate;
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
          month: period === 'mensal' ? (month ?? null) : null,
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
      currency: (tx as any).currency || undefined,
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
