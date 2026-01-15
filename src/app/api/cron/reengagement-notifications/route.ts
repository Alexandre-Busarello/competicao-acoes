import { NextRequest, NextResponse } from 'next/server';
import { reengagementNotificationService } from '@/lib/services/reengagement-notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/reengagement-notifications
 * Endpoint para rodar via cron job e enviar notificações de re-engajamento
 * para usuários inativos há 7+ dias
 * 
 * Proteger com header de autenticação ou secret token em produção
 * 
 * Exemplo de uso com curl:
 * curl -X POST https://seu-dominio.com/api/cron/reengagement-notifications \
 *   -H "x-cron-secret: SEU_SECRET_TOKEN"
 */
export async function POST(request: NextRequest) {
  try {
    // Em produção, verificar secret token
    const secret = request.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Iniciando envio de notificações de re-engajamento...');

    const result = await reengagementNotificationService.sendToAllInactiveUsers(7);

    console.log(
      `[Cron] Re-engajamento concluído: ${result.sent} enviadas, ${result.failed} falhas de ${result.total} usuários inativos`
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Cron] Erro ao enviar notificações de re-engajamento:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/reengagement-notifications
 * Retorna informações sobre o endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/cron/reengagement-notifications',
    method: 'POST',
    description: 'Envia notificações de re-engajamento para usuários inativos há 7+ dias',
    authentication: {
      header: 'x-cron-secret',
      envVar: 'CRON_SECRET',
    },
    example: {
      curl: `curl -X POST https://seu-dominio.com/api/cron/reengagement-notifications \\
  -H "x-cron-secret: SEU_SECRET_TOKEN"`,
    },
  });
}

