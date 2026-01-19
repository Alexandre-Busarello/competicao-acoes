import { prisma } from '@/lib/prisma/client';
import { cacheService } from '@/lib/cache/cache-service';

export type NotificationType = 'like' | 'comment' | 'reply';

export interface AggregatedNotification {
  id: string;
  type: NotificationType;
  postId: string;
  commentId?: string;
  post?: {
    slug: string;
    content: string;
  };
  count: number;
  actors: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
  }>;
  latestActor: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Serviço para gerenciar notificações internas com agregação
 */
export class InternalNotificationService {
  /**
   * Cria uma notificação individual (usado para respostas que não são agregadas)
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    actorId: string;
    postId?: string;
    commentId?: string;
    content?: string;
  }): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        actorId: data.actorId,
        postId: data.postId,
        commentId: data.commentId,
        content: data.content,
      },
    });

    // Invalidar cache
    await cacheService.delete(`notifications:unread:${data.userId}`);
    await cacheService.delete(`notifications:list:${data.userId}`);
  }

  /**
   * Cria ou atualiza notificação agregada
   * Para likes e comentários: agrupa por userId + postId + type em janela de 24h
   * Quando atualiza: marca como não lida e atualiza updatedAt para ir ao topo
   */
  async createOrUpdateAggregatedNotification(data: {
    userId: string;
    type: 'like' | 'comment';
    actorId: string;
    postId: string;
  }): Promise<void> {
    const { userId, type, actorId, postId } = data;

    // Janela de 24 horas para agregação
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Buscar notificação existente não lida dentro da janela de 24h
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        postId,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingNotification) {
      // Atualizar notificação existente: marcar como não lida e atualizar timestamp
      await prisma.notification.update({
        where: { id: existingNotification.id },
        data: {
          read: false,
          readAt: null,
          updatedAt: new Date(), // Atualiza para ir ao topo
        },
      });

      // Criar nova notificação individual para manter histórico e contagem
      await prisma.notification.create({
        data: {
          userId,
          type,
          actorId,
          postId,
        },
      });
    } else {
      // Criar nova notificação
      await prisma.notification.create({
        data: {
          userId,
          type,
          actorId,
          postId,
        },
      });
    }

    // Invalidar cache
    await cacheService.delete(`notifications:unread:${userId}`);
    await cacheService.delete(`notifications:list:${userId}`);
  }

  /**
   * Busca notificações do usuário agregadas
   */
  async getNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      read?: boolean;
    }
  ): Promise<AggregatedNotification[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    // Buscar todas as notificações do usuário
    const where: any = { userId };
    if (options?.read !== undefined) {
      where.read = options.read;
    }

    const allNotifications = await prisma.notification.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            slug: true,
            content: true,
          },
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Agrupar notificações por postId + type
    const grouped = new Map<string, typeof allNotifications>();

    for (const notification of allNotifications) {
      // Respostas não são agregadas
      if (notification.type === 'reply') {
        const key = `reply-${notification.id}`;
        grouped.set(key, [notification]);
      } else {
        // Likes e comentários são agregados por postId + type
        const key = `${notification.type}-${notification.postId || 'no-post'}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(notification);
      }
    }

    // Converter grupos em notificações agregadas
    const aggregated: AggregatedNotification[] = [];

    for (const [key, notifications] of grouped.entries()) {
      if (notifications.length === 0) continue;

      const first = notifications[0];
      const latest = notifications.reduce((latest, current) => {
        const latestTime = latest.updatedAt || latest.createdAt;
        const currentTime = current.updatedAt || current.createdAt;
        return currentTime > latestTime ? current : latest;
      });

      // Para respostas, não agregar
      if (first.type === 'reply') {
        aggregated.push({
          id: first.id,
          type: first.type,
          postId: first.postId || '',
          commentId: first.commentId || undefined,
          post: first.post ? {
            slug: first.post.slug,
            content: first.post.content,
          } : undefined,
          count: 1,
          actors: [{
            id: first.actor.id,
            name: first.actor.name,
            avatarUrl: first.actor.avatarUrl,
          }],
          latestActor: {
            id: first.actor.id,
            name: first.actor.name,
            avatarUrl: first.actor.avatarUrl,
          },
          read: first.read,
          readAt: first.readAt,
          createdAt: first.createdAt,
          updatedAt: first.updatedAt || first.createdAt,
        });
      } else {
        // Para likes e comentários, agregar
        const actors = notifications
          .map(n => ({
            id: n.actor.id,
            name: n.actor.name,
            avatarUrl: n.actor.avatarUrl,
          }))
          .filter((actor, index, self) =>
            index === self.findIndex(a => a.id === actor.id)
          )
          .slice(0, 3); // Últimos 3 atores únicos

        const latestActor = latest.actor;

        aggregated.push({
          id: latest.id, // Usar ID da notificação mais recente
          type: first.type as 'like' | 'comment',
          postId: first.postId || '',
          post: first.post ? {
            slug: first.post.slug,
            content: first.post.content,
          } : undefined,
          count: notifications.length,
          actors,
          latestActor: {
            id: latestActor.id,
            name: latestActor.name,
            avatarUrl: latestActor.avatarUrl,
          },
          read: latest.read, // Usar status da mais recente
          readAt: latest.readAt,
          createdAt: first.createdAt, // Data da primeira
          updatedAt: latest.updatedAt || latest.createdAt, // UpdatedAt da mais recente
        });
      }
    }

    // Ordenar por updatedAt DESC (mais recentes primeiro)
    aggregated.sort((a, b) => {
      const aTime = a.updatedAt.getTime();
      const bTime = b.updatedAt.getTime();
      return bTime - aTime;
    });

    // Aplicar paginação
    return aggregated.slice(offset, offset + limit);
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // Verificar se a notificação pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    // Marcar todas as notificações do mesmo grupo como lidas
    if (notification.type === 'reply') {
      // Respostas são individuais
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } else {
      // Para likes e comentários, marcar todas do mesmo post como lidas
      await prisma.notification.updateMany({
        where: {
          userId,
          type: notification.type,
          postId: notification.postId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    }

    // Invalidar cache
    await cacheService.delete(`notifications:unread:${userId}`);
    await cacheService.delete(`notifications:list:${userId}`);
  }

  /**
   * Marca todas as notificações do usuário como lidas
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    // Invalidar cache
    await cacheService.delete(`notifications:unread:${userId}`);
    await cacheService.delete(`notifications:list:${userId}`);
  }

  /**
   * Conta notificações não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `notifications:unread:${userId}`;
    
    // Tentar buscar do cache
    const cached = await cacheService.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Buscar notificações não lidas
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      select: {
        type: true,
        postId: true,
      },
    });

    // Agrupar para contar grupos únicos
    const groups = new Set<string>();
    for (const notification of notifications) {
      if (notification.type === 'reply') {
        groups.add(`reply-${notification.postId}`);
      } else {
        groups.add(`${notification.type}-${notification.postId || 'no-post'}`);
      }
    }

    const count = groups.size;

    // Cachear por 30 segundos
    await cacheService.set(cacheKey, count, 30);

    return count;
  }
}

export const internalNotificationService = new InternalNotificationService();


