import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';
import { updateUserSlug } from '@/lib/utils/user-slug-generator';

export const dynamic = 'force-dynamic';

/**
 * Atualiza o nome do usuário e o slug automaticamente
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Nome é obrigatório e deve ser uma string' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: 'Nome não pode estar vazio' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Nome não pode ter mais de 100 caracteres' },
        { status: 400 }
      );
    }

    // Atualizar nome do usuário
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmedName },
      select: {
        id: true,
        name: true,
      },
    });

    // Atualizar slug automaticamente após mudança de nome
    await updateUserSlug(session.user.id);

    return NextResponse.json({ 
      success: true,
      name: updatedUser.name 
    });
  } catch (error) {
    console.error('Error updating name:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar nome' },
      { status: 500 }
    );
  }
}

