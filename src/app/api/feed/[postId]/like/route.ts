import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { feedService } from '@/lib/services/feed-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/feed/[postId]/like
 * Curtir/descurtir post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const postId = params.postId;

    const result = await feedService.toggleLike(postId, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error toggling like:', error);
    
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


