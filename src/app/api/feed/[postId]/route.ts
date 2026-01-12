import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { feedService } from '@/lib/services/feed-service';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/feed/[postId]
 * Editar post (apenas dono)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const postId = params.postId;

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await feedService.updatePost(postId, userId, content.trim());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feed/[postId]
 * Deletar post (soft delete, apenas dono)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const postId = params.postId;

    await feedService.deletePost(postId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feed/[postId]
 * Alternar visibilidade do post (isPublic)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const postId = params.postId;

    const isPublic = await feedService.togglePostVisibility(postId, userId);

    return NextResponse.json({ isPublic });
  } catch (error) {
    console.error('Error toggling post visibility:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


