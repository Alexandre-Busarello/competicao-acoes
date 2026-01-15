import { NextRequest, NextResponse } from 'next/server';
import { engagementNotificationService } from '@/lib/services/engagement-notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/engagement-notifications
 * Endpoint para rodar via cron job e enviar notificações de engajamento
 * 
 * Proteger com header de autenticação ou secret token em produção
 */
export async function POST(request: NextRequest) {
  try {
    // Em produção, adicionar verificação de secret token
    // const secret = request.headers.get('x-cron-secret');
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await engagementNotificationService.sendEngagementNotifications();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in engagement notifications cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

