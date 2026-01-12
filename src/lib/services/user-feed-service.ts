import { BaseFeedService, type FeedResult, type FeedQueryParams } from './base-feed-service';
import { cacheService } from '@/lib/cache/cache-service';
import { cacheConfig } from '@/lib/config/cache';
import type { FeedPost } from './feed-service';

export interface UserFeedQueryParams extends FeedQueryParams {
  userId: string;
  includePrivate?: boolean;
}

/**
 * Serviço para gerenciar feed de posts de um usuário específico
 */
export class UserFeedService extends BaseFeedService {
  /**
   * Obtém feed do usuário com paginação cursor-based
   */
  async getFeed(params: UserFeedQueryParams): Promise<FeedResult> {
    const {
      userId,
      limit = this.DEFAULT_LIMIT,
      cursor,
      includePrivate = false,
      currentUserId,
    } = params;

    // Verifica cache (não inclui currentUserId no cache para reutilização)
    const cacheKey = `feed:${userId}:${cursor || 'first'}`;
    const cached = await this.getCached<{
      posts: FeedPost[];
      nextCursor: string | null;
    }>(cacheKey);

    if (cached && !currentUserId) {
      return cached;
    }

    // Busca posts
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (!includePrivate) {
      where.isPublic = true;
    }

    const posts = await this.fetchPostsFromPrisma({
      where,
      take: limit + 1, // +1 para verificar se tem mais
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'asc', // Mais antigos primeiro, mais recentes embaixo
      },
    });

    const { resultPosts, nextCursor } = this.processCursorPagination(posts, limit);

    // Mapeia posts
    const mappedPosts = resultPosts.map(post => this.mapToFeedPost(post));

    // Enriquece com likes do usuário atual
    const enrichedPosts = await this.enrichWithLikes(mappedPosts, currentUserId);

    const result: FeedResult = {
      posts: enrichedPosts,
      nextCursor,
    };

    // Cache por 5 minutos (sem informações de like do usuário)
    if (!currentUserId) {
      await this.setCache(cacheKey, {
        posts: enrichedPosts.map(({ likedByCurrentUser, ...post }) => post),
        nextCursor,
      });
    }

    return result;
  }
}

export const userFeedService = new UserFeedService();

