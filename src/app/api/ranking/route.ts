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
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (period !== 'mensal' && period !== 'anual') {
      return NextResponse.json(
        { error: 'Período inválido. Use "mensal" ou "anual".' },
        { status: 400 }
      );
    }

    // Parse year e month se fornecidos
    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const month = monthParam ? parseInt(monthParam, 10) : undefined;

    // Validar se year e month são válidos quando fornecidos
    if (year && (isNaN(year) || year < 2026 || year > new Date().getFullYear() + 1)) {
      return NextResponse.json(
        { error: 'Ano inválido. O sistema está disponível apenas a partir de 2026.' },
        { status: 400 }
      );
    }

    if (month && (isNaN(month) || month < 1 || month > 12)) {
      return NextResponse.json(
        { error: 'Mês inválido. Use um valor entre 1 e 12.' },
        { status: 400 }
      );
    }

    // Buscar ranking do período específico do banco de dados
    let ranking = await rankingService.getRanking(period, year, month);

    if (!ranking) {
      // Se não há ranking no banco, calcular pela primeira vez (inicialização)
      // Isso garante que sempre haverá dados para exibir, mesmo na primeira execução
      console.log(`Ranking ${period} ${year || 'vigente'}${month ? `/${month}` : ''} não encontrado no banco. Calculando pela primeira vez...`);
      const calculatedRanking = await rankingService.calculateRanking(period, year, month);
      // Buscar novamente via getRanking para enriquecer com avatares
      ranking = await rankingService.getRanking(period, year, month) || calculatedRanking;
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

