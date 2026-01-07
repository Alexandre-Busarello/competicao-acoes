import { NextRequest, NextResponse } from 'next/server';
import { rankingService } from '@/lib/services/ranking-service';

/**
 * GET /api/ranking
 * Retorna o ranking já calculado (sem recalcular)
 * O cálculo deve ser feito apenas pelo cron em /api/prices/update
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'mensal') as 'mensal' | 'anual';

    if (period !== 'mensal' && period !== 'anual') {
      return NextResponse.json(
        { error: 'Período inválido. Use "mensal" ou "anual".' },
        { status: 400 }
      );
    }

    // Buscar ranking do cache (já calculado)
    let ranking = rankingService.getRanking(period);

    if (!ranking) {
      // Se não há ranking no cache, calcular pela primeira vez (inicialização)
      // Isso garante que sempre haverá dados para exibir, mesmo na primeira execução
      console.log(`Ranking ${period} não encontrado no cache. Calculando pela primeira vez...`);
      ranking = await rankingService.calculateRanking(period);
    }

    // Garantir que lastUpdate seja serializado corretamente como ISO string
    // Isso preserva a data real do cálculo, não a data atual
    return NextResponse.json({
      ...ranking,
      lastUpdate: ranking.lastUpdate instanceof Date 
        ? ranking.lastUpdate.toISOString() 
        : ranking.lastUpdate,
    });
  } catch (error) {
    console.error('Erro ao obter ranking:', error);
    return NextResponse.json(
      {
        error: 'Erro ao obter ranking',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

