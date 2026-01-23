import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

interface BannerStats {
  id: string;
  variation: string;
  title: string;
  description: string;
  benefit: string;
  ctaText: string;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // Click-through rate
  cvr: number; // Conversion rate
}

interface ConversionEventStats {
  type: 'blur_overlay' | 'profile_checkout' | 'signup_banner' | 'ggb_ranking';
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

interface BannerStatsResponse {
  banners: BannerStats[];
  totalBanners: number;
  activeBanners: number;
  conversionEvents: ConversionEventStats[];
}

/**
 * GET /api/admin/banners/stats
 * Retorna estatísticas agregadas de todos os banners
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Se não houver filtros de data customizados, usar últimos 30 dias por padrão
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Construir filtros de data
    const dateFilter: any = {};
    if (startDate || endDate) {
      // Usar filtros customizados se fornecidos
      dateFilter.viewedAt = {};
      dateFilter.clickedAt = {};
      dateFilter.convertedAt = {};
      if (startDate) {
        dateFilter.viewedAt.gte = new Date(startDate);
        dateFilter.clickedAt.gte = new Date(startDate);
        dateFilter.convertedAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.viewedAt.lte = new Date(endDate);
        dateFilter.clickedAt.lte = new Date(endDate);
        dateFilter.convertedAt.lte = new Date(endDate);
      }
    } else {
      // Usar últimos 30 dias por padrão
      dateFilter.viewedAt = { gte: thirtyDaysAgo };
      dateFilter.clickedAt = { gte: thirtyDaysAgo };
      dateFilter.convertedAt = { gte: thirtyDaysAgo };
    }

    // Buscar todos os banners
    const banners = await prisma.feedBanner.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Buscar estatísticas para cada banner
    const bannersWithStats: BannerStats[] = await Promise.all(
      banners.map(async (banner) => {
        // Contar impressões
        const impressions = await prisma.feedBannerImpression.count({
          where: {
            bannerId: banner.id,
            viewedAt: dateFilter.viewedAt,
          },
        });

        // Contar cliques
        const clicks = await prisma.feedBannerClick.count({
          where: {
            bannerId: banner.id,
            clickedAt: dateFilter.clickedAt,
          },
        });

        // Contar conversões
        const conversions = await prisma.feedBannerConversion.count({
          where: {
            bannerId: banner.id,
            convertedAt: dateFilter.convertedAt,
          },
        });

        // Calcular taxas
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;

        // Calcular prioridade
        // Apenas banners com pelo menos 40 impressões são priorizados
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
          isActive: banner.isActive,
          priority,
          impressions,
          clicks,
          conversions,
          ctr: Math.round(ctr * 100) / 100, // Arredondar para 2 casas decimais
          cvr: Math.round(cvr * 100) / 100,
        };
      })
    );

    // Ordenar por prioridade (maior primeiro)
    bannersWithStats.sort((a, b) => b.priority - a.priority);

    // Buscar estatísticas de eventos de conversão
    const conversionEventTypes: Array<'blur_overlay' | 'profile_checkout' | 'signup_banner' | 'ggb_ranking'> = [
      'blur_overlay',
      'profile_checkout',
      'signup_banner',
      'ggb_ranking',
    ];

    const conversionEventsStats: ConversionEventStats[] = await Promise.all(
      conversionEventTypes.map(async (type) => {
        // Contar visualizações
        const views = await prisma.conversionEvent.count({
          where: {
            type,
            ...(startDate || endDate ? {
              viewedAt: dateFilter.viewedAt,
            } : {
              viewedAt: { gte: thirtyDaysAgo },
            }),
          },
        });

        // Contar cliques
        const clicks = await prisma.conversionEvent.count({
          where: {
            type,
            clickedAt: {
              not: null,
              ...(startDate || endDate ? dateFilter.clickedAt : { gte: thirtyDaysAgo }),
            },
          },
        });

        // Contar conversões
        const conversions = await prisma.conversionEvent.count({
          where: {
            type,
            convertedAt: {
              not: null,
              ...(startDate || endDate ? dateFilter.convertedAt : { gte: thirtyDaysAgo }),
            },
          },
        });

        // Calcular taxas
        const ctr = views > 0 ? (clicks / views) * 100 : 0;
        const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;

        return {
          type,
          views,
          clicks,
          conversions,
          ctr: Math.round(ctr * 100) / 100,
          cvr: Math.round(cvr * 100) / 100,
        };
      })
    );

    // Debug: verificar se ggb_ranking está sendo retornado
    console.log('Conversion events stats:', conversionEventsStats.map(e => ({ type: e.type, views: e.views })));

    return NextResponse.json({
      banners: bannersWithStats,
      totalBanners: bannersWithStats.length,
      activeBanners: bannersWithStats.filter((b) => b.isActive).length,
      conversionEvents: conversionEventsStats,
    });
  } catch (error) {
    console.error('Error fetching banner stats:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar este endpoint.' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas de banners' },
      { status: 500 }
    );
  }
}

