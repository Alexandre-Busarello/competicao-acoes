import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { fetchAllFIIs } from '@/lib/services/fii-data-service';
import { calculateFIIRanking } from '@/lib/services/fii-ranking-service';
import { getServerSession } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * Verifica se os dados precisam ser atualizados (cache de 24h)
 */
function needsUpdate(lastUpdated: Date | null): boolean {
  if (!lastUpdated) return true;
  const now = new Date();
  const diffMs = now.getTime() - lastUpdated.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 24;
}

/**
 * Marca dados como ofuscados para usuários não-PRO
 */
function obfuscateRankingData(ranking: any[]): any[] {
  return ranking.map((item) => ({
    ...item,
    _obfuscated: true,
  }));
}

/**
 * GET /api/ranking-fii
 * Retorna o ranking de FIIs, atualizando se necessário (cache de 24h)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const isPro = session?.user?.isPremium ?? false;

    const existingData = await prisma.fIIRanking.findMany({
      orderBy: { finalScore: 'desc' },
    });

    const oldestUpdate =
      existingData.length > 0
        ? existingData.reduce((oldest, current) =>
            current.lastUpdated < oldest.lastUpdated ? current : oldest
          )
        : null;

    const shouldUpdate = needsUpdate(oldestUpdate?.lastUpdated || null);

    if (!shouldUpdate && existingData.length > 0) {
      const ranking = existingData
        .filter((item) => item.finalScore !== null)
        .map((item, index) => {
          const financialData = item.financialData as Record<string, any>;
          return {
            ticker: item.ticker,
            fundName: item.fundName,
            segment: item.segment,
            dyScore: item.dyScore?.toString() ?? '0',
            pvpScore: item.pvpScore?.toString() ?? '0',
            vacancyScore: item.vacancyScore?.toString() ?? '0',
            debtScore: item.debtScore?.toString() ?? '0',
            payoutScore: item.payoutScore?.toString() ?? '0',
            liquidityScore: item.liquidityScore?.toString() ?? '0',
            finalScore: item.finalScore?.toString() ?? '0',
            rank: item.rank ?? index + 1,
            financialData,
            breakdown: financialData?.breakdown,
            lastUpdated: item.lastUpdated.toISOString(),
          };
        });

      const finalRanking = isPro ? ranking : obfuscateRankingData(ranking);

      return NextResponse.json({
        success: true,
        data: finalRanking,
        lastUpdate:
          oldestUpdate?.lastUpdated.toISOString() || new Date().toISOString(),
        totalFIIs: finalRanking.length,
        fromCache: true,
        isPro,
      });
    }

    // Buscar dados do Fundamentus
    console.log('[FII Ranking] Buscando dados do Fundamentus...');
    const apiData = await fetchAllFIIs();
    console.log(`[FII Ranking] Dados recebidos: ${apiData.length} FIIs`);

    if (apiData.length === 0) {
      if (existingData.length > 0) {
        const ranking = existingData
          .filter((item) => item.finalScore !== null)
          .map((item, index) => {
            const financialData = item.financialData as Record<string, any>;
            return {
              ticker: item.ticker,
              fundName: item.fundName,
              segment: item.segment,
              dyScore: item.dyScore?.toString() ?? '0',
              pvpScore: item.pvpScore?.toString() ?? '0',
              vacancyScore: item.vacancyScore?.toString() ?? '0',
              debtScore: item.debtScore?.toString() ?? '0',
              payoutScore: item.payoutScore?.toString() ?? '0',
              liquidityScore: item.liquidityScore?.toString() ?? '0',
              finalScore: item.finalScore?.toString() ?? '0',
              rank: item.rank ?? index + 1,
              financialData,
              breakdown: financialData?.breakdown,
              lastUpdated: item.lastUpdated.toISOString(),
            };
          });
        const finalRanking = isPro ? ranking : obfuscateRankingData(ranking);
        return NextResponse.json({
          success: true,
          data: finalRanking,
          lastUpdate:
            oldestUpdate?.lastUpdated.toISOString() ||
            new Date().toISOString(),
          totalFIIs: finalRanking.length,
          fromCache: true,
          warning: 'API indisponível, retornando dados do cache',
          isPro,
        });
      }
      return NextResponse.json(
        {
          success: false,
          error:
            'Não foi possível buscar dados de FIIs e não há cache disponível',
        },
        { status: 503 }
      );
    }

    const rankingResults = calculateFIIRanking(apiData);

    const dataToInsert = rankingResults.map((result) => ({
      ticker: result.ticker,
      fundName: result.fundName ?? null,
      segment: result.segment,
      financialData: {
        ...result.financialData,
        breakdown: result.scores.breakdown,
      } as any,
      dyScore: result.scores.dyScore,
      pvpScore: result.scores.pvpScore,
      vacancyScore: result.scores.vacancyScore,
      debtScore: result.scores.debtScore,
      payoutScore: result.scores.payoutScore,
      liquidityScore: result.scores.liquidityScore,
      finalScore: result.scores.finalScore,
      rank: result.rank,
      dataSource: 'fundamentus',
    }));

    await prisma.$transaction(async (tx) => {
      await tx.fIIRanking.deleteMany({});
      if (dataToInsert.length > 0) {
        await tx.fIIRanking.createMany({
          data: dataToInsert,
          skipDuplicates: true,
        });
      }
    });

    const ranking = rankingResults.map((result) => ({
      ticker: result.ticker,
      fundName: result.fundName,
      segment: result.segment,
      dyScore: result.scores.dyScore,
      pvpScore: result.scores.pvpScore,
      vacancyScore: result.scores.vacancyScore,
      debtScore: result.scores.debtScore,
      payoutScore: result.scores.payoutScore,
      liquidityScore: result.scores.liquidityScore,
      finalScore: result.scores.finalScore,
      rank: result.rank,
      financialData: {
        ...result.financialData,
        breakdown: result.scores.breakdown,
      },
      lastUpdated: new Date().toISOString(),
    }));

    const finalRanking = isPro ? ranking : obfuscateRankingData(ranking);

    return NextResponse.json({
      success: true,
      data: finalRanking,
      lastUpdate: new Date().toISOString(),
      totalFIIs: finalRanking.length,
      fromCache: false,
      isPro,
    });
  } catch (error) {
    console.error('Erro ao buscar/calcular ranking FII:', error);
    try {
      const existingData = await prisma.fIIRanking.findMany({
        orderBy: { finalScore: 'desc' },
      });
      if (existingData.length > 0) {
        const session = await getServerSession();
        const isPro = session?.user?.isPremium ?? false;
        const ranking = existingData
          .filter((item) => item.finalScore !== null)
          .map((item, index) => {
            const financialData = item.financialData as Record<string, any>;
            return {
              ticker: item.ticker,
              fundName: item.fundName,
              segment: item.segment,
              dyScore: item.dyScore?.toString() ?? '0',
              pvpScore: item.pvpScore?.toString() ?? '0',
              vacancyScore: item.vacancyScore?.toString() ?? '0',
              debtScore: item.debtScore?.toString() ?? '0',
              payoutScore: item.payoutScore?.toString() ?? '0',
              liquidityScore: item.liquidityScore?.toString() ?? '0',
              finalScore: item.finalScore?.toString() ?? '0',
              rank: item.rank ?? index + 1,
              financialData,
              breakdown: financialData?.breakdown,
              lastUpdated: item.lastUpdated.toISOString(),
            };
          });
        const finalRanking = isPro ? ranking : obfuscateRankingData(ranking);
        return NextResponse.json({
          success: true,
          data: finalRanking,
          lastUpdate: existingData[0]?.lastUpdated.toISOString(),
          totalFIIs: finalRanking.length,
          fromCache: true,
          warning: 'Erro ao atualizar, retornando dados do cache',
          isPro,
        });
      }
    } catch (cacheError) {
      console.error('Erro ao buscar cache:', cacheError);
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar ranking FII',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
