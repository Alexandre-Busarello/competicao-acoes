import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { feedService } from '@/lib/services/feed-service';
import { parsePollFromMarkdown } from '@/lib/utils/poll-parser';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/feed
 * Criar post customizado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Validar tamanho máximo (ex: 10000 caracteres)
    const MAX_CONTENT_LENGTH = 10000;
    if (content.trim().length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` },
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

    // Criar post customizado
    const post = await feedService.createCustomPost(userId, content.trim());

    // Verificar se há enquete no conteúdo
    const pollConfig = parsePollFromMarkdown(content.trim());
    if (pollConfig && pollConfig.options.length >= 2 && pollConfig.options.length <= 6) {
      // Verificar se já existe enquete para este post (proteção adicional)
      const existingPoll = await prisma.feedPoll.findUnique({
        where: { postId: post.id },
      });

      if (existingPoll) {
        return NextResponse.json(
          { error: 'Post already has a poll' },
          { status: 400 }
        );
      }

      // Criar enquete para o post
      try {
        await prisma.feedPoll.create({
          data: {
            postId: post.id,
            question: pollConfig.question,
            options: pollConfig.options,
            totalVotes: 0,
          },
        });
      } catch (error: any) {
        // Se erro for de constraint única, já existe enquete
        if (error?.code === 'P2002') {
          return NextResponse.json(
            { error: 'Post already has a poll' },
            { status: 400 }
          );
        }
        console.error('Error creating poll:', error);
        // Não falhar a criação do post se a enquete falhar por outros motivos
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating custom post:', error);
    
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

