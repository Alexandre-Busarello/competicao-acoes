import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed/poll/[pollId]
 * Buscar enquete com votos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id;
    const pollId = params.pollId;

    // Buscar enquete
    const poll = await prisma.feedPoll.findUnique({
      where: { id: pollId },
      include: {
        votes: userId
          ? {
              where: { userId },
            }
          : false,
        _count: {
          select: {
            votes: true,
          },
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
      id: poll.id,
      postId: poll.postId,
      question: poll.question,
      options: poll.options as string[],
      totalVotes: poll._count.votes,
      voteCounts,
      userVote: userId && poll.votes && Array.isArray(poll.votes) && poll.votes[0]
        ? {
            optionIndex: poll.votes[0].optionIndex,
          }
        : undefined,
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

