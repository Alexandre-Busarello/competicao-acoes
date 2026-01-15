import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/track-access
 * Atualiza o lastAccessAt do usuário autenticado
 * Rate limit: atualiza no máximo a cada minuto para evitar spam
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verificar último acesso (rate limit: máximo 1 vez por minuto)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastAccessAt: true },
    });

    if (user?.lastAccessAt) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (user.lastAccessAt > oneMinuteAgo) {
        // Ainda não passou 1 minuto, não atualizar
        return NextResponse.json({ success: true, skipped: true });
      }
    }

    // Atualizar lastAccessAt
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastAccessAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Não retornar erro para não quebrar a experiência do usuário
    // Apenas logar o erro
    console.error('[API] Erro ao atualizar lastAccessAt:', error);
    return NextResponse.json({ success: false }, { status: 200 }); // Retornar 200 mesmo em erro
  }
}

