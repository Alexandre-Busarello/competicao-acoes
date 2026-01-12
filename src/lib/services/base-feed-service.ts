import { prisma } from '@/lib/prisma/client';
import { cacheService } from '@/lib/cache/cache-service';
import { cacheConfig } from '@/lib/config/cache';
import type { FeedPost } from './feed-service';

/**
 * Resultado de uma busca de feed com paginação cursor-based
 */
export interface FeedResult {
  posts: FeedPost[];
  nextCursor: string | null;
}

/**
 * Parâmetros para busca de feed
 */
export interface FeedQueryParams {
  limit?: number;
  cursor?: string;
  currentUserId?: string;
}

/**
 * Classe abstrata que define a API comum para todos os tipos de feed
 */
export abstract class BaseFeedService {
  /**
   * Limite padrão de itens por página
   */
  protected readonly DEFAULT_LIMIT = 20;

  /**
   * Método abstrato que cada implementação deve definir
   * para buscar posts do feed específico
   */
  abstract getFeed(params: FeedQueryParams): Promise<FeedResult>;

  /**
   * Enriquece posts com informações de likes do usuário atual
   */
  protected async enrichWithLikes(
    posts: FeedPost[],
    currentUserId?: string
  ): Promise<FeedPost[]> {
    if (!currentUserId || posts.length === 0) {
      return posts;
    }

    const postIds = posts.map(p => p.id);
    // @ts-ignore - Prisma types may not be updated immediately after migration
    const likes = await prisma.feedLike.findMany({
      where: {
        postId: { in: postIds },
        userId: currentUserId,
      },
      select: {
        postId: true,
      },
    });

    const userLikes = new Set(likes.map((l: { postId: string }) => l.postId));

    return posts.map(post => ({
      ...post,
      likedByCurrentUser: userLikes.has(post.id),
    }));
  }

  /**
   * Mapeia post do Prisma para FeedPost
   */
  protected mapToFeedPost(post: any): FeedPost {
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
      pollId: post.poll?.id || null,
    };
  }

  /**
   * Busca posts do Prisma com includes padrão
   */
  protected async fetchPostsFromPrisma(params: {
    where: any;
    take: number;
    cursor?: { id: string };
    orderBy: any;
  }) {
    // @ts-ignore - Prisma types may not be updated immediately after migration
    return await prisma.feedPost.findMany({
      where: params.where,
      take: params.take,
      cursor: params.cursor,
      orderBy: params.orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            // @ts-ignore - slug exists in schema but TypeScript may not recognize it immediately
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
        poll: {
          select: {
            id: true,
            totalVotes: true,
          },
        },
      },
    });
  }

  /**
   * Processa resultado de busca com paginação cursor-based
   */
  protected processCursorPagination(
    posts: any[],
    limit: number
  ): {
    resultPosts: any[];
    nextCursor: string | null;
  } {
    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1].id : null;

    return {
      resultPosts,
      nextCursor,
    };
  }

  /**
   * Obtém valor do cache
   */
  protected async getCached<T>(key: string): Promise<T | null> {
    return await cacheService.get<T>(key);
  }

  /**
   * Define valor no cache
   */
  protected async setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
    await cacheService.set(key, value, ttl || cacheConfig.redis.ttl.feed);
  }

  /**
   * Limpa cache por padrão
   */
  protected async clearCache(pattern: string): Promise<void> {
    await cacheService.clear(pattern);
  }
}

