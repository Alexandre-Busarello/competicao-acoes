import { NextRequest, NextResponse } from 'next/server';
import { globalFeedService } from '@/lib/services/global-feed-service';
import { getServerSession } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed/global
 * Retorna feed global com ordenação por engajamento
 * Requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;

    const result = await globalFeedService.getFeed({
      limit,
      cursor,
      currentUserId,
    });

    // Registrar visualizações em batch (opcional, pode ser feito no frontend também)
    // Por enquanto, vamos deixar o frontend fazer isso via IntersectionObserver

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching global feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

