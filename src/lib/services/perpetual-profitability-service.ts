import { prisma } from '@/lib/prisma/client';
import { calculatePortfolio, calculateTotalFromSales } from '@/lib/utils/portfolio-calculator';
import { priceService } from './price-service';
import { cacheService } from '@/lib/cache/cache-service';
import { cacheConfig } from '@/lib/config/cache';

/**
 * Serviço para calcular e cachear rentabilidade perpétua do usuário
 * Rentabilidade perpétua considera TODO o histórico de transações do usuário
 * Cache de 1 dia - recalcula apenas se passou mais de 1 dia desde última atualização
 */
export class PerpetualProfitabilityService {
  /**
   * Calcula rentabilidade perpétua do usuário
   * Busca todas as transações (sem filtro de data) e calcula usando calculatePortfolio
   */
  async calculatePerpetualProfitability(userId: string): Promise<{
    profitability: number;
    totalInvested: number;
    currentValue: number;
  }> {
    // Busca todas as transações do usuário (sem filtro de data)
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    // Se não tem transações, retorna zeros
    if (transactions.length === 0) {
      return {
        profitability: 0,
        totalInvested: 0,
        currentValue: 0,
      };
    }

    // Coleta tickers no PriceService (igual ao ranking)
    priceService.collectTickersFromTransactions(
      transactions.map(t => ({ ticker: t.ticker }))
    );
    
    // Busca preços do cache
    let prices = priceService.getCurrentPrices();
    
    // Verifica se algum ticker está faltando no cache
    const uniqueTickers = [...new Set(transactions.map(tx => tx.ticker))];
    const missingTickers = uniqueTickers.filter(ticker => {
      const normalizedTicker = ticker.endsWith('.SA') ? ticker : `${ticker}.SA`;
      return !prices[ticker] && !prices[normalizedTicker] && 
             !prices[ticker.toUpperCase()] && !prices[normalizedTicker.toUpperCase()];
    });
    
    // Se algum ticker está faltando, atualiza todos os preços de uma vez
    if (missingTickers.length > 0) {
      await priceService.updatePrices();
      prices = priceService.getCurrentPrices();
    }

    // Converte transações para formato esperado pelo calculatePortfolio
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      userId: tx.userId,
      ticker: tx.ticker,
      type: tx.type as 'compra' | 'venda',
      quantity: Number(tx.quantity),
      price: Number(tx.price),
      date: tx.date,
      createdAt: tx.createdAt,
    }));

    // Calcula portfolio usando função existente
    const portfolio = calculatePortfolio(formattedTransactions, prices);

    // Recalcular currentValue usando preços do cache (igual ao ranking)
    // Busca preços tentando diferentes variações do ticker
    const positionsValue = portfolio.positions.map((pos) => {
      // Normalizar ticker para buscar preço
      const normalizedTicker = pos.ticker.endsWith('.SA') 
        ? pos.ticker 
        : `${pos.ticker}.SA`;
      
      // Buscar preço no cache (tentar diferentes variações)
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
      
      return pos.quantity * currentPrice;
    });
    
    const totalPositionsValue = positionsValue.reduce((sum, value) => sum + value, 0);
    
    // Calcular dinheiro recebido em vendas
    const cashFromSales = calculateTotalFromSales(formattedTransactions);
    
    // Valor total atual = posições + dinheiro de vendas (igual ao ranking)
    const currentValue = totalPositionsValue + cashFromSales;

    // Se carteira zerada (sem posições e sem vendas), usa apenas vendas - investido
    if (portfolio.positions.length === 0 && portfolio.totalInvested === 0) {
      return {
        profitability: 0,
        totalInvested: 0,
        currentValue: cashFromSales,
      };
    }

    // Calcular rentabilidade usando a mesma fórmula do ranking
    const profitability = portfolio.totalInvested > 0
      ? ((currentValue - portfolio.totalInvested) / portfolio.totalInvested) * 100
      : 0;

    return {
      profitability: Number(profitability.toFixed(2)),
      totalInvested: portfolio.totalInvested,
      currentValue: Number(currentValue.toFixed(2)),
    };
  }

  /**
   * Obtém ou calcula rentabilidade perpétua com cache
   * Verifica cache no banco (UserPerpetualProfitability)
   * Se não existe ou passou 1 dia, recalcula e atualiza cache
   */
  async getOrCalculateProfitability(userId: string): Promise<{
    profitability: number;
    totalInvested: number;
    currentValue: number;
    lastUpdated: Date;
  }> {
    // Verifica cache em memória primeiro
    const cacheKey = `profitability:${userId}`;
    const cached = await cacheService.get<{
      profitability: number;
      totalInvested: number;
      currentValue: number;
      lastUpdated: string;
    }>(cacheKey);

    if (cached) {
      return {
        ...cached,
        lastUpdated: new Date(cached.lastUpdated),
      };
    }

    // Busca no banco
    const dbCache = await prisma.userPerpetualProfitability.findUnique({
      where: { userId },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Se existe cache válido (menos de 1 dia), retorna
    if (dbCache && dbCache.lastUpdated > oneDayAgo) {
      const result = {
        profitability: Number(dbCache.profitability),
        totalInvested: Number(dbCache.totalInvested),
        currentValue: Number(dbCache.currentValue),
        lastUpdated: dbCache.lastUpdated,
      };

      // Atualiza cache em memória
      await cacheService.set(
        cacheKey,
        {
          ...result,
          lastUpdated: result.lastUpdated.toISOString(),
        },
        cacheConfig.redis.ttl.profitability
      );

      return result;
    }

    // Recalcula
    const calculated = await this.calculatePerpetualProfitability(userId);

    // Atualiza ou cria cache no banco
    const updated = await prisma.userPerpetualProfitability.upsert({
      where: { userId },
      create: {
        userId,
        profitability: calculated.profitability,
        totalInvested: calculated.totalInvested,
        currentValue: calculated.currentValue,
        calculatedAt: new Date(),
        lastUpdated: new Date(),
      },
      update: {
        profitability: calculated.profitability,
        totalInvested: calculated.totalInvested,
        currentValue: calculated.currentValue,
        lastUpdated: new Date(),
      },
    });

    const result = {
      profitability: Number(updated.profitability),
      totalInvested: Number(updated.totalInvested),
      currentValue: Number(updated.currentValue),
      lastUpdated: updated.lastUpdated,
    };

    // Atualiza cache em memória
    await cacheService.set(
      cacheKey,
      {
        ...result,
        lastUpdated: result.lastUpdated.toISOString(),
      },
      cacheConfig.redis.ttl.profitability
    );

    return result;
  }

  /**
   * Invalida cache de rentabilidade perpétua
   * Útil quando novas transações são criadas
   */
  async invalidateCache(userId: string): Promise<void> {
    const cacheKey = `profitability:${userId}`;
    await cacheService.delete(cacheKey);
    
    // Remove do banco também para forçar recálculo
    await prisma.userPerpetualProfitability.deleteMany({
      where: { userId },
    });
  }
}

export const perpetualProfitabilityService = new PerpetualProfitabilityService();
