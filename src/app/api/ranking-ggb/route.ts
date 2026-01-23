import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { financialDataService } from '@/lib/services/financial-data-service';
import { calculateGGBRanking, shouldExcludeStock } from '@/lib/services/ggb-ranking-service';
import { getServerSession } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

// Lista de tickers para o ranking GGB v0
const GGB_TICKERS = [
  'ABEV3', 'ALLD3', 'B3SA3', 'BBAS3', 'BBDC4', 'BLAU3', 'BMGB4', 'BPAC11', 'BRBI11', 'BRFS3',
  'CAMB3', 'CAML3', 'CEAB3', 'CEBR6', 'CGRA4', 'CLSC4', 'CPLE5', 'CSUD3', 'EMBR3', 'EVEN3',
  'FESA4', 'FIQE3', 'GRND3', 'ITSA4', 'ITUB4', 'KEPL3', 'LEVE3', 'MTRE3', 'PETR4', 'PINE4',
  'QUAL3', 'RANI3', 'RAPT4', 'RECV3', 'ROMI3', 'SBSP3', 'SHUL4', 'SYNE3', 'VALE3', 'VULC3',
];

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
 * Marca dados como ofuscados para usuários não-PRO (mas mantém estrutura visível)
 * Os dados reais são mantidos para mostrar com blur no frontend
 */
function obfuscateRankingData(ranking: any[]): any[] {
  return ranking.map((item) => ({
    ...item,
    // Manter todos os dados, mas marcar como ofuscado
    // O frontend aplicará blur visualmente
    _obfuscated: true,
  }));
}

/**
 * GET /api/ranking-ggb
 * Retorna o ranking GGB, atualizando se necessário (cache de 24h)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se usuário é PRO
    const session = await getServerSession();
    const isPro = session?.user?.isPremium ?? false;

    // Verificar se há dados no banco
    const existingData = await prisma.gGBRanking.findMany({
      orderBy: {
        finalScore: 'desc',
      },
    });

    // Verificar se precisa atualizar
    const oldestUpdate = existingData.length > 0
      ? existingData.reduce((oldest, current) => 
          current.lastUpdated < oldest.lastUpdated ? current : oldest
        )
      : null;

    const shouldUpdate = needsUpdate(oldestUpdate?.lastUpdated || null);

    if (!shouldUpdate && existingData.length > 0) {
      // Retornar dados do cache
      const ranking = existingData
        .filter(item => item.finalScore !== null)
        .map((item, index) => {
          const financialData = item.financialData as Record<string, any>;
          return {
            ticker: item.ticker,
            companyName: item.companyName,
            sector: item.sector,
            industry: item.industry,
            greenblattScore: item.greenblattScore?.toNumber() ?? 0,
            grahamScore: item.grahamScore?.toNumber() ?? 0,
            bazinScore: item.bazinScore?.toNumber() ?? 0,
            finalScore: item.finalScore?.toNumber() ?? 0,
            rank: item.rank ?? index + 1,
            financialData: financialData,
            // Extrair breakdown do financialData se existir
            breakdown: financialData?.breakdown,
            lastUpdated: item.lastUpdated.toISOString(),
          };
        });

      // Ofuscar dados se não for PRO
      const finalRanking = isPro ? ranking : obfuscateRankingData(ranking);

      return NextResponse.json({
        success: true,
        data: finalRanking,
        lastUpdate: oldestUpdate?.lastUpdated.toISOString() || new Date().toISOString(),
        totalStocks: finalRanking.length,
        fromCache: true,
        isPro,
      });
    }

    // Buscar dados da API
    console.log('Buscando dados financeiros da API...');
    const apiData = await financialDataService.fetchAllTickers(GGB_TICKERS);

    if (apiData.length === 0) {
      // Se API falhou mas temos cache, retornar cache mesmo se antigo
      if (existingData.length > 0) {
        const ranking = existingData
          .filter(item => item.finalScore !== null)
          .map((item, index) => {
            const financialData = item.financialData as Record<string, any>;
            return {
              ticker: item.ticker,
              companyName: item.companyName,
              sector: item.sector,
              industry: item.industry,
              greenblattScore: item.greenblattScore?.toNumber() ?? 0,
              grahamScore: item.grahamScore?.toNumber() ?? 0,
              bazinScore: item.bazinScore?.toNumber() ?? 0,
              finalScore: item.finalScore?.toNumber() ?? 0,
              rank: item.rank ?? index + 1,
              financialData: financialData,
              breakdown: financialData?.breakdown,
              lastUpdated: item.lastUpdated.toISOString(),
            };
          });

        // Ofuscar dados se não for PRO
        const finalRanking = isPro ? ranking : obfuscateRankingData(ranking);

        return NextResponse.json({
          success: true,
          data: finalRanking,
          lastUpdate: oldestUpdate?.lastUpdated.toISOString() || new Date().toISOString(),
          totalStocks: finalRanking.length,
          fromCache: true,
          warning: 'API indisponível, retornando dados do cache',
          isPro,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível buscar dados financeiros e não há cache disponível',
        },
        { status: 503 }
      );
    }

    // Preparar dados para cálculo
    const stocksForCalculation = apiData.map(item => ({
      ticker: item.ticker,
      financialData: {
        ...item.financialData,
        // Incluir sector e industry no financialData para detecção de setor
        sector: item.company.sector,
        industry: item.company.industry,
        // Incluir historicalAverages no financialData para facilitar acesso
        historicalAverages: (item as any).historicalAverages || null,
      },
      historicalAverages: (item as any).historicalAverages || null,
    }));

    // Calcular ranking
    console.log('Calculando scores GGB...');
    const rankingResults = calculateGGBRanking(stocksForCalculation);

    // Preparar dados para inserção em batch
    const dataToInsert = rankingResults.map(result => {
      const apiItem = apiData.find(item => item.ticker === result.ticker);
      
      return {
        ticker: result.ticker,
        companyName: apiItem?.company.name || null,
        sector: apiItem?.company.sector || null,
        industry: apiItem?.company.industry || null,
        financialData: {
          ...result.financialData,
          // Incluir breakdown no financialData para que esteja disponível quando vier do cache
          breakdown: result.scores.breakdown,
        } as any,
        greenblattScore: result.scores.greenblattScore,
        grahamScore: result.scores.grahamScore,
        bazinScore: result.scores.bazinScore,
        finalScore: result.scores.finalScore,
        rank: result.rank,
        dataSource: 'api',
      };
    });

    // Salvar no banco (usar transação para garantir consistência)
    // Usar createMany em vez de múltiplos create() para evitar timeout de transação
    await prisma.$transaction(async (tx) => {
      // Limpar dados antigos
      await tx.gGBRanking.deleteMany({});

      // Inserir todos os dados de uma vez usando createMany
      if (dataToInsert.length > 0) {
        await tx.gGBRanking.createMany({
          data: dataToInsert,
          skipDuplicates: true,
        });
      }
    }, {
      timeout: 10000, // 10 segundos de timeout
    });

    // Preparar resposta
    const ranking = rankingResults.map(result => {
      const apiItem = apiData.find(item => item.ticker === result.ticker);
      
      return {
        ticker: result.ticker,
        companyName: apiItem?.company.name || null,
        sector: apiItem?.company.sector || null,
        industry: apiItem?.company.industry || null,
        greenblattScore: result.scores.greenblattScore,
        grahamScore: result.scores.grahamScore,
        bazinScore: result.scores.bazinScore,
        finalScore: result.scores.finalScore,
        rank: result.rank,
        financialData: result.financialData,
        breakdown: result.scores.breakdown,
        lastUpdated: new Date().toISOString(),
      };
    });

    // Ofuscar dados se não for PRO
    const finalRanking = isPro ? ranking : obfuscateRankingData(ranking);

    return NextResponse.json({
      success: true,
      data: finalRanking,
      lastUpdate: new Date().toISOString(),
      totalStocks: finalRanking.length,
      fromCache: false,
      isPro,
    });
  } catch (error) {
    console.error('Erro ao buscar/calcular ranking GGB:', error);
    
    // Tentar retornar cache mesmo em caso de erro
    try {
      const existingData = await prisma.gGBRanking.findMany({
        orderBy: {
          finalScore: 'desc',
        },
      });

      if (existingData.length > 0) {
        // Verificar se usuário é PRO (novamente em caso de erro)
        const session = await getServerSession();
        const isPro = session?.user?.isPremium ?? false;

        const ranking = existingData
          .filter(item => item.finalScore !== null)
          .map((item, index) => {
            const financialData = item.financialData as Record<string, any>;
            return {
              ticker: item.ticker,
              companyName: item.companyName,
              sector: item.sector,
              industry: item.industry,
              greenblattScore: item.greenblattScore?.toNumber() ?? 0,
              grahamScore: item.grahamScore?.toNumber() ?? 0,
              bazinScore: item.bazinScore?.toNumber() ?? 0,
              finalScore: item.finalScore?.toNumber() ?? 0,
              rank: item.rank ?? index + 1,
              financialData: financialData,
              breakdown: financialData?.breakdown,
              lastUpdated: item.lastUpdated.toISOString(),
            };
          });

        // Ofuscar dados se não for PRO
        const finalRanking = isPro ? ranking : obfuscateRankingData(ranking);

        return NextResponse.json({
          success: true,
          data: finalRanking,
          lastUpdate: existingData[0]?.lastUpdated.toISOString() || new Date().toISOString(),
          totalStocks: finalRanking.length,
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
        error: 'Erro ao processar ranking GGB',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

