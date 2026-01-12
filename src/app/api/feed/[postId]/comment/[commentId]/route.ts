import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed/[postId]/comment/[commentId]
 * Buscar comentário específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const { commentId } = params;

    const comment = await prisma.feedComment.findUnique({
      where: {
        id: commentId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/feed/[postId]/comment/[commentId]
 * Editar comentário (apenas dono)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { commentId } = params;

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verificar se comentário existe e se usuário é o dono
    const comment = await prisma.feedComment.findUnique({
      where: { id: commentId },
      select: { userId: true, deletedAt: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.deletedAt) {
      return NextResponse.json(
        { error: 'Comment has been deleted' },
        { status: 404 }
      );
    }

    // Verificação de segurança: apenas o dono pode editar
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to edit this comment' },
        { status: 403 }
      );
    }

    // Atualizar comentário
    const updatedComment = await prisma.feedComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    
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
 * DELETE /api/feed/[postId]/comment/[commentId]
 * Excluir comentário (soft delete, apenas dono)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { commentId } = params;

    // Verificar se comentário existe e se usuário é o dono
    const comment = await prisma.feedComment.findUnique({
      where: { id: commentId },
      select: { userId: true, deletedAt: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.deletedAt) {
      return NextResponse.json(
        { error: 'Comment already deleted' },
        { status: 404 }
      );
    }

    // Verificação de segurança: apenas o dono pode excluir
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this comment' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.feedComment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    
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

