import { NextRequest, NextResponse } from 'next/server';
import { priceService } from '@/lib/services/price-service';
import { rankingService } from '@/lib/services/ranking-service';

const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || '';

// Rate limiting para cron (máximo 1 request por minuto)
const lastRequestTime = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 60000; // 1 minuto

function validateToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === CRON_SECRET_TOKEN && CRON_SECRET_TOKEN !== '';
}

function checkRateLimit(): boolean {
  const now = Date.now();
  const lastTime = lastRequestTime.get('cron') || 0;
  
  if (now - lastTime < MIN_REQUEST_INTERVAL) {
    return false;
  }
  
  lastRequestTime.set('cron', now);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Valida token
    if (!validateToken(request)) {
      return NextResponse.json(
        { error: 'Não autorizado. Token inválido ou ausente.' },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit()) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde 1 minuto entre atualizações.' },
        { status: 429 }
      );
    }

    const startTime = Date.now();

    // 1. Coleta tickers de todas as transações
    // (No MVP usa localStorage, no futuro será query ao banco)
    if (typeof window === 'undefined') {
      // Server-side: precisamos acessar dados de outra forma
      // Por enquanto, vamos usar os tickers já no cache
    }

    // 2. Atualiza preços
    const priceUpdateResult = await priceService.updatePrices();
    const pricesLastUpdate = new Date();

    if (!priceUpdateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Falha ao atualizar preços',
          errors: priceUpdateResult.errors,
        },
        { status: 500 }
      );
    }

    // 3. Calcula ranking completo (mensal e anual) usando os mesmos preços
    const { monthly: monthlyRanking, annual: annualRanking } = 
      await rankingService.calculateBothRankings();

    const rankingLastUpdate = new Date();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      tickersUpdated: priceUpdateResult.tickersUpdated,
      pricesLastUpdate: pricesLastUpdate.toISOString(),
      rankingCalculated: true,
      rankingLastUpdate: rankingLastUpdate.toISOString(),
      usersRanked: monthlyRanking.ranking.length,
      monthlyRankingCount: monthlyRanking.ranking.length,
      annualRankingCount: annualRanking.ranking.length,
      durationMs: duration,
      errors: priceUpdateResult.errors.length > 0 ? priceUpdateResult.errors : undefined,
    });
  } catch (error) {
    console.error('Erro ao atualizar preços e calcular ranking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

