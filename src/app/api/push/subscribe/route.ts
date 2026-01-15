import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

/**
 * HEAD /api/push/subscribe
 * Verifica se o usuário tem subscription registrada
 */
export async function HEAD(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const subscription = await prisma.pushSubscription.findFirst({
      where: { userId },
    });

    if (subscription) {
      return new NextResponse(null, { status: 200 });
    }

    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * POST /api/push/subscribe
 * Registra subscription de push do usuário autenticado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body: PushSubscriptionData = await request.json();

    // Validar dados da subscription
    if (!body.endpoint || !body.keys || !body.keys.p256dh || !body.keys.auth) {
      return NextResponse.json(
        { error: 'Subscription data inválida. Endpoint e keys são obrigatórios.' },
        { status: 400 }
      );
    }

    // Verificar se já existe subscription com este endpoint
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: body.endpoint },
    });

    if (existing) {
      // Se já existe mas é de outro usuário, atualizar
      if (existing.userId !== userId) {
        await prisma.pushSubscription.update({
          where: { endpoint: body.endpoint },
          data: {
            userId,
            keys: body.keys as any,
            updatedAt: new Date(),
          },
        });
      }
      // Se já é do mesmo usuário, não precisa fazer nada
    } else {
      // Criar nova subscription
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: body.endpoint,
          keys: body.keys as any,
        },
      });
    }

    // Criar preferências padrão se não existirem
    await prisma.pushNotificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        rankingEnabled: true,
        engagementEnabled: true,
        followingEnabled: true,
        allEnabled: true,
      },
      update: {}, // Não atualizar se já existe
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);

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

