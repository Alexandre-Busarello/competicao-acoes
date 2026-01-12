import { NextRequest, NextResponse } from 'next/server';
import { globalFeedService } from '@/lib/services/global-feed-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed/public
 * Retorna feed público com apenas 5 posts mais recentes
 * Não requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 5); // Máximo 5 posts

    // Buscar apenas posts públicos, sem autenticação
    const result = await globalFeedService.getFeed({
      limit,
      currentUserId: undefined, // Sem usuário logado
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching public feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

