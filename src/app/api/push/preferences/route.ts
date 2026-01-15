import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

interface PushPreferences {
  rankingEnabled?: boolean;
  engagementEnabled?: boolean;
  followingEnabled?: boolean;
  interactionsEnabled?: boolean;
  allEnabled?: boolean;
}

/**
 * GET /api/push/preferences
 * Retorna preferências de notificações do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const preferences = await prisma.pushNotificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Criar preferências padrão se não existirem
      const defaultPreferences = await prisma.pushNotificationPreferences.create({
        data: {
          userId,
          rankingEnabled: true,
          engagementEnabled: true,
          followingEnabled: true,
          interactionsEnabled: true,
          allEnabled: true,
        },
      });
      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error getting push preferences:', error);

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

/**
 * PUT /api/push/preferences
 * Atualiza preferências de notificações do usuário autenticado
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body: PushPreferences = await request.json();

    // Validar dados
    const updateData: Partial<PushPreferences> = {};
    if (typeof body.rankingEnabled === 'boolean') {
      updateData.rankingEnabled = body.rankingEnabled;
    }
    if (typeof body.engagementEnabled === 'boolean') {
      updateData.engagementEnabled = body.engagementEnabled;
    }
    if (typeof body.followingEnabled === 'boolean') {
      updateData.followingEnabled = body.followingEnabled;
    }
    if (typeof body.interactionsEnabled === 'boolean') {
      updateData.interactionsEnabled = body.interactionsEnabled;
    }
    if (typeof body.allEnabled === 'boolean') {
      updateData.allEnabled = body.allEnabled;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar' },
        { status: 400 }
      );
    }

    const preferences = await prisma.pushNotificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        rankingEnabled: updateData.rankingEnabled ?? true,
        engagementEnabled: updateData.engagementEnabled ?? true,
        followingEnabled: updateData.followingEnabled ?? true,
        interactionsEnabled: updateData.interactionsEnabled ?? true,
        allEnabled: updateData.allEnabled ?? true,
      },
      update: updateData as any,
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating push preferences:', error);

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

