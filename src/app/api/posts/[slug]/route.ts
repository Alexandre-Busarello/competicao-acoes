import { NextRequest, NextResponse } from 'next/server';
import { feedService } from '@/lib/services/feed-service';
import { getServerSession } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/posts/[slug]
 * Retorna post completo pelo slug (SEO-friendly)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const session = await getServerSession();
    const currentUserId = session?.user.id;

    const post = await feedService.getPostBySlug(slug, currentUserId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




