import { prisma } from '@/lib/prisma/client';
import { pushNotificationService } from './push-notification-service';
import { notificationMessageService } from './notification-message-service';

/**
 * Serviço para gerenciar notificações de re-engajamento
 */
export class ReengagementNotificationService {
  /**
   * Busca usuários inativos há X dias
   */
  async findInactiveUsers(days: number = 7): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Emails de teste para filtrar (mesmo padrão da tela /admin)
    const testEmailPatterns = [
      'teste',
      'example',
      'ixospace',
      'atinjo',
      'akixpres',
      'gopicta',
      'feanzier',
    ];

    // Construir filtro para emails de teste
    const excludeTestEmailsFilter = {
      AND: [
        {
          email: {
            not: null,
          },
        },
        {
          NOT: {
            OR: testEmailPatterns.map(pattern => ({
              email: {
                contains: pattern,
                mode: 'insensitive' as const,
              },
            })),
          },
        },
      ],
    };

    // Buscar usuários que:
    // 1. Têm lastAccessAt anterior à data de corte OU não têm lastAccessAt mas createdAt é anterior
    // 2. Têm notificações ativas (subscription + preferences)
    // 3. Não receberam notificação de re-engajamento nas últimas 24 horas (evitar spam)
    // 4. Não são emails de teste

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        ...excludeTestEmailsFilter,
        OR: [
          { lastAccessAt: { lt: cutoffDate } },
          {
            lastAccessAt: null,
            createdAt: { lt: cutoffDate },
          },
        ],
        pushSubscriptions: {
          some: {}, // Tem pelo menos uma subscription
        },
        pushNotificationPreferences: {
          allEnabled: true, // Notificações habilitadas
        },
        // Não recebeu re-engajamento nas últimas 24h
        pushNotificationLogs: {
          none: {
            type: 'reengagement',
            sentAt: {
              gte: oneDayAgo,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    return users.map((u) => u.id);
  }

  /**
   * Envia notificação de re-engajamento para um usuário
   */
  async sendReengagementNotification(userId: string): Promise<boolean> {
    // Verificar preferências
    const preferences = await prisma.pushNotificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences || !preferences.allEnabled) {
      console.log(`[Reengagement] Usuário ${userId} não tem notificações habilitadas`);
      return false;
    }

    // Verificar rate limit (máx 1 por hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentNotification = await prisma.pushNotificationLog.findFirst({
      where: {
        userId,
        sentAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentNotification) {
      console.log(`[Reengagement] Usuário ${userId} excedeu rate limit`);
      return false;
    }

    // Obter mensagem com variação
    const message = await notificationMessageService.getMessageForUser(
      userId,
      'reengagement',
      {}
    );

    // Enviar notificação
    const success = await pushNotificationService.sendPushNotification(userId, {
      title: message.title,
      body: message.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        type: 'reengagement',
        url: message.url,
        variation: message.variation,
      },
    });

    if (success) {
      // Registrar log como reengagement
      await prisma.pushNotificationLog.create({
        data: {
          userId,
          type: 'reengagement',
        },
      });
    }

    return success;
  }

  /**
   * Envia notificações de re-engajamento para todos os usuários inativos
   */
  async sendToAllInactiveUsers(days: number = 7): Promise<{
    total: number;
    sent: number;
    failed: number;
  }> {
    const userIds = await this.findInactiveUsers(days);
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendReengagementNotification(userId))
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - sent;

    console.log(
      `[Reengagement] Enviadas ${sent} notificações de ${userIds.length} usuários inativos`
    );

    return {
      total: userIds.length,
      sent,
      failed,
    };
  }
}

export const reengagementNotificationService = new ReengagementNotificationService();

