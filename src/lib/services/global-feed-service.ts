import { BaseFeedService, type FeedResult, type FeedQueryParams } from './base-feed-service';
import { prisma } from '@/lib/prisma/client';
import type { FeedPost } from './feed-service';
import { followService } from './follow-service';

export interface GlobalFeedQueryParams extends FeedQueryParams {
  // Sem parâmetros adicionais específicos
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

    // Sempre buscar posts muito recentes (últimas 24 horas) para garantir que apareçam
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const where: any = {
      isPublic: true,
      deletedAt: null,
    };

    // Buscar posts do banco
    // Sempre garantir que posts muito recentes sejam incluídos, mesmo na primeira página
    let posts: any[] = [];
    
    if (!cursor) {
      // Primeira página: buscar TODOS os posts públicos disponíveis
      // Quando há poucos posts, precisamos buscar todos para garantir que apareçam
      // Buscar posts recentes (últimas 24 horas) primeiro
      const recentPosts = await this.fetchPostsFromPrisma({
        where: {
          ...where,
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        take: 500, // Buscar até 500 posts das últimas 24 horas
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Buscar TODOS os posts públicos (sem limite de data) para garantir cobertura completa
      // Isso é importante quando há poucos posts no sistema
      const allPosts = await this.fetchPostsFromPrisma({
        where,
        take: 1000, // Buscar até 1000 posts públicos (garantir que todos apareçam)
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Combinar e remover duplicatas (priorizar posts mais recentes)
      const postMap = new Map<string, any>();
      
      // Adicionar todos os posts (garantir que nenhum seja perdido)
      allPosts.forEach(post => {
        postMap.set(post.id, post);
      });
      
      // Adicionar posts recentes novamente para garantir ordem (não sobrescrever)
      recentPosts.forEach(post => {
        postMap.set(post.id, post);
      });

      posts = Array.from(postMap.values());
      
      // Ordenar por data de criação (mais recentes primeiro)
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // NÃO limitar aqui - vamos limitar depois da ordenação por engajamento
      // para garantir que posts muito recentes sempre apareçam
    } else {
      // Páginas seguintes: buscar normalmente com cursor
      const cursorPosts = await this.fetchPostsFromPrisma({
        where,
        take: fetchLimit + 1, // +1 para verificar se tem mais
        cursor: { id: cursor },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Também buscar posts muito recentes que podem ter sido criados após o cursor
      // Isso garante que posts novos sempre apareçam, mesmo em páginas seguintes
      const recentPosts = await this.fetchPostsFromPrisma({
        where: {
          ...where,
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        take: 50, // Buscar até 50 posts recentes
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Combinar e remover duplicatas (priorizar posts mais recentes)
      const postMap = new Map<string, any>();
      
      // Adicionar posts recentes primeiro (têm prioridade)
      recentPosts.forEach(post => {
        postMap.set(post.id, post);
      });
      
      // Adicionar posts do cursor (não sobrescrever se já existe)
      cursorPosts.forEach(post => {
        if (!postMap.has(post.id)) {
          postMap.set(post.id, post);
        }
      });

      posts = Array.from(postMap.values());
      
      // Ordenar por data de criação (mais recentes primeiro)
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // NÃO limitar aqui - vamos limitar depois da ordenação completa incluindo visualizados
    }

    // Se não há usuário logado, ordenar apenas por engajamento e data
    if (!currentUserId) {
      // Posts muito recentes (últimas 2 horas) sempre aparecem primeiro
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      // Separar posts muito recentes dos demais
      const veryRecentPosts: any[] = [];
      const otherPosts: any[] = [];
      
      posts.forEach(post => {
        if (post.createdAt >= twoHoursAgo) {
          veryRecentPosts.push(post);
        } else {
          otherPosts.push(post);
        }
      });
      
      // Ordenar posts muito recentes apenas por data (mais recentes primeiro)
      veryRecentPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Calcular scores e ordenar posts não muito recentes por engajamento
      // Posts recentes (últimas 24 horas mas mais de 2 horas) recebem boost de +5 pontos
      const twentyFourHoursAgoForNotLogged = new Date();
      twentyFourHoursAgoForNotLogged.setHours(twentyFourHoursAgoForNotLogged.getHours() - 24);
      
      const otherPostsWithScores = otherPosts.map(post => {
        const baseScore = this.calculateEngagementScore(post);
        // Boost de +5 pontos para posts recentes (últimas 24h mas mais de 2h)
        const isRecent = post.createdAt >= twentyFourHoursAgoForNotLogged && post.createdAt < twoHoursAgo;
        const boostedScore = isRecent ? baseScore + 5 : baseScore;
        return {
          post,
          score: baseScore,
          boostedScore,
        };
      });

      // Ordenar posts não muito recentes: primeiro por boostedScore DESC, depois por createdAt DESC
      otherPostsWithScores.sort((a, b) => {
        if (b.boostedScore !== a.boostedScore) {
          return b.boostedScore - a.boostedScore;
        }
        return b.post.createdAt.getTime() - a.post.createdAt.getTime();
      });

      // Combinar: posts muito recentes primeiro, depois posts ordenados por engajamento
      const sortedPosts = [
        ...veryRecentPosts,
        ...otherPostsWithScores.map(item => item.post),
      ];
      
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
    // (twentyFourHoursAgo já foi definido acima)
    
    // IMPORTANTE: Sempre buscar posts visualizados separadamente para garantir que apareçam
    // mesmo quando há cursor (páginas seguintes)
    // @ts-ignore - Prisma types may not be updated immediately after migration
    const viewedPostsFromDB = await prisma.feedPost.findMany({
      where: {
        isPublic: true,
        deletedAt: null,
        views: {
          some: {
            userId: currentUserId,
            viewedAt: {
              gte: twentyFourHoursAgo,
            },
          },
        },
      },
      take: 100, // Buscar até 100 posts visualizados
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
    const viewedPostIdsFromDB = new Set(viewedPostsFromDB.map(p => p.id));

    // Separar posts em grupos:
    // 1. Posts de pessoas seguidas (não visualizados)
    // 2. Posts não visualizados (geral)
    // 3. Posts visualizados
    const followingNotViewed: any[] = [];
    const notViewed: any[] = [];
    const viewed: any[] = [];

    // Processar posts de pessoas seguidas primeiro
    followingPosts.forEach(post => {
      if (!viewedPostIds.has(post.id) && !viewedPostIdsFromDB.has(post.id)) {
        followingNotViewed.push(post);
      } else {
        // Posts de pessoas seguidas que foram visualizados também devem aparecer
        // Adicionar a viewed para garantir que apareçam
        viewed.push(post);
      }
    });

    // Processar posts gerais
    // IMPORTANTE: Garantir que TODOS os posts sejam incluídos
    const processedPostIds = new Set<string>();
    
    // Adicionar IDs de posts de pessoas seguidas que já foram processados
    followingPosts.forEach(post => {
      processedPostIds.add(post.id);
    });
    
    posts.forEach(post => {
      // Ignorar posts de pessoas seguidas (já processados acima)
      if (followingPostIds.has(post.id)) {
        if (!processedPostIds.has(post.id)) {
          processedPostIds.add(post.id);
        }
        return;
      }

      // Verificar se está visualizado (em qualquer uma das listas)
      const isViewed = viewedPostIds.has(post.id) || viewedPostIdsFromDB.has(post.id);
      
      if (isViewed) {
        viewed.push(post);
      } else {
        notViewed.push(post);
      }
      
      processedPostIds.add(post.id);
    });
    
    // Adicionar posts visualizados buscados separadamente que não estão em `posts`
    // Isso garante que apareçam mesmo quando há cursor
    viewedPostsFromDB.forEach(post => {
      // Ignorar se já está em posts de pessoas seguidas ou já foi processado
      if (!followingPostIds.has(post.id) && !processedPostIds.has(post.id)) {
        viewed.push(post);
      }
    });

    // Calcular scores para posts não visualizados (geral)
    // Posts muito recentes (últimas 2 horas) têm boost de prioridade
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    // Separar posts muito recentes dos demais
    const veryRecentPosts: any[] = [];
    const otherPosts: any[] = [];
    
    notViewed.forEach(post => {
      if (post.createdAt >= twoHoursAgo) {
        veryRecentPosts.push(post);
      } else {
        otherPosts.push(post);
      }
    });
    
    // Ordenar posts muito recentes apenas por data (mais recentes primeiro)
    veryRecentPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Calcular scores e ordenar posts não muito recentes por engajamento
    // Posts recentes (últimas 24 horas mas mais de 2 horas) recebem boost de +5 pontos
    const twentyFourHoursAgoForLogged = new Date();
    twentyFourHoursAgoForLogged.setHours(twentyFourHoursAgoForLogged.getHours() - 24);
    
    const otherPostsWithScores = otherPosts.map(post => {
      const baseScore = this.calculateEngagementScore(post);
      // Boost de +5 pontos para posts recentes (últimas 24h mas mais de 2h)
      const isRecent = post.createdAt >= twentyFourHoursAgoForLogged && post.createdAt < twoHoursAgo;
      const boostedScore = isRecent ? baseScore + 5 : baseScore;
      return {
        post,
        score: baseScore,
        boostedScore,
      };
    });

    // Ordenar posts não muito recentes: primeiro por boostedScore DESC, depois por createdAt DESC
    otherPostsWithScores.sort((a, b) => {
      if (b.boostedScore !== a.boostedScore) {
        return b.boostedScore - a.boostedScore;
      }
      return b.post.createdAt.getTime() - a.post.createdAt.getTime();
    });

    // Combinar: posts muito recentes primeiro, depois posts ordenados por engajamento
    const sortedNotViewed = [
      ...veryRecentPosts,
      ...otherPostsWithScores.map(item => item.post),
    ];

    // Ordenar posts de pessoas seguidas: apenas por createdAt DESC (mais recentes primeiro)
    followingNotViewed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Ordenar grupo visualizado: apenas por createdAt DESC
    viewed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Concatenar: posts de pessoas seguidas + posts não visualizados (geral) + posts visualizados
    // IMPORTANTE: Quando há poucos posts, mostrar TODOS para nunca zerar o feed
    const totalAvailablePosts = followingNotViewed.length + sortedNotViewed.length + viewed.length;
    
    let sortedPosts: any[] = [];
    let nextCursor: string | null = null;
    
    if (totalAvailablePosts <= limit) {
      // Poucos posts: mostrar TODOS (nunca zerar o feed)
      // Ordem: seguidos não visualizados + não visualizados + visualizados
      sortedPosts = [
        ...followingNotViewed,
        ...sortedNotViewed,
        ...viewed,
      ];
      // Não há mais páginas quando mostramos todos os posts
      nextCursor = null;
    } else {
      // Muitos posts: aplicar limites e paginação
      const followingCount = Math.min(followingNotViewed.length, Math.floor(limit * 0.3)); // 30% do feed
      const followingSlice = followingNotViewed.slice(0, followingCount);
      
      // Garantir que posts visualizados sempre apareçam, mesmo quando há cursor
      // Reservar espaço para posts visualizados (até 20% do feed)
      const viewedReserve = Math.floor(limit * 0.2);
      const availableForNonViewed = limit - followingSlice.length - viewedReserve;
      
      // Limitar posts não visualizados para deixar espaço para visualizados
      const nonViewedSlice = sortedNotViewed.slice(0, Math.max(0, availableForNonViewed));
      
      // Incluir posts visualizados (garantir que sempre apareçam)
      const viewedSlice = viewed.slice(0, viewedReserve);
      
      sortedPosts = [
        ...followingSlice,
        ...nonViewedSlice,
        ...viewedSlice,
      ];
      
      // Processar paginação
      // Se há mais posts não visualizados ou visualizados além do limite, definir cursor
      const hasMoreNonViewed = sortedNotViewed.length > nonViewedSlice.length;
      const hasMoreViewed = viewed.length > viewedSlice.length;
      const hasMore = hasMoreNonViewed || hasMoreViewed || (cursor && sortedPosts.length >= limit);
      
      nextCursor = hasMore && sortedPosts.length > 0 
        ? sortedPosts[sortedPosts.length - 1].id 
        : null;
    }
    
    const resultPosts = sortedPosts;

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

