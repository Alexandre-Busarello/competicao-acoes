import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { pushNotificationService } from '@/lib/services/push-notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/push/test
 * Envia notificação de teste para o usuário autenticado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    console.log(`[API] Teste de notificação solicitado para usuário: ${userId}`);

    const success = await pushNotificationService.sendTestNotification(userId);

    if (!success) {
      console.log(`[API] ❌ Falha ao enviar notificação de teste para usuário ${userId}`);
      return NextResponse.json(
        { error: 'Não foi possível enviar notificação. Verifique se você tem subscription registrada e se o service worker está ativo.' },
        { status: 400 }
      );
    }

    console.log(`[API] ✅ Notificação de teste enviada com sucesso para usuário ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] ❌ Erro ao enviar notificação de teste:', error);

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

