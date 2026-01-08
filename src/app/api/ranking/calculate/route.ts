import { NextRequest, NextResponse } from 'next/server';
import { rankingService } from '@/lib/services/ranking-service';

/**
 * POST /api/ranking/calculate
 * Endpoint exclusivo para cálculo manual do ranking
 * O cálculo automático deve ser feito pelo cron em /api/prices/update
 * 
 * NOTA: Este endpoint deve ser usado apenas para testes ou cálculos manuais.
 * O frontend deve usar GET /api/ranking para obter dados já calculados.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const period = (body.period || 'mensal') as 'mensal' | 'anual';

    if (period !== 'mensal' && period !== 'anual') {
      return NextResponse.json(
        { error: 'Período inválido. Use "mensal" ou "anual".' },
        { status: 400 }
      );
    }

    const calculatedRanking = await rankingService.calculateRanking(period);
    
    // Buscar via getRanking para enriquecer com avatares atualizados
    const ranking = await rankingService.getRanking(period) || calculatedRanking;

    return NextResponse.json(ranking);
  } catch (error) {
    console.error('Erro ao calcular ranking:', error);
    return NextResponse.json(
      {
        error: 'Erro ao calcular ranking',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

