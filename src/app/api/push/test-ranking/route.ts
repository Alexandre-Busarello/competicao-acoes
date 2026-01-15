import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { pushNotificationService } from '@/lib/services/push-notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/push/test-ranking
 * Envia notificação de ranking de teste para o usuário autenticado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    console.log(`[API] Teste de notificação de ranking solicitado para usuário: ${userId}`);

    // Verificar se tem subscription primeiro
    const { prisma } = await import('@/lib/prisma/client');
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(`[API] ❌ Usuário ${userId} não tem subscription registrada`);
      return NextResponse.json(
        { error: 'Você precisa registrar sua subscription primeiro. Vá em Configurações de Notificações e clique em "Registrar Subscription".' },
        { status: 400 }
      );
    }

    // Verificar preferências
    const preferences = await prisma.pushNotificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences || !preferences.allEnabled || !preferences.rankingEnabled) {
      console.log(`[API] ❌ Usuário ${userId} não tem notificações de ranking habilitadas`);
      return NextResponse.json(
        { error: 'Você precisa ativar as notificações de ranking primeiro. Vá em Configurações de Notificações e ative "Notificações de Ranking".' },
        { status: 400 }
      );
    }

    // Enviar notificação simulando entrada no top 3 (ignorar rate limit para teste)
    const success = await pushNotificationService.sendRankingNotification(
      userId,
      {
        previousPosition: 5,
        currentPosition: 2,
        changeType: 'top3',
        period: 'mensal',
      },
      { skipRateLimit: true } // Ignorar rate limit para teste
    );

    if (!success) {
      console.log(`[API] ❌ Falha ao enviar notificação de ranking de teste para usuário ${userId}`);
      return NextResponse.json(
        { error: 'Não foi possível enviar notificação. Verifique se o service worker está ativo e se você tem subscription registrada.' },
        { status: 400 }
      );
    }

    console.log(`[API] ✅ Notificação de ranking de teste enviada com sucesso para usuário ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] ❌ Erro ao enviar notificação de ranking de teste:', error);

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

