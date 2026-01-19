import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed/banners
 * Retorna banners ativos ordenados por prioridade
 * Calcula prioridade dinamicamente baseado em conversões e cliques
 * Considera apenas dados dos últimos 30 dias
 * Prioriza apenas banners com pelo menos 40 impressões nos últimos 30 dias
 */
export async function GET(request: NextRequest) {
  try {
    // Data de corte: últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar todos os banners ativos
    const banners = await prisma.feedBanner.findMany({
      where: {
        isActive: true,
      },
    });

    // Calcular estatísticas dos últimos 30 dias para cada banner
    const bannersWithStats = await Promise.all(
      banners.map(async (banner) => {
        // Contar impressões dos últimos 30 dias
        const impressions = await prisma.feedBannerImpression.count({
          where: {
            bannerId: banner.id,
            viewedAt: {
              gte: thirtyDaysAgo,
            },
          },
        });

        // Contar cliques dos últimos 30 dias
        const clicks = await prisma.feedBannerClick.count({
          where: {
            bannerId: banner.id,
            clickedAt: {
              gte: thirtyDaysAgo,
            },
          },
        });

        // Contar conversões dos últimos 30 dias
        const conversions = await prisma.feedBannerConversion.count({
          where: {
            bannerId: banner.id,
            convertedAt: {
              gte: thirtyDaysAgo,
            },
          },
        });

        // Priorização:
        // 1. Apenas banners com pelo menos 40 impressões nos últimos 30 dias são priorizados
        // 2. Se houver conversões: priority = conversoes * 1000 + cliques
        // 3. Se não houver conversões: priority = cliques
        // 4. Sem 40+ impressões: priority = 0
        let priority = 0;
        if (impressions >= 40) {
          if (conversions > 0) {
            priority = conversions * 1000 + clicks;
          } else {
            priority = clicks;
          }
        }

        return {
          id: banner.id,
          variation: banner.variation,
          title: banner.title,
          description: banner.description,
          benefit: banner.benefit,
          ctaText: banner.ctaText,
          priority,
          impressions,
          clicks,
          conversions,
        };
      })
    );

    // Ordenar por prioridade (maior primeiro)
    bannersWithStats.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({
      banners: bannersWithStats,
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar banners' },
      { status: 500 }
    );
  }
}

