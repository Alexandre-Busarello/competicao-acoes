import * as webpush from 'web-push';
import { prisma } from '@/lib/prisma/client';
import { notificationMessageService } from './notification-message-service';

// Configurar VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@holdarena.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('⚠️ VAPID keys não configuradas. Notificações push não funcionarão.');
}

export interface RankingNotificationData {
  previousPosition: number;
  currentPosition: number;
  changeType: 'top3' | 'up' | 'down';
  period: 'mensal' | 'anual';
}

export interface EngagementNotificationData {
  postId: string;
  postSlug?: string;
  postTitle?: string;
  engagementScore: number;
}

export interface FollowingNotificationData {
  postId: string;
  postSlug?: string;
  authorId: string;
  authorName: string;
  postPreview?: string;
}

export interface InteractionNotificationData {
  postId: string;
  postSlug?: string;
  actorId: string;
  actorName: string;
  interactionType: 'like' | 'comment';
  postTitle?: string;
  commentPreview?: string;
}

/**
 * Serviço para gerenciar notificações push
 */
export class PushNotificationService {
  /**
   * Verifica se pode enviar notificação (rate limit: máx 1/hora)
   */
  async checkRateLimit(userId: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentNotification = await prisma.pushNotificationLog.findFirst({
      where: {
        userId,
        sentAt: {
          gte: oneHourAgo,
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return !recentNotification;
  }

  /**
   * Verifica se pode enviar notificação de interação (rate limit: máx 1 a cada 15 minutos)
   */
  async checkInteractionRateLimit(userId: string): Promise<boolean> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const recentInteractionNotification = await prisma.pushNotificationLog.findFirst({
      where: {
        userId,
        type: 'interactions',
        sentAt: {
          gte: fifteenMinutesAgo,
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return !recentInteractionNotification;
  }

  /**
   * Verifica se usuário tem preferência habilitada para tipo de notificação
   */
  async checkPreferences(userId: string, type: 'ranking' | 'engagement' | 'following' | 'interactions'): Promise<boolean> {
    const preferences = await prisma.pushNotificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Se não tem preferências, criar com padrões (todos habilitados)
      await prisma.pushNotificationPreferences.create({
        data: {
          userId,
          rankingEnabled: true,
          engagementEnabled: true,
          followingEnabled: true,
          interactionsEnabled: true,
          allEnabled: true,
        },
      });
      return true;
    }

    // Se allEnabled está desabilitado, não enviar nenhuma
    if (!preferences.allEnabled) {
      return false;
    }

    // Verificar preferência específica do tipo
    switch (type) {
      case 'ranking':
        return preferences.rankingEnabled;
      case 'engagement':
        return preferences.engagementEnabled;
      case 'following':
        return preferences.followingEnabled;
      case 'interactions':
        return preferences.interactionsEnabled;
      default:
        return false;
    }
  }

  /**
   * Envia notificação push para um usuário
   */
  async sendPushNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: any;
    }
  ): Promise<boolean> {
    try {
      // Buscar apenas subscriptions ativas do usuário
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { 
          userId,
          enabled: true,
        },
      });

      if (subscriptions.length === 0) {
        console.log(`[PushNotification] Usuário ${userId} não tem subscriptions ativas registradas`);
        return false;
      }

      console.log(`[PushNotification] Encontradas ${subscriptions.length} subscription(s) ativa(s) para usuário ${userId}`);

      // Preparar payload da notificação (garantir que URL está incluída)
      const notificationData = {
        ...payload.data,
        url: payload.data?.url || '/', // Sempre incluir URL
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-192x192.png',
        data: notificationData,
      });

      // Enviar para todas as subscriptions do usuário
      const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
          try {
            console.log(`[PushNotification] Enviando notificação para endpoint: ${subscription.endpoint.substring(0, 50)}...`);
            console.log(`[PushNotification] Payload:`, notificationPayload);
            
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: subscription.keys as any,
              },
              notificationPayload
            );
            
            console.log(`[PushNotification] ✅ Notificação enviada com sucesso para endpoint`);
            return true;
          } catch (error: any) {
            console.error(`[PushNotification] ❌ Erro ao enviar notificação:`, {
              statusCode: error.statusCode,
              message: error.message,
              endpoint: subscription.endpoint.substring(0, 50),
            });
            
            // Se subscription inválida (410 Gone), remover do banco
            if (error.statusCode === 410) {
              console.log(`[PushNotification] Removendo subscription inválida (410 Gone): ${subscription.endpoint}`);
              await prisma.pushSubscription.delete({
                where: { endpoint: subscription.endpoint },
              });
            }
            throw error;
          }
        })
      );

      // Verificar resultados
      const successCount = results.filter(
        (r) => r.status === 'fulfilled'
      ).length;
      
      const failureCount = results.filter(
        (r) => r.status === 'rejected'
      ).length;

      console.log(`[PushNotification] Resultados: ${successCount} sucesso, ${failureCount} falhas de ${subscriptions.length} subscriptions`);

      // Log detalhado de falhas
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[PushNotification] Falha na subscription ${index + 1}:`, result.reason);
        }
      });

      if (successCount > 0) {
        // Registrar no log
        await prisma.pushNotificationLog.create({
          data: {
            userId,
            type: payload.data?.type || 'unknown',
          },
        });
        return true;
      }

      console.log(`[PushNotification] ❌ Nenhuma notificação foi enviada com sucesso`);
      return false;
    } catch (error) {
      console.error(`Erro ao enviar notificação push para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de ranking
   */
  async sendRankingNotification(
    userId: string,
    data: RankingNotificationData,
    options?: { skipRateLimit?: boolean }
  ): Promise<boolean> {
    // Verificar preferências
    const hasPreferences = await this.checkPreferences(userId, 'ranking');
    if (!hasPreferences) {
      console.log(`[PushNotification] Usuário ${userId} não tem preferências de ranking habilitadas`);
      return false;
    }

    // Verificar rate limit (a menos que seja teste)
    if (!options?.skipRateLimit) {
      const canSend = await this.checkRateLimit(userId);
      if (!canSend) {
        console.log(`[PushNotification] Usuário ${userId} excedeu o rate limit (máx 1/hora)`);
        return false;
      }
    } else {
      console.log(`[PushNotification] Rate limit ignorado para teste (usuário ${userId})`);
    }

    // Determinar tipo de notificação para variações
    const notificationType =
      data.changeType === 'top3'
        ? 'ranking_top3'
        : data.changeType === 'up'
        ? 'ranking_up'
        : 'ranking_down';

    // Obter mensagem com variação (round-robin)
    const message = await notificationMessageService.getMessageForUser(userId, notificationType, {
      previousPosition: data.previousPosition,
      currentPosition: data.currentPosition,
      period: data.period,
    });

    return this.sendPushNotification(userId, {
      title: message.title,
      body: message.body,
      data: {
        type: 'ranking',
        url: message.url,
        variation: message.variation,
        ...data,
      },
    });
  }

  /**
   * Envia notificação de engajamento
   */
  async sendEngagementNotification(
    userId: string,
    data: EngagementNotificationData
  ): Promise<boolean> {
    // Verificar preferências
    if (!(await this.checkPreferences(userId, 'engagement'))) {
      return false;
    }

    // Verificar rate limit
    if (!(await this.checkRateLimit(userId))) {
      return false;
    }

    // Obter mensagem com variação (round-robin)
    const message = await notificationMessageService.getMessageForUser(userId, 'engagement', {
      postId: data.postId,
      postSlug: data.postSlug,
      postTitle: data.postTitle,
      engagementScore: data.engagementScore,
    });

    return this.sendPushNotification(userId, {
      title: message.title,
      body: message.body,
      data: {
        type: 'engagement',
        url: message.url,
        variation: message.variation,
        ...data,
      },
    });
  }

  /**
   * Envia notificação de post de pessoa seguida
   */
  async sendFollowingNotification(
    userId: string,
    data: FollowingNotificationData
  ): Promise<boolean> {
    // Verificar preferências
    if (!(await this.checkPreferences(userId, 'following'))) {
      return false;
    }

    // Verificar rate limit
    if (!(await this.checkRateLimit(userId))) {
      return false;
    }

    // Obter mensagem com variação (round-robin)
    const message = await notificationMessageService.getMessageForUser(userId, 'following', {
      postId: data.postId,
      postSlug: data.postSlug,
      authorName: data.authorName,
      postPreview: data.postPreview,
    });

    return this.sendPushNotification(userId, {
      title: message.title,
      body: message.body,
      data: {
        type: 'following',
        url: message.url,
        variation: message.variation,
        ...data,
      },
    });
  }

  /**
   * Envia notificação de interação (like ou comentário)
   * Rate limit: máximo 1 notificação a cada 15 minutos para evitar spam
   */
  async sendInteractionNotification(
    userId: string,
    data: InteractionNotificationData
  ): Promise<boolean> {
    console.log('[sendInteractionNotification] Iniciando para userId:', userId, 'data:', data);

    // Verificar preferências
    const hasPreferences = await this.checkPreferences(userId, 'interactions');
    console.log('[sendInteractionNotification] Preferências verificadas:', hasPreferences);
    
    if (!hasPreferences) {
      console.log('[sendInteractionNotification] Preferências não habilitadas para userId:', userId);
      return false;
    }

    // Verificar rate limit específico para interações (15 minutos)
    const canSend = await this.checkInteractionRateLimit(userId);
    console.log('[sendInteractionNotification] Rate limit verificado (15min):', canSend);
    
    if (!canSend) {
      console.log('[sendInteractionNotification] Rate limit excedido para userId (última interação há menos de 15min):', userId);
      return false;
    }

    // Determinar tipo de notificação para variações
    const notificationType = data.interactionType === 'like' ? 'interaction_like' : 'interaction_comment';
    console.log('[sendInteractionNotification] Tipo de notificação:', notificationType);

    // Obter mensagem com variação (round-robin)
    const message = await notificationMessageService.getMessageForUser(userId, notificationType as any, {
      postId: data.postId,
      postSlug: data.postSlug,
      actorName: data.actorName,
      postTitle: data.postTitle,
      commentPreview: data.commentPreview,
    });
    console.log('[sendInteractionNotification] Mensagem obtida:', message);

    const result = await this.sendPushNotification(userId, {
      title: message.title,
      body: message.body,
      data: {
        type: 'interactions',
        url: message.url,
        variation: message.variation,
        ...data,
      },
    });
    
    console.log('[sendInteractionNotification] Resultado final:', result);
    return result;
  }

  /**
   * Envia notificação de teste
   */
  async sendTestNotification(userId: string): Promise<boolean> {
    return this.sendPushNotification(userId, {
      title: '✅ Notificação de teste',
      body: 'Se você recebeu isso, as notificações push estão funcionando!',
      data: {
        type: 'test',
        url: '/perfil/notificacoes',
      },
    });
  }
}

export const pushNotificationService = new PushNotificationService();

