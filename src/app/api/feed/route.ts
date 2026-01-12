import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { feedService } from '@/lib/services/feed-service';

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

    // Criar post customizado
    const post = await feedService.createCustomPost(userId, content.trim());

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

