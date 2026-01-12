import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getServerSession } from '@/lib/auth/server';
import { followService } from '@/lib/services/follow-service';
import { rankingService } from '@/lib/services/ranking-service';
import { getCurrentPeriod } from '@/lib/utils/period-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[userId]/public
 * Retorna dados públicos do perfil
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const session = await getServerSession();
    const currentUserId = session?.user.id;

    // Busca dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        slug: true,
        createdAt: true,
        stats: {
          select: {
            followerCount: true,
            followingCount: true,
            postCount: true,
            totalLikesReceived: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verifica se usuário atual segue este perfil
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      isFollowing = await followService.isFollowing(currentUserId, userId);
    }

    // Buscar posições nos rankings vigentes
    const currentPeriod = getCurrentPeriod();
    let monthlyRank: number | null = null;
    let annualRank: number | null = null;

    try {
      // Buscar ranking mensal vigente
      const monthlyRanking = await rankingService.getRanking('mensal', currentPeriod.year, currentPeriod.month);
      if (monthlyRanking) {
        const userEntry = monthlyRanking.ranking.find((entry: any) => entry.userId === userId);
        if (userEntry) {
          monthlyRank = userEntry.rank;
        }
      }

      // Buscar ranking anual vigente
      const annualRanking = await rankingService.getRanking('anual', currentPeriod.year);
      if (annualRanking) {
        const userEntry = annualRanking.ranking.find((entry: any) => entry.userId === userId);
        if (userEntry) {
          annualRank = userEntry.rank;
        }
      }
    } catch (error) {
      console.error('Error fetching rankings for public profile:', error);
      // Não falha a requisição se houver erro ao buscar rankings
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      slug: user.slug,
      createdAt: user.createdAt.toISOString(),
      stats: user.stats ? {
        followerCount: user.stats.followerCount,
        followingCount: user.stats.followingCount,
        postCount: user.stats.postCount,
        totalLikesReceived: user.stats.totalLikesReceived,
      } : {
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        totalLikesReceived: 0,
      },
      isFollowing,
      isOwnProfile: currentUserId === userId,
      rankings: {
        monthly: monthlyRank,
        annual: annualRank,
      },
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

