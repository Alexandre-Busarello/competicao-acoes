import { NextRequest, NextResponse } from 'next/server';
import { rankingService } from '@/lib/services/ranking-service';
import { getServerSession } from '@/lib/auth/server';
import { obfuscatePortfolioAssets } from '@/lib/utils/portfolio-obfuscation';

/**
 * GET /api/ranking
 * Retorna o ranking já calculado (sem recalcular)
 * O cálculo deve ser feito apenas pelo cron em /api/prices/update
 * Aplica ofuscação de ativos para usuários não premium
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

    // Buscar sessão do usuário (pode ser null se não autenticado)
    const session = await getServerSession();
    const viewerUserId = session?.user.id;
    const isPremium = session?.user.isPremium ?? false;

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

    // Aplicar ofuscação de ativos para cada entrada do ranking
    const rankingWithObfuscation = {
      ...ranking,
      ranking: ranking.ranking.map(entry => {
        // Verificar se o usuário visualizador é o dono do portfólio
        const isOwner = viewerUserId === entry.userId;
        
        // Aplicar ofuscação se houver portfólio
        if (entry.portfolio && entry.portfolio.length > 0) {
          const obfuscatedPortfolio = obfuscatePortfolioAssets(
            entry.portfolio,
            isPremium,
            isOwner,
            viewerUserId,
            entry.userId
          );
          
          return {
            ...entry,
            portfolio: obfuscatedPortfolio,
          };
        }
        
        return entry;
      }),
    };

    // Garantir que lastUpdate seja serializado corretamente como ISO string
    // Isso preserva a data real do cálculo, não a data atual
    return NextResponse.json({
      ...rankingWithObfuscation,
      lastUpdate: rankingWithObfuscation.lastUpdate instanceof Date 
        ? rankingWithObfuscation.lastUpdate.toISOString() 
        : rankingWithObfuscation.lastUpdate,
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

