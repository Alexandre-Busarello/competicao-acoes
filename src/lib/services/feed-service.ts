import { prisma } from '@/lib/prisma/client';
import { generateUniquePostSlug } from '@/lib/utils/slug-generator';
import { queueService } from '@/lib/queue/queue-service';
import { executeActionHandler } from '@/lib/queue/action-handlers';
import { cacheService } from '@/lib/cache/cache-service';
import { cacheConfig } from '@/lib/config/cache';
import { generateFeedMessage } from '@/lib/utils/feed-messages';

export interface FeedPost {
  id: string;
  userId: string;
  transactionId: string | null;
  slug: string;
  content: string;
  type: string;
  metadata: any;
  isPublic: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    slug?: string | null;
  };
  transaction?: {
    ticker: string;
    type: string;
    quantity: number;
    price: number;
    date: Date;
  };
  likedByCurrentUser?: boolean;
}

/**
 * Serviço para gerenciar feed de posts
 */
export class FeedService {
  /**
   * Cria post automaticamente a partir de uma transação
   * Gera slug único e define isPublic: true por padrão
   */
  async createPostFromTransaction(transaction: {
    id: string;
    userId: string;
    ticker: string;
    type: string;
    quantity: number;
    price: number;
    date: Date;
  }): Promise<void> {
    // Gera slug único
    const slug = await generateUniquePostSlug({
      type: transaction.type,
      ticker: transaction.ticker,
      quantity: transaction.quantity,
      date: transaction.date,
    });

    // Gera conteúdo do post usando sistema de mensagens variadas
    const content = generateFeedMessage({
      ticker: transaction.ticker,
      type: transaction.type as 'compra' | 'venda' | 'buy' | 'sell',
      quantity: transaction.quantity,
      price: transaction.price,
    });

    // Cria post
    const post = await prisma.feedPost.create({
      data: {
        userId: transaction.userId,
        transactionId: transaction.id,
        slug,
        content,
        type: 'transaction',
        metadata: {
          ticker: transaction.ticker,
          quantity: transaction.quantity,
          price: transaction.price,
          date: transaction.date.toISOString(),
        },
        isPublic: true, // Padrão: público
      },
    });

    // Enfileira ação para atualizar timeline de seguidores
    await queueService.enqueue('timeline_update', {
      postId: post.id,
      userId: transaction.userId,
    }, 5); // Prioridade média

    // Invalida cache do feed do usuário
    await cacheService.clear(`feed:${transaction.userId}:*`);
  }

  /**
   * Cria post customizado (não vinculado a transação)
   * Gera slug único baseado no conteúdo e data
   */
  async createCustomPost(userId: string, content: string): Promise<FeedPost> {
    // Gera slug único baseado no conteúdo
    const date = new Date();
    const contentPreview = content.substring(0, 50).trim();
    const baseSlug = contentPreview
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) || 'post';
    
    const dateStr = date.toISOString().split('T')[0];
    let slug = `${baseSlug}-${dateStr}`;
    
    // Garante que slug é único
    let attempt = 0;
    while (await prisma.feedPost.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${dateStr}-${attempt}`;
      if (attempt > 1000) {
        // Fallback: usar timestamp
        slug = `post-${Date.now()}`;
        break;
      }
    }

    // Cria post
    const post = await prisma.feedPost.create({
      data: {
        userId,
        slug,
        content,
        type: 'custom',
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Enfileira ação para atualizar timeline de seguidores
    await queueService.enqueue('timeline_update', {
      postId: post.id,
      userId,
    }, 5); // Prioridade média

    // Invalida cache do feed do usuário
    await cacheService.clear(`feed:${userId}:*`);

    return this.mapToFeedPost(post);
  }

  /**
   * Obtém post por ID
   */
  async getPostById(postId: string, currentUserId?: string): Promise<FeedPost | null> {
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        transaction: {
          select: {
            ticker: true,
            type: true,
            quantity: true,
            price: true,
            date: true,
          },
        },
      },
    });

    if (!post || post.deletedAt) {
      return null;
    }

    // Verifica se é público ou se usuário é dono
    if (!post.isPublic && post.userId !== currentUserId) {
      return null;
    }

    // Verifica se usuário curtiu
    let likedByCurrentUser = false;
    if (currentUserId) {
      const like = await prisma.feedLike.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: currentUserId,
          },
        },
      });
      likedByCurrentUser = !!like;
    }

    return {
      ...this.mapToFeedPost(post),
      likedByCurrentUser,
    };
  }

  /**
   * Obtém post pelo slug
   */
  async getPostBySlug(slug: string, currentUserId?: string): Promise<FeedPost | null> {
    const post = await prisma.feedPost.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            slug: true,
          },
        },
        transaction: {
          select: {
            ticker: true,
            type: true,
            quantity: true,
            price: true,
            date: true,
          },
        },
      },
    });

    if (!post || post.deletedAt) {
      return null;
    }

    // Verifica se é público ou se usuário é dono
    if (!post.isPublic && post.userId !== currentUserId) {
      return null;
    }

    // Verifica se usuário curtiu
    let likedByCurrentUser = false;
    if (currentUserId) {
      const like = await prisma.feedLike.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: currentUserId,
          },
        },
      });
      likedByCurrentUser = !!like;
    }

    return {
      ...this.mapToFeedPost(post),
      likedByCurrentUser,
    };
  }

  /**
   * Alterna visibilidade do post
   */
  async togglePostVisibility(postId: string, userId: string): Promise<boolean> {
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { userId: true, isPublic: true },
    });

    if (!post || post.userId !== userId) {
      throw new Error('Post not found or user not authorized');
    }

    const updated = await prisma.feedPost.update({
      where: { id: postId },
      data: {
        isPublic: !post.isPublic, // Toggle
      },
      select: {
        isPublic: true,
      },
    });

    // Invalida cache
    await cacheService.clear(`feed:${userId}:*`);

    return updated.isPublic;
  }

  /**
   * Adiciona comentário (com processamento otimista)
   */
  async addComment(postId: string, userId: string, content: string): Promise<{
    id: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: Date;
  }> {
    // Enfileira ação
    const actionId = await queueService.enqueue('comment', {
      postId,
      userId,
      content,
    }, 10); // Prioridade alta

    // Tenta processar imediatamente (otimista)
    try {
      await executeActionHandler('comment', { postId, userId, content });
      await queueService.markCompleted(actionId);
    } catch (error) {
      // Se falhar, deixa na fila para processamento posterior
      console.error('Failed to process comment immediately:', error);
    }

    // Busca comentário criado
    const comment = await prisma.feedComment.findFirst({
      where: {
        postId,
        userId,
        content,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!comment) {
      throw new Error('Comment not created');
    }

    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  /**
   * Alterna like no post (com processamento otimista)
   */
  async toggleLike(postId: string, userId: string): Promise<{
    liked: boolean;
    likeCount: number;
  }> {
    // Verifica se já existe like
    const existingLike = await prisma.feedLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    const liked = !existingLike;

    // Enfileira ação
    const actionId = await queueService.enqueue('like', {
      postId,
      userId,
    }, 10); // Prioridade alta

    // Tenta processar imediatamente (otimista)
    try {
      await executeActionHandler('like', { postId, userId });
      await queueService.markCompleted(actionId);
    } catch (error) {
      // Se falhar, deixa na fila para processamento posterior
      console.error('Failed to process like immediately:', error);
    }

    // Busca contagem atualizada (atualizada via trigger)
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: {
        likeCount: true,
      },
    });

    return {
      liked,
      likeCount: post?.likeCount || 0,
    };
  }

  /**
   * Atualiza post (apenas dono)
   */
  async updatePost(postId: string, userId: string, content: string): Promise<void> {
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!post || post.userId !== userId) {
      throw new Error('Post not found or user not authorized');
    }

    await prisma.feedPost.update({
      where: { id: postId },
      data: { content },
    });

    // Invalida cache
    await cacheService.clear(`feed:${userId}:*`);
  }

  /**
   * Deleta post (soft delete)
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!post || post.userId !== userId) {
      throw new Error('Post not found or user not authorized');
    }

    await prisma.feedPost.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalida cache
    await cacheService.clear(`feed:${userId}:*`);
  }

  /**
   * Mapeia post do Prisma para FeedPost
   */
  private mapToFeedPost(post: any): FeedPost {
    return {
      id: post.id,
      userId: post.userId,
      transactionId: post.transactionId,
      slug: post.slug,
      content: post.content,
      type: post.type,
      metadata: post.metadata,
      isPublic: post.isPublic,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: {
        id: post.user.id,
        name: post.user.name,
        avatarUrl: post.user.avatarUrl,
        slug: post.user.slug || null,
      },
      transaction: post.transaction ? {
        ticker: post.transaction.ticker,
        type: post.transaction.type,
        quantity: Number(post.transaction.quantity),
        price: Number(post.transaction.price),
        date: post.transaction.date,
      } : undefined,
    };
  }
}

export const feedService = new FeedService();

