import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/notifications/stats
 * Retorna estatísticas de notificações para o painel admin
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // Emails de teste para filtrar (mesmo padrão da tela /admin)
    const testEmailPatterns = [
      'teste',
      'example',
      'ixospace',
      'atinjo',
      'akixpres',
      'gopicta',
      'feanzier',
    ];

    // Construir filtro para emails de teste
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

    // Calcular estatísticas em paralelo
    const [
      totalUsers,
      pwaInstalled,
      notificationsActive,
      inactive7Days,
    ] = await Promise.all([
      // Total de usuários (excluindo emails de teste)
      prisma.user.count({
        where: excludeTestEmailsFilter,
      }),

      // Usuários com PWA instalado (excluindo emails de teste)
      prisma.user.count({
        where: {
          ...excludeTestEmailsFilter,
          pwaInstalledAt: {
            not: null,
          },
        },
      }),

      // Usuários com notificações ativas (excluindo emails de teste)
      // (tem subscription + preferences.allEnabled = true)
      prisma.user.count({
        where: {
          ...excludeTestEmailsFilter,
          pushSubscriptions: {
            some: {},
          },
          pushNotificationPreferences: {
            allEnabled: true,
          },
        },
      }),

      // Usuários inativos há 7+ dias (excluindo emails de teste)
      prisma.user.count({
        where: {
          ...excludeTestEmailsFilter,
          OR: [
            {
              lastAccessAt: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
            {
              lastAccessAt: null,
              createdAt: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          ],
          pushSubscriptions: {
            some: {},
          },
          pushNotificationPreferences: {
            allEnabled: true,
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      pwaInstalled,
      notificationsActive,
      inactive7Days,
    });
  } catch (error) {
    console.error('[API] Erro ao buscar estatísticas de notificações:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

