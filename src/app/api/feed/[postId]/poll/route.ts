import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/feed/[postId]/poll
 * Criar enquete para um post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const postId = params.postId;

    const { question, options } = await request.json();

    // Validações
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' },
        { status: 400 }
      );
    }

    if (options.length > 6) {
      return NextResponse.json(
        { error: 'Maximum 6 options allowed' },
        { status: 400 }
      );
    }

    // Validar que todas as opções são strings não vazias
    const validOptions = options
      .map((opt: any) => typeof opt === 'string' ? opt.trim() : '')
      .filter((opt: string) => opt.length > 0);

    if (validOptions.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 valid options are required' },
        { status: 400 }
      );
    }

    // Verificar se o post existe e pertence ao usuário
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verificar se já existe enquete para este post
    const existingPoll = await prisma.feedPoll.findUnique({
      where: { postId },
    });

    if (existingPoll) {
      return NextResponse.json(
        { error: 'Poll already exists for this post' },
        { status: 400 }
      );
    }

    // Criar enquete
    const poll = await prisma.feedPoll.create({
      data: {
        postId,
        question: question.trim(),
        options: validOptions,
        totalVotes: 0,
      },
    });

    return NextResponse.json({
      id: poll.id,
      postId: poll.postId,
      question: poll.question,
      options: poll.options as string[],
      totalVotes: poll.totalVotes,
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating poll:', error);
    
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

