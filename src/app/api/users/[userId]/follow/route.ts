import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { followService } from '@/lib/services/follow-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/[userId]/follow
 * Segue ou deixa de seguir um usuário
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await requireAuth();
    const followerId = session.user.id;
    const followingId = params.userId;

    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const result = await followService.followUser(followerId, followingId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error following user:', error);
    
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
 * GET /api/users/[userId]/follow
 * Verifica status de follow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await requireAuth();
    const followerId = session.user.id;
    const followingId = params.userId;

    const isFollowing = await followService.isFollowing(followerId, followingId);

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    
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



