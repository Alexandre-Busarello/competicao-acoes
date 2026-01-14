import { prisma } from '@/lib/prisma/client';
import { cacheService } from '@/lib/cache/cache-service';
import { cacheConfig } from '@/lib/config/cache';
import type { FeedPost } from './feed-service';
import { rankingService } from './ranking-service';
import { perpetualProfitabilityService } from './perpetual-profitability-service';
import { medalService } from './medal-service';
import { getCurrentPeriod } from '@/lib/utils/period-utils';
import { obfuscateTickerInMessage, obfuscateTickerInTransaction } from '@/lib/utils/obfuscate-ticker';

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
   * Enriquece posts com informações de ranking e rentabilidade perpétua
   * Busca em batch para otimizar performance
   */
  protected async enrichWithRankingsAndProfitability(
    posts: FeedPost[]
  ): Promise<FeedPost[]> {
    if (posts.length === 0) {
      return posts;
    }

    // Coletar IDs únicos de usuários
    const userIds = [...new Set(posts.map(p => p.userId))];

    // Buscar rankings e rentabilidade em paralelo
    const currentPeriod = getCurrentPeriod();
    
    // Buscar rankings mensal e anual vigentes
    const [monthlyRanking, annualRanking] = await Promise.all([
      rankingService.getRanking('mensal', currentPeriod.year, currentPeriod.month).catch(() => null),
      rankingService.getRanking('anual', currentPeriod.year).catch(() => null),
    ]);

    // Criar mapas de ranking e rentabilidade por userId
    const monthlyRankMap = new Map<string, number>();
    const annualRankMap = new Map<string, number>();
    const monthlyReturnMap = new Map<string, number>();
    const annualReturnMap = new Map<string, number>();

    if (monthlyRanking) {
      monthlyRanking.ranking.forEach((entry: any) => {
        monthlyRankMap.set(entry.userId, entry.rank);
        monthlyReturnMap.set(entry.userId, entry.monthlyReturn);
      });
    }

    if (annualRanking) {
      annualRanking.ranking.forEach((entry: any) => {
        annualRankMap.set(entry.userId, entry.rank);
        annualReturnMap.set(entry.userId, entry.annualReturn || entry.monthlyReturn);
      });
    }

    // Buscar rentabilidades perpétuas em batch (com cache)
    const profitabilityPromises = userIds.map(async (userId) => {
      try {
        const profitability = await perpetualProfitabilityService.getOrCalculateProfitability(userId);
        return { userId, profitability: profitability.profitability };
      } catch (error) {
        console.error(`Error fetching profitability for user ${userId}:`, error);
        return { userId, profitability: 0 };
      }
    });

    const profitabilityResults = await Promise.all(profitabilityPromises);
    const profitabilityMap = new Map<string, number>();
    profitabilityResults.forEach(({ userId, profitability }) => {
      profitabilityMap.set(userId, profitability);
    });

    // Buscar medalhas em batch
    const medalPromises = userIds.map(async (userId) => {
      try {
        const medals = await medalService.getUserMedals(userId);
        return { userId, medals: medals.total };
      } catch (error) {
        console.error(`Error fetching medals for user ${userId}:`, error);
        return { userId, medals: { gold: 0, silver: 0, bronze: 0, total: 0 } };
      }
    });

    const medalResults = await Promise.all(medalPromises);
    const medalMap = new Map<string, { gold: number; silver: number; bronze: number; total: number }>();
    medalResults.forEach(({ userId, medals }) => {
      medalMap.set(userId, medals);
    });

    // Enriquecer posts com rankings, rentabilidades e medalhas
    return posts.map(post => ({
      ...post,
      rankings: {
        monthly: monthlyRankMap.get(post.userId) || null,
        annual: annualRankMap.get(post.userId) || null,
        monthlyReturn: monthlyReturnMap.get(post.userId) || null,
        annualReturn: annualReturnMap.get(post.userId) || null,
      },
      profitability: profitabilityMap.get(post.userId),
      medals: medalMap.get(post.userId),
    }));
  }

  /**
   * Verifica se o usuário visualizador é PRO/PREMIUM
   */
  protected async isUserPremium(userId?: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
        },
      });

      if (!user) {
        return false;
      }

      // Verificar se tem assinatura ativa baseado na data de expiração
      if (user.subscription) {
        return (
          user.subscription.status === 'active' &&
          user.subscription.currentPeriodEnd !== null &&
          user.subscription.currentPeriodEnd > new Date()
        );
      }

      // Se não existe subscription, usar isPremium como fallback
      return user.isPremium;
    } catch (error) {
      console.error(`Error checking premium status for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Aplica ofuscação de ticker nos posts quando o usuário visualizador não é PRO
   */
  protected async applyObfuscationIfNeeded(
    posts: FeedPost[],
    currentUserId?: string
  ): Promise<FeedPost[]> {
    if (posts.length === 0) {
      return posts;
    }

    // Se não há usuário logado ou é PRO, não ofuscar
    const isPremium = await this.isUserPremium(currentUserId);
    if (isPremium) {
      return posts;
    }

    // Aplicar ofuscação em posts com transação
    return posts.map(post => {
      if (!post.transaction || !post.transaction.ticker) {
        return post;
      }

      const ticker = post.transaction.ticker;
      const price = post.transaction.price;
      
      // Ofuscar no conteúdo da mensagem (ticker e preço)
      const obfuscatedContent = obfuscateTickerInMessage(post.content, ticker, price);
      
      // Ofuscar no objeto transaction
      const obfuscatedTransaction = obfuscateTickerInTransaction(post.transaction);

      return {
        ...post,
        content: obfuscatedContent,
        transaction: obfuscatedTransaction,
      };
    });
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

