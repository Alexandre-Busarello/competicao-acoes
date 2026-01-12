import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';
import { priceService } from '@/lib/services/price-service';
import { calculatePortfolioByCurrency, normalizeTickerForGrouping } from '@/lib/utils/portfolio-calculator';
import { startOfYear, endOfYear } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Converte Decimal do Prisma ou número para número JavaScript
 */
function toNumber(value: any): number {
  if (value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

/**
 * GET /api/portfolio/currency-totals
 * Retorna totais da carteira agrupados por moeda
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Buscar transações do ano atual
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
      orderBy: {
        date: 'asc',
      },
    });

    // Converter transações para formato esperado
    const userTransactions = transactions.map(tx => ({
      id: tx.id,
      userId: tx.userId,
      ticker: tx.ticker,
      type: tx.type as 'compra' | 'venda',
      quantity: toNumber(tx.quantity),
      price: toNumber(tx.price),
      currency: (tx as any).currency || null, // Campo pode não estar no tipo ainda
      date: tx.date,
      createdAt: tx.createdAt,
    }));

    // Coletar tickers no PriceService para garantir que estão no cache
    priceService.collectTickersFromTransactions(
      userTransactions.map(t => ({ ticker: t.ticker }))
    );

    // Obter preços atualizados
    let prices = priceService.getCurrentPrices();
    
    // Verificar se há tickers sem preço e tentar atualizar
    const uniqueTickers = [...new Set(userTransactions.map(tx => tx.ticker))];
    const missingTickers = uniqueTickers.filter(ticker => {
      const normalizedTicker = normalizeTickerForGrouping(ticker);
      const variations = [
        ticker,
        normalizedTicker,
        ticker.toUpperCase(),
        normalizedTicker.toUpperCase(),
        ticker.toLowerCase(),
        normalizedTicker.toLowerCase(),
      ];
      return !variations.some(v => prices[v] && prices[v] > 0);
    });
    
    // Se há tickers sem preço ou cache está vazio, atualizar preços
    if (missingTickers.length > 0 || Object.keys(prices).length === 0) {
      try {
        await priceService.updatePrices();
        // Buscar preços novamente após atualização
        prices = priceService.getCurrentPrices();
      } catch (error) {
        console.error('[currency-totals] Erro ao atualizar preços:', error);
        // Continuar mesmo com erro - pode ter alguns preços no cache
      }
    }

    // Calcular totais por moeda
    const currencyTotals = calculatePortfolioByCurrency(userTransactions, prices);

    return NextResponse.json({
      currencyTotals,
    });
  } catch (error) {
    console.error('Erro ao buscar totais por moeda:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao buscar totais por moeda' },
      { status: 500 }
    );
  }
}

