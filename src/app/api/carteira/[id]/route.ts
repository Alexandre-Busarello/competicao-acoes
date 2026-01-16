import { NextRequest, NextResponse } from 'next/server';
import { rankingService } from '@/lib/services/ranking-service';
import { getServerSession } from '@/lib/auth/server';
import { obfuscatePortfolioAssets } from '@/lib/utils/portfolio-obfuscation';

/**
 * GET /api/carteira/[id]
 * Retorna dados de uma carteira específica para um período
 * Verifica de forma segura se o usuário autenticado é o dono da carteira
 */
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
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
    
    // Verificação segura de isOwner no backend
    const isOwner = viewerUserId === userId;

    // Buscar ranking do período específico do banco de dados
    let ranking = await rankingService.getRanking(period, year, month);

    if (!ranking) {
      // Se não há ranking no banco, calcular pela primeira vez (inicialização)
      console.log(`Ranking ${period} ${year || 'vigente'}${month ? `/${month}` : ''} não encontrado no banco. Calculando pela primeira vez...`);
      const calculatedRanking = await rankingService.calculateRanking(period, year, month);
      // Buscar novamente via getRanking para enriquecer com avatares
      ranking = await rankingService.getRanking(period, year, month) || calculatedRanking;
    }

    // Buscar entrada específica do usuário no ranking
    const entry = ranking.ranking.find((e: any) => e.userId === userId);

    if (!entry) {
      return NextResponse.json(
        { error: 'Carteira não encontrada no ranking para este período' },
        { status: 404 }
      );
    }

    // Aplicar ofuscação de ativos se houver portfólio
    let portfolio = entry.portfolio || [];
    if (portfolio.length > 0) {
      portfolio = obfuscatePortfolioAssets(
        portfolio,
        isPremium,
        isOwner,
        viewerUserId,
        userId
      );
    }

    // Retornar dados da carteira com informações de acesso
    return NextResponse.json({
      id: entry.userId,
      name: entry.name,
      avatar: entry.avatar,
      rank: entry.rank,
      monthlyReturn: entry.monthlyReturn,
      annualReturn: entry.annualReturn,
      portfolio,
      // Informações de acesso verificadas no backend
      isOwner,
      isPremium,
      canAccess: isOwner || isPremium,
    });
  } catch (error) {
    console.error('Erro ao obter carteira:', error);
    return NextResponse.json(
      {
        error: 'Erro ao obter carteira',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

