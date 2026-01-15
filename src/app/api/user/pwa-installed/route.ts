import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/pwa-installed
 * Marca o PWA como instalado para o usuário autenticado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verificar se já está marcado como instalado
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pwaInstalledAt: true },
    });

    // Se já está instalado, não atualizar novamente
    if (user?.pwaInstalledAt) {
      return NextResponse.json({ success: true, alreadyInstalled: true });
    }

    // Marcar como instalado
    await prisma.user.update({
      where: { id: userId },
      data: {
        pwaInstalledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Erro ao marcar PWA como instalado:', error);
    return NextResponse.json({ success: false }, { status: 200 }); // Retornar 200 mesmo em erro
  }
}

