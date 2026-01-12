import { BaseFeedService, type FeedResult, type FeedQueryParams } from './base-feed-service';
import { prisma } from '@/lib/prisma/client';
import type { FeedPost } from './feed-service';
import { followService } from './follow-service';
import { cacheService } from '@/lib/cache/cache-service';

export interface GlobalFeedQueryParams extends FeedQueryParams {
  seed?: string;
  isLoop?: boolean;
  excludeIds?: string[];
}

/**
 * Serviço para gerenciar feed global de posts
 * Posts muito recentes (últimas 2 horas) sempre aparecem primeiro, ordenados por data
 * Posts mais antigos são ordenados por engajamento (likes + comentários) e depois por data
 * Posts visualizados recentemente vão para o final
 */
export class GlobalFeedService extends BaseFeedService {
  /**
   * Calcula score de engajamento: likeCount * 2 + commentCount * 3
   */
  private calculateEngagementScore(post: any): number {
    return (post.likeCount || 0) * 2 + (post.commentCount || 0) * 3;
  }

  /**
   * Gera número aleatório baseado em seed (para consistência)
   */
  private seededRandom(seed: string, index: number): number {
    const hash = seed.split('').reduce((acc, char) => {
      const charCode = char.charCodeAt(0);
      return ((acc << 5) - acc) + charCode;
    }, index);
    return (Math.sin(hash) * 10000) % 1;
  }

  /**
   * Aplica aleatoriedade ao score de engajamento
   * Q de aleatoriedade: 0.3 (30% de variação aleatória)
   */
  private applyRandomness(score: number, seed: string, index: number, randomnessFactor: number = 0.3): number {
    const random = this.seededRandom(seed, index);
    const randomVariation = (random - 0.5) * randomnessFactor; // -0.15 a +0.15
    return score * (1 + randomVariation);
  }

  /**
   * Obtém feed global com ordenação por camadas: DIA → SEMANA → ANTIGOS
   * Cada camada ordenada por engajamento
   * Posts mais recentes aparecem embaixo (precisam scrollar para ver)
   */
  async getFeed(params: GlobalFeedQueryParams): Promise<FeedResult> {
    const {
      limit = this.DEFAULT_LIMIT,
      cursor,
      currentUserId,
      seed = Date.now().toString(),
      isLoop = false,
      excludeIds = [],
    } = params;

    // Cache key baseado nos parâmetros
    const cacheKey = `global-feed:${currentUserId || 'anonymous'}:${limit}:${cursor || 'first'}:${seed}:${isLoop}:${excludeIds.join(',')}`;
    
    // Tentar buscar do cache primeiro
    const cached = await cacheService.get<FeedResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Datas para separar camadas
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const where: any = {
      isPublic: true,
      deletedAt: null,
    };

    // Se está em loop e há IDs para excluir, tentar excluir
    if (isLoop && excludeIds.length > 0) {
      const countWithoutExcluded = await prisma.feedPost.count({
        where: {
          ...where,
          id: { notIn: excludeIds },
        },
      });
      
      if (countWithoutExcluded > 0) {
        where.id = { notIn: excludeIds };
      }
    }

    // Buscar posts do banco e separar por camadas: DIA → SEMANA → ANTIGOS
    let allPosts: any[] = [];
    
    if (!cursor) {
      // Primeira página: buscar posts por camadas
      // Ordenar por 'asc' para que mais antigos venham primeiro dentro de cada camada
      const [dayPosts, weekPosts, olderPosts] = await Promise.all([
        // Posts do DIA (últimas 24 horas)
        this.fetchPostsFromPrisma({
          where: {
            ...where,
            createdAt: { gte: oneDayAgo },
          },
          take: 500,
          orderBy: { createdAt: 'asc' }, // Mais antigos primeiro
        }),
        // Posts da SEMANA (últimos 7 dias, excluindo o dia atual)
        this.fetchPostsFromPrisma({
          where: {
            ...where,
            createdAt: { 
              gte: oneWeekAgo,
              lt: oneDayAgo,
            },
          },
          take: 500,
          orderBy: { createdAt: 'asc' }, // Mais antigos primeiro
        }),
        // Posts ANTIGOS (mais de 7 dias)
        this.fetchPostsFromPrisma({
          where: {
            ...where,
            createdAt: { lt: oneWeekAgo },
          },
          take: 500,
          orderBy: { createdAt: 'asc' }, // Mais antigos primeiro
        }),
      ]);

      allPosts = [...dayPosts, ...weekPosts, ...olderPosts];
    } else {
      // Páginas seguintes: buscar com cursor
      const cursorPosts = await this.fetchPostsFromPrisma({
        where,
        take: limit * 3 + 1, // Buffer para ter posts suficientes
        cursor: { id: cursor },
        orderBy: { createdAt: 'asc' }, // Mais antigos primeiro
      });

      allPosts = cursorPosts;
    }

    // Separar posts por camadas: DIA, SEMANA, ANTIGOS
    // Ordem de prioridade: DIA primeiro, depois SEMANA, depois ANTIGOS
    const dayLayer: any[] = [];
    const weekLayer: any[] = [];
    const olderLayer: any[] = [];

    allPosts.forEach(post => {
      const postDate = new Date(post.createdAt);
      if (postDate >= oneDayAgo) {
        dayLayer.push(post);
      } else if (postDate >= oneWeekAgo) {
        weekLayer.push(post);
      } else {
        olderLayer.push(post);
      }
    });

    // Aplicar engajamento e aleatoriedade em cada camada
    const processLayer = (layer: any[], layerName: string, isDayLayer: boolean = false) => {
      return layer.map((post, index) => {
        const baseScore = this.calculateEngagementScore(post);
        const finalScore = this.applyRandomness(baseScore, seed, index, 0.3);
        return {
          post,
          score: finalScore,
          layer: layerName,
        };
      }).sort((a, b) => {
        // Ordenar por score de engajamento (com aleatoriedade)
        if (Math.abs(b.score - a.score) > 0.01) {
          return b.score - a.score;
        }
        // Em caso de empate:
        // - Para camada DIA: mais NOVO primeiro (para que os mais novos fiquem no final/embaixo)
        // - Para outras camadas: mais ANTIGO primeiro
        if (isDayLayer) {
          return b.post.createdAt.getTime() - a.post.createdAt.getTime(); // Mais novo primeiro
        } else {
          return a.post.createdAt.getTime() - b.post.createdAt.getTime(); // Mais antigo primeiro
        }
      });
    };

    const processedDay = processLayer(dayLayer, 'day', true); // DIA: mais novos no final
    const processedWeek = processLayer(weekLayer, 'week', false);
    const processedOlder = processLayer(olderLayer, 'older', false);

    // Combinar camadas respeitando ordem: DIA → SEMANA → ANTIGOS
    // DIA primeiro: ordenados por engajamento, com mais novos no final (embaixo)
    // SEMANA depois: quando acabarem os do DIA
    // ANTIGOS por último: quando acabarem os da SEMANA
    const sortedPosts = [
      ...processedDay.map(item => item.post),   // DIA primeiro (topo)
      ...processedWeek.map(item => item.post),  // SEMANA depois
      ...processedOlder.map(item => item.post), // ANTIGOS por último (embaixo)
    ];

    // Se não há usuário logado, retornar resultado direto
    if (!currentUserId) {
      const { resultPosts, nextCursor } = this.processCursorPagination(sortedPosts, limit);

      const mappedPosts = resultPosts.map(post => this.mapToFeedPost(post));
      const enrichedPosts = await this.enrichWithLikes(mappedPosts, currentUserId);

      const result: FeedResult = {
        posts: enrichedPosts,
        nextCursor: nextCursor || 'loop',
      };

      // Cachear resultado por 5 minutos
      await cacheService.set(cacheKey, result, 300);

      return result;
    }

    // Para usuários logados, buscar visualizações e separar posts visualizados
    // @ts-ignore
    const recentViews = await prisma.feedView.findMany({
      where: {
        userId: currentUserId,
        viewedAt: { gte: oneDayAgo },
      },
      select: { postId: true },
    });
    const viewedPostIds = new Set(recentViews.map((v: any) => v.postId));

    // Separar posts visualizados dos não visualizados, mantendo ordem de camadas
    const notViewed: any[] = [];
    const viewed: any[] = [];

    sortedPosts.forEach(post => {
      if (viewedPostIds.has(post.id)) {
        viewed.push(post);
      } else {
        notViewed.push(post);
      }
    });

    // Combinar: não visualizados primeiro, depois visualizados
    // Ordem final: ANTIGOS → SEMANA → DIA (mais recentes embaixo)
    const finalSortedPosts = [...notViewed, ...viewed];
    
    const { resultPosts, nextCursor } = this.processCursorPagination(finalSortedPosts, limit);

    // Mapear posts
    const mappedPosts = resultPosts.map(post => this.mapToFeedPost(post));

    // Enriquece com likes do usuário atual
    const enrichedPosts = await this.enrichWithLikes(mappedPosts, currentUserId);

    const result: FeedResult = {
      posts: enrichedPosts,
      nextCursor: nextCursor || 'loop',
    };

    // Cachear resultado por 5 minutos
    await cacheService.set(cacheKey, result, 300);

    return result;
  }
}

export const globalFeedService = new GlobalFeedService();

