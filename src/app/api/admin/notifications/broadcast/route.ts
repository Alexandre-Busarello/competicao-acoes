import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';
import { pushNotificationService } from '@/lib/services/push-notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/notifications/broadcast
 * Envia notificação push manual para todos os usuários com notificações ativas
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { title, body: messageBody, url } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Título e corpo da mensagem são obrigatórios' },
        { status: 400 }
      );
    }

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

    // Buscar todos os usuários com notificações ativas (excluindo emails de teste)
    const users = await prisma.user.findMany({
      where: {
        ...excludeTestEmailsFilter,
        pushSubscriptions: {
          some: {},
        },
        pushNotificationPreferences: {
          allEnabled: true,
        },
      },
      select: {
        id: true,
      },
    });

    console.log(`[Broadcast] Enviando para ${users.length} usuários`);

    // Enviar notificações assincronamente
    const results = await Promise.allSettled(
      users.map(async (user) => {
        try {
          // Enviar notificação usando título e corpo fornecidos (ignorar rate limit para broadcast manual)
          const success = await pushNotificationService.sendPushNotification(
            user.id,
            {
              title,
              body: messageBody,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              data: {
                type: 'manual',
                url: url || '/',
              },
            }
          );

          if (success) {
            // Registrar log
            await prisma.pushNotificationLog.create({
              data: {
                userId: user.id,
                type: 'manual',
              },
            });
          }

          return { userId: user.id, success };
        } catch (error) {
          console.error(`[Broadcast] Erro ao enviar para usuário ${user.id}:`, error);
          return { userId: user.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - sent;

    console.log(`[Broadcast] Concluído: ${sent} enviadas, ${failed} falhas de ${users.length} usuários`);

    return NextResponse.json({
      success: true,
      total: users.length,
      sent,
      failed,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }
      ),
    });
  } catch (error) {
    console.error('[API] Erro ao fazer broadcast de notificações:', error);

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
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

