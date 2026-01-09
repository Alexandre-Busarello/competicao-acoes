import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getServerSession } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/feed/[postId]/view
 * Registra visualização de um post pelo usuário atual
 * Upsert: cria ou atualiza viewedAt se já existe
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { postId } = params;

    // Verificar se o post existe
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Upsert: cria ou atualiza visualização
    // @ts-ignore - Prisma types may not be updated immediately after migration
    const view = await prisma.feedView.upsert({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId,
        postId,
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      viewedAt: view.viewedAt,
    });
  } catch (error) {
    console.error('Error registering view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

