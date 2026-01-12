import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * Retorna estatísticas administrativas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    await requireAdmin();

    // Emails de teste para filtrar
    const testEmailPatterns = [
      'teste',
      'example',
      'ixospace',
      'atinjo',
      'akixpres',
      'gopicta',
      'feanzier',
    ];

    // Construir filtro para emails de teste (para User)
    const excludeTestEmailsFilter = {
      AND: [
        {
          email: {
            not: null,
          },
        },
        {
          NOT: {
            OR: testEmailPatterns.map(pattern => ({
              email: {
                contains: pattern,
                mode: 'insensitive' as const,
              },
            })),
          },
        },
      ],
    };

    // Construir filtro para emails de teste (para Lead)
    const excludeTestEmailsLeadFilter = {
      NOT: {
        OR: testEmailPatterns.map(pattern => ({
          email: {
            contains: pattern,
            mode: 'insensitive' as const,
          },
        })),
      },
    };

    // Buscar métricas em paralelo
    const [
      totalLeads,
      convertedLeads,
      leadsWithCheckoutStarted,
      totalUsers,
      usersWithPro,
      recentUsers,
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
    ] = await Promise.all([
      // Total de leads (excluindo emails de teste)
      prisma.lead.count({
        where: excludeTestEmailsLeadFilter,
      }),

      // Leads convertidos (excluindo emails de teste)
      prisma.lead.count({
        where: {
          converted: true,
          ...excludeTestEmailsLeadFilter,
        },
      }),

      // Leads que iniciaram checkout (excluindo emails de teste)
      prisma.lead.count({
        where: {
          checkoutStarted: true,
          ...excludeTestEmailsLeadFilter,
        },
      }),

      // Total de usuários (excluindo emails de teste)
      prisma.user.count({
        where: excludeTestEmailsFilter,
      }),

      // Usuários com PRO ativo
      prisma.user.count({
        where: {
          ...excludeTestEmailsFilter,
          subscription: {
            status: 'active',
            currentPeriodEnd: {
              gt: new Date(),
            },
          },
        },
      }),

      // Últimos usuários acessados (excluindo emails de teste)
      prisma.user.findMany({
        where: excludeTestEmailsFilter,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          isPremium: true,
          subscription: {
            select: {
              status: true,
              currentPeriodEnd: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 50,
      }),

      // Total de assinaturas
      prisma.subscription.count(),

      // Assinaturas ativas
      prisma.subscription.count({
        where: {
          status: 'active',
          currentPeriodEnd: {
            gt: new Date(),
          },
        },
      }),

      // Assinaturas expiradas
      prisma.subscription.count({
        where: {
          OR: [
            { status: { not: 'active' } },
            {
              status: 'active',
              currentPeriodEnd: {
                lte: new Date(),
              },
            },
          ],
        },
      }),
    ]);

    // Calcular taxa de conversão
    const conversionRate = totalLeads > 0 
      ? ((convertedLeads / totalLeads) * 100).toFixed(2)
      : '0.00';

    // Calcular taxa de checkout iniciado
    const checkoutRate = totalLeads > 0
      ? ((leadsWithCheckoutStarted / totalLeads) * 100).toFixed(2)
      : '0.00';

    // Calcular taxa de conversão de usuário para PRO
    const userToProRate = totalUsers > 0
      ? ((usersWithPro / totalUsers) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        checkoutStarted: leadsWithCheckoutStarted,
        conversionRate: parseFloat(conversionRate),
        checkoutRate: parseFloat(checkoutRate),
      },
      users: {
        total: totalUsers,
        withPro: usersWithPro,
        userToProRate: parseFloat(userToProRate),
        recent: recentUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          isPremium: user.isPremium,
          subscription: user.subscription ? {
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
            createdAt: user.subscription.createdAt.toISOString(),
          } : null,
        })),
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        expired: expiredSubscriptions,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar este recurso.' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao buscar estatísticas',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

