import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

interface UpdateSubscriptionData {
  enabled?: boolean;
  deviceName?: string;
}

/**
 * PATCH /api/push/subscriptions/[id]
 * Atualiza uma subscription específica (ativar/desativar ou renomear)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const subscriptionId = params.id;

    const body: UpdateSubscriptionData = await request.json();

    // Validar que pelo menos um campo foi fornecido
    if (body.enabled === undefined && !body.deviceName) {
      return NextResponse.json(
        { error: 'É necessário fornecer enabled ou deviceName' },
        { status: 400 }
      );
    }

    // Verificar se a subscription existe e pertence ao usuário
    const existing = await prisma.pushSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Subscription não encontrada' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Preparar dados de atualização
    const updateData: Partial<UpdateSubscriptionData & { updatedAt: Date }> = {
      updatedAt: new Date(),
    };

    if (body.enabled !== undefined) {
      updateData.enabled = body.enabled;
    }

    if (body.deviceName !== undefined && body.deviceName.trim()) {
      updateData.deviceName = body.deviceName.trim();
    }

    // Atualizar subscription
    const updated = await prisma.pushSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        deviceType: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating subscription:', error);

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


