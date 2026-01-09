import { BaseFeedService, type FeedResult, type FeedQueryParams } from './base-feed-service';
import { prisma } from '@/lib/prisma/client';
import type { FeedPost } from './feed-service';
import { followService } from './follow-service';

export interface GlobalFeedQueryParams extends FeedQueryParams {
  // Sem parâmetros adicionais específicos
}

/**
 * Serviço para gerenciar feed global de posts
 * Ordena por engajamento (likes + comentários) e depois por data
 * Posts visualizados recentemente vão para o final
 */
export class GlobalFeedService extends BaseFeedService {
  /**
   * Calcula score de engajamento: likeCount * 2 + commentCount
   */
  private calculateEngagementScore(post: any): number {
    return (post.likeCount || 0) * 2 + (post.commentCount || 0);
  }

  /**
   * Obtém feed global com ordenação por engajamento
   */
  async getFeed(params: GlobalFeedQueryParams): Promise<FeedResult> {
    const {
      limit = this.DEFAULT_LIMIT,
      cursor,
      currentUserId,
    } = params;

    // Buscar posts públicos (com buffer para compensar visualizados)
    // Usamos um buffer maior para ter posts suficientes após filtrar visualizados
    const bufferMultiplier = 2;
    const fetchLimit = limit * bufferMultiplier;

    const where: any = {
      isPublic: true,
      deletedAt: null,
    };

    // Buscar posts do banco
    const posts = await this.fetchPostsFromPrisma({
      where,
      take: fetchLimit + 1, // +1 para verificar se tem mais
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Se não há usuário logado, ordenar apenas por engajamento e data
    if (!currentUserId) {
      // Calcular scores e ordenar
      const postsWithScores = posts.map(post => ({
        post,
        score: this.calculateEngagementScore(post),
      }));

      // Ordenar: primeiro por score DESC, depois por createdAt DESC
      postsWithScores.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.post.createdAt.getTime() - a.post.createdAt.getTime();
      });

      const sortedPosts = postsWithScores.map(item => item.post);
      const { resultPosts, nextCursor } = this.processCursorPagination(sortedPosts, limit);

      const mappedPosts = resultPosts.map(post => this.mapToFeedPost(post));
      const enrichedPosts = await this.enrichWithLikes(mappedPosts, currentUserId);

      return {
        posts: enrichedPosts,
        nextCursor,
      };
    }

    // Buscar usuários que o usuário atual segue
    const followingUsers = await followService.getFollowing(currentUserId, 100);
    const followingUserIds = new Set(followingUsers.map(u => u.id));

    // Buscar visualizações do usuário nas últimas 24 horas
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Buscar posts recentes de pessoas que o usuário segue (últimas 24 horas)
    let followingPosts: any[] = [];
    if (followingUserIds.size > 0) {
      // @ts-ignore
      followingPosts = await prisma.feedPost.findMany({
        where: {
          userId: { in: Array.from(followingUserIds) },
          isPublic: true,
          deletedAt: null,
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        take: Math.min(limit, 10), // Limitar a 10 posts de pessoas seguidas
        orderBy: {
          createdAt: 'desc',
        },
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
    }

    // @ts-ignore - Prisma types may not be updated immediately after migration
    const recentViews = await prisma.feedView.findMany({
      where: {
        userId: currentUserId,
        viewedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        postId: true,
        viewedAt: true,
      },
    });

    const viewedPostIds = new Set(recentViews.map(v => v.postId));
    const followingPostIds = new Set(followingPosts.map(p => p.id));

    // Separar posts em grupos:
    // 1. Posts de pessoas seguidas (não visualizados)
    // 2. Posts não visualizados (geral)
    // 3. Posts visualizados
    const followingNotViewed: any[] = [];
    const notViewed: any[] = [];
    const viewed: any[] = [];

    // Processar posts de pessoas seguidas primeiro
    followingPosts.forEach(post => {
      if (!viewedPostIds.has(post.id)) {
        followingNotViewed.push(post);
      }
    });

    // Processar posts gerais
    posts.forEach(post => {
      // Ignorar posts de pessoas seguidas (já processados)
      if (followingPostIds.has(post.id)) {
        return;
      }

      if (viewedPostIds.has(post.id)) {
        viewed.push(post);
      } else {
        notViewed.push(post);
      }
    });

    // Calcular scores para posts não visualizados (geral)
    const notViewedWithScores = notViewed.map(post => ({
      post,
      score: this.calculateEngagementScore(post),
    }));

    // Ordenar grupo não visualizado (geral): primeiro por score DESC, depois por createdAt DESC
    notViewedWithScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.post.createdAt.getTime() - a.post.createdAt.getTime();
    });

    // Ordenar posts de pessoas seguidas: apenas por createdAt DESC (mais recentes primeiro)
    followingNotViewed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Ordenar grupo visualizado: apenas por createdAt DESC
    viewed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Concatenar: posts de pessoas seguidas + posts não visualizados (geral) + posts visualizados
    // Mesclar posts de pessoas seguidas com posts gerais de forma intercalada
    // Pegar alguns posts de pessoas seguidas no início, depois mesclar com posts gerais
    const followingCount = Math.min(followingNotViewed.length, Math.floor(limit * 0.3)); // 30% do feed
    const followingSlice = followingNotViewed.slice(0, followingCount);
    
    const sortedPosts = [
      ...followingSlice,
      ...notViewedWithScores.map(item => item.post),
      ...viewed,
    ];

    // Processar paginação
    const { resultPosts, nextCursor } = this.processCursorPagination(sortedPosts, limit);

    // Mapear posts
    const mappedPosts = resultPosts.map(post => this.mapToFeedPost(post));

    // Enriquece com likes do usuário atual
    const enrichedPosts = await this.enrichWithLikes(mappedPosts, currentUserId);

    return {
      posts: enrichedPosts,
      nextCursor,
    };
  }
}

export const globalFeedService = new GlobalFeedService();

