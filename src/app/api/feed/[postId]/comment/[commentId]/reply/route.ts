import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { feedService } from '@/lib/services/feed-service';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/feed/[postId]/comment/[commentId]/reply
 * Responder a um comentário específico
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { postId, commentId } = params;

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verificar se comentário pai existe e pertence ao post
    const parentComment = await prisma.feedComment.findUnique({
      where: { id: commentId },
      select: {
        postId: true,
        deletedAt: true,
        userId: true,
      },
    });

    if (!parentComment) {
      return NextResponse.json(
        { error: 'Parent comment not found' },
        { status: 404 }
      );
    }

    if (parentComment.postId !== postId) {
      return NextResponse.json(
        { error: 'Comment does not belong to this post' },
        { status: 400 }
      );
    }

    if (parentComment.deletedAt) {
      return NextResponse.json(
        { error: 'Parent comment has been deleted' },
        { status: 404 }
      );
    }

    // Criar resposta usando o feedService
    const reply = await feedService.addComment(
      postId,
      userId,
      content.trim(),
      commentId
    );

    // Buscar resposta completa com user
    const fullReply = await prisma.feedComment.findUnique({
      where: { id: reply.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replies: {
          where: {
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
        },
      },
    });

    return NextResponse.json(fullReply);
  } catch (error) {
    console.error('Error creating reply:', error);
    
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


