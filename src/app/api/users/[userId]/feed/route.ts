import { NextRequest, NextResponse } from 'next/server';
import { userFeedService } from '@/lib/services/user-feed-service';
import { getServerSession } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[userId]/feed
 * Retorna feed do usuário com paginação cursor-based
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const session = await getServerSession();
    const currentUserId = session?.user.id;

    // Verifica se é o próprio perfil (permite ver posts privados)
    const includePrivate = currentUserId === userId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;

    const result = await userFeedService.getFeed({
      userId,
      limit,
      cursor,
      includePrivate,
      currentUserId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

