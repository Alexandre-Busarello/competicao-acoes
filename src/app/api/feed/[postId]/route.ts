import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { feedService } from '@/lib/services/feed-service';
import { parsePollFromMarkdown } from '@/lib/utils/poll-parser';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed/[postId]
 * Buscar post por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const session = await requireAuth();
    const userId = session.user.id;

    const post = await feedService.getPostById(postId, userId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    
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
 * PUT /api/feed/[postId]
 * Editar post (apenas dono)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const postId = params.postId;

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verificar se há múltiplas enquetes no conteúdo
    const pollComments = content.match(/<!--\s*poll:[^>]+-->/g);
    if (pollComments && pollComments.length > 1) {
      return NextResponse.json(
        { error: 'Only one poll per post is allowed' },
        { status: 400 }
      );
    }

    await feedService.updatePost(postId, userId, content.trim());

    // Verificar se há enquete no conteúdo e se não existe enquete ainda
    const existingPoll = await prisma.feedPoll.findUnique({
      where: { postId },
    });

    if (!existingPoll) {
      // Não existe enquete, verificar se há comentário poll no conteúdo
      const pollConfig = parsePollFromMarkdown(content.trim());
      if (pollConfig && pollConfig.options.length >= 2 && pollConfig.options.length <= 6) {
        // Criar enquete para o post
        try {
          await prisma.feedPoll.create({
            data: {
              postId,
              question: pollConfig.question,
              options: pollConfig.options,
              totalVotes: 0,
            },
          });
        } catch (error: any) {
          // Se erro for de constraint única, já existe enquete (race condition)
          if (error?.code === 'P2002') {
            return NextResponse.json(
              { error: 'Post already has a poll' },
              { status: 400 }
            );
          }
          console.error('Error creating poll:', error);
          // Não falhar a edição do post se a enquete falhar por outros motivos
        }
      }
    }
    // Se já existe enquete, ignorar comentários poll no conteúdo
    // (a enquete já está criada e não pode ser modificada via edição de post)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feed/[postId]
 * Deletar post (soft delete, apenas dono)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const postId = params.postId;

    await feedService.deletePost(postId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feed/[postId]
 * Alternar visibilidade do post (isPublic)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const postId = params.postId;

    const isPublic = await feedService.togglePostVisibility(postId, userId);

    return NextResponse.json({ isPublic });
  } catch (error) {
    console.error('Error toggling post visibility:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



