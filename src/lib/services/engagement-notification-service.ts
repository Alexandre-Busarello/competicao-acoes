import { prisma } from '@/lib/prisma/client';
import { pushNotificationService } from './push-notification-service';

/**
 * Serviço para notificações de posts com bom engajamento
 */
export class EngagementNotificationService {
  /**
   * Envia notificações sobre posts com bom engajamento
   * Posts criados nas últimas 2-4 horas com score > threshold
   */
  async sendEngagementNotifications(): Promise<void> {
    try {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Buscar posts criados nas últimas 2-4 horas com bom engajamento
      const posts = await prisma.feedPost.findMany({
        where: {
          createdAt: {
            gte: fourHoursAgo,
            lte: twoHoursAgo, // Posts entre 2-4 horas atrás (dar tempo para engajamento)
          },
          deletedAt: null,
          isPublic: true,
        },
        include: {
          poll: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Limitar para não sobrecarregar
      });

      // Calcular score de engajamento para cada post
      const postsWithScore = posts.map(post => {
        const likes = post.likeCount || 0;
        const comments = post.commentCount || 0;
        const pollVotes = post.poll?.totalVotes || 0;
        const score = likes * 2 + comments * 3 + pollVotes * 1.5;
        return { post, score };
      });

      // Filtrar posts com score > 20 e selecionar top 3-5
      const topPosts = postsWithScore
        .filter(({ score }) => score > 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (topPosts.length === 0) {
        return;
      }

      // Buscar usuários que não viram esses posts ainda
      const userIds = await prisma.user.findMany({
        select: { id: true },
      });

      // Para cada post, enviar notificação para usuários que não viram
      for (const { post, score } of topPosts) {
        // Buscar usuários que já viram o post
        const viewers = await prisma.feedView.findMany({
          where: { postId: post.id },
          select: { userId: true },
        });
        const viewerIds = new Set(viewers.map(v => v.userId));

        // Selecionar alguns usuários aleatoriamente que não viram (máx 30% dos usuários)
        const eligibleUsers = userIds
          .filter(u => !viewerIds.has(u.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.ceil(userIds.length * 0.3));

        // Enviar notificação para cada usuário elegível
        for (const user of eligibleUsers) {
          pushNotificationService.sendEngagementNotification(user.id, {
            postId: post.id,
            postSlug: post.slug,
            engagementScore: score,
          }).catch(error => {
            console.error(`Erro ao enviar notificação de engajamento para usuário ${user.id}:`, error);
          });
        }
      }
    } catch (error) {
      console.error('Erro ao enviar notificações de engajamento:', error);
    }
  }
}

export const engagementNotificationService = new EngagementNotificationService();

