import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/feed/poll/[pollId]/vote
 * Votar em uma opção da enquete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const pollId = params.pollId;

    const { optionIndex } = await request.json();

    // Validações
    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex > 5) {
      return NextResponse.json(
        { error: 'Invalid optionIndex. Must be between 0 and 5' },
        { status: 400 }
      );
    }

    // Buscar enquete
    const poll = await prisma.feedPoll.findUnique({
      where: { id: pollId },
      include: {
        votes: {
          where: { userId },
        },
      },
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    const options = poll.options as string[];
    if (optionIndex >= options.length) {
      return NextResponse.json(
        { error: 'Invalid optionIndex for this poll' },
        { status: 400 }
      );
    }

    // Verificar se usuário já votou
    const existingVote = poll.votes[0];

    if (existingVote) {
      // Atualizar voto existente
      if (existingVote.optionIndex === optionIndex) {
        // Mesma opção, retornar enquete atualizada
        const updatedPoll = await prisma.feedPoll.findUnique({
          where: { id: pollId },
          include: {
            votes: {
              where: { userId },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
        });

        if (!updatedPoll) {
          return NextResponse.json(
            { error: 'Poll not found' },
            { status: 404 }
          );
        }

        // Calcular contagens por opção
        const voteCounts = await Promise.all(
          options.map(async (_, index) => {
            const count = await prisma.feedPollVote.count({
              where: {
                pollId,
                optionIndex: index,
              },
            });
            return count;
          })
        );

        return NextResponse.json({
          id: updatedPoll.id,
          postId: updatedPoll.postId,
          question: updatedPoll.question,
          options: updatedPoll.options as string[],
          totalVotes: updatedPoll._count.votes,
          voteCounts,
          userVote: {
            optionIndex: existingVote.optionIndex,
          },
        });
      }

      // Mudar voto
      await prisma.feedPollVote.update({
        where: { id: existingVote.id },
        data: { optionIndex },
      });
    } else {
      // Criar novo voto
      await prisma.feedPollVote.create({
        data: {
          pollId,
          userId,
          optionIndex,
        },
      });

      // Incrementar contador total
      await prisma.feedPoll.update({
        where: { id: pollId },
        data: {
          totalVotes: {
            increment: 1,
          },
        },
      });
    }

    // Buscar enquete atualizada com contagens
    const updatedPoll = await prisma.feedPoll.findUnique({
      where: { id: pollId },
      include: {
        votes: {
          where: { userId },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!updatedPoll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Calcular contagens por opção
    const voteCounts = await Promise.all(
      options.map(async (_, index) => {
        const count = await prisma.feedPollVote.count({
          where: {
            pollId,
            optionIndex: index,
          },
        });
        return count;
      })
    );

    return NextResponse.json({
      id: updatedPoll.id,
      postId: updatedPoll.postId,
      question: updatedPoll.question,
      options: updatedPoll.options as string[],
      totalVotes: updatedPoll._count.votes,
      voteCounts,
      userVote: updatedPoll.votes[0]
        ? {
            optionIndex: updatedPoll.votes[0].optionIndex,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Error voting on poll:', error);
    
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

