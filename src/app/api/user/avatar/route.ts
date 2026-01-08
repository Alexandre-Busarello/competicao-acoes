import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Atualiza o avatarUrl do usuário
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { avatarUrl } = await request.json();

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { error: 'avatarUrl é obrigatório e deve ser uma string' },
        { status: 400 }
      );
    }

    // Validar se é uma URL válida (Gravatar ou DiceBear)
    const isValidUrl = 
      avatarUrl.startsWith('https://www.gravatar.com/avatar/') ||
      avatarUrl.startsWith('https://api.dicebear.com/');

    if (!isValidUrl) {
      return NextResponse.json(
        { error: 'URL do avatar inválida. Deve ser do Gravatar ou DiceBear' },
        { status: 400 }
      );
    }

    // Atualizar avatarUrl do usuário
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ 
      success: true,
      avatarUrl: updatedUser.avatarUrl 
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar avatar' },
      { status: 500 }
    );
  }
}

