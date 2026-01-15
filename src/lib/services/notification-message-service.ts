import { prisma } from '@/lib/prisma/client';

export type NotificationType =
  | 'ranking_top3'
  | 'ranking_up'
  | 'ranking_down'
  | 'engagement'
  | 'following'
  | 'reengagement'
  | 'interaction_like'
  | 'interaction_comment'
  | 'manual';

export type Variation = 'A' | 'B' | 'C' | 'D' | 'F';

export interface NotificationData {
  // Ranking
  previousPosition?: number;
  currentPosition?: number;
  period?: 'mensal' | 'anual';
  // Engagement/Following
  postId?: string;
  postTitle?: string;
  authorName?: string;
  authorId?: string;
  postPreview?: string;
  engagementScore?: number;
  // Interactions
  actorName?: string;
  commentPreview?: string;
  // Manual
  customUrl?: string;
}

/**
 * Serviço para gerenciar variações de mensagens de notificação
 */
export class NotificationMessageService {
  /**
   * Obtém a variação para um usuário baseado em round-robin
   */
  async getVariation(userId: string, type: NotificationType): Promise<Variation> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationVariationIndex: true },
    });

    if (!user) {
      return 'A'; // Default
    }

    // Buscar variações ativas para este tipo
    const variations = await prisma.notificationMessageVariation.findMany({
      where: {
        type,
        isActive: true,
      },
      orderBy: { variation: 'asc' },
    });

    if (variations.length === 0) {
      return 'A'; // Fallback
    }

    // Round-robin: usar índice do usuário módulo número de variações
    const index = user.notificationVariationIndex % variations.length;
    const variation = variations[index];

    return variation.variation as Variation;
  }

  /**
   * Obtém a mensagem completa (título e corpo) para um tipo e variação
   */
  async getMessage(
    type: NotificationType,
    variation: Variation,
    data: NotificationData
  ): Promise<{ title: string; body: string; url: string }> {
    // Buscar variação no banco
    const messageVariation = await prisma.notificationMessageVariation.findUnique({
      where: {
        type_variation: {
          type,
          variation,
        },
      },
    });

    if (messageVariation) {
      // Substituir placeholders dinâmicos
      let title = messageVariation.title;
      let body = messageVariation.body;

      // Placeholders para ranking
      if (data.currentPosition !== undefined) {
        const medal =
          data.currentPosition === 1
            ? '🥇'
            : data.currentPosition === 2
            ? '🥈'
            : '🥉';
        title = title.replace('{medal}', medal);
        body = body
          .replace('{position}', data.currentPosition.toString())
          .replace('{period}', data.period === 'mensal' ? 'mensal' : 'anual');
      }

      if (data.previousPosition !== undefined && data.currentPosition !== undefined) {
        const positions = Math.abs(data.previousPosition - data.currentPosition);
        body = body.replace('{positions}', positions.toString());
      }

      // Placeholders para engagement/following
      if (data.postTitle) {
        body = body.replace('{postTitle}', data.postTitle);
      }
      if (data.authorName) {
        body = body.replace('{authorName}', data.authorName);
      }
      if (data.engagementScore !== undefined) {
        body = body.replace('{score}', data.engagementScore.toString());
      }
      // Placeholders para interações
      if (data.actorName) {
        title = title.replace('{actorName}', data.actorName);
        body = body.replace('{actorName}', data.actorName);
      }
      if (data.commentPreview) {
        body = body.replace('{commentPreview}', data.commentPreview);
      }

      // Determinar URL baseada no tipo
      const url = this.getUrlForType(type, data);

      return { title, body, url };
    }

    // Fallback para mensagens padrão se não encontrar variação
    return this.getDefaultMessage(type, data);
  }

  /**
   * Incrementa o índice de variação do usuário (round-robin)
   */
  async incrementVariationIndex(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationVariationIndex: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Obtém todas as variações ativas de um tipo
   */
  async getAllVariations(type: NotificationType): Promise<Variation[]> {
    const variations = await prisma.notificationMessageVariation.findMany({
      where: {
        type,
        isActive: true,
      },
      orderBy: { variation: 'asc' },
      select: { variation: true },
    });

      return variations.map((v: { variation: string }) => v.variation as Variation);
  }

  /**
   * Obtém mensagem completa para um usuário (com round-robin)
   */
  async getMessageForUser(
    userId: string,
    type: NotificationType,
    data: NotificationData
  ): Promise<{ title: string; body: string; url: string; variation: Variation }> {
    const variation = await this.getVariation(userId, type);
    const message = await this.getMessage(type, variation, data);

    // Incrementar índice para próximo round-robin
    await this.incrementVariationIndex(userId);

    return { ...message, variation };
  }

  /**
   * Determina URL baseada no tipo de notificação
   */
  private getUrlForType(type: NotificationType, data: NotificationData): string {
    switch (type) {
      case 'ranking_top3':
      case 'ranking_up':
      case 'ranking_down':
        return '/ranking';
      case 'engagement':
      case 'following':
        return data.postId ? `/feed/${data.postId}` : '/feed';
      case 'interaction_like':
      case 'interaction_comment':
        return data.postId ? `/posts/${data.postId}` : '/feed';
      case 'reengagement':
        return '/'; // Home
      case 'manual':
        return data.customUrl || '/';
      default:
        return '/';
    }
  }

  /**
   * Mensagens padrão (fallback se não houver variações no banco)
   */
  private getDefaultMessage(
    type: NotificationType,
    data: NotificationData
  ): { title: string; body: string; url: string } {
    const url = this.getUrlForType(type, data);

    switch (type) {
      case 'ranking_top3': {
        const medal =
          data.currentPosition === 1
            ? '🥇'
            : data.currentPosition === 2
            ? '🥈'
            : '🥉';
        return {
          title: `${medal} Parabéns! Você entrou no top 3!`,
          body: `Você está na ${data.currentPosition}ª posição no ranking ${data.period === 'mensal' ? 'mensal' : 'anual'}`,
          url,
        };
      }
      case 'ranking_up': {
        const positions = data.previousPosition && data.currentPosition
          ? data.previousPosition - data.currentPosition
          : 0;
        return {
          title: '📈 Subiu no ranking!',
          body: `Você subiu ${positions} posição${positions > 1 ? 'ões' : ''} e agora está na ${data.currentPosition}ª posição`,
          url,
        };
      }
      case 'ranking_down': {
        const positions = data.previousPosition && data.currentPosition
          ? data.currentPosition - data.previousPosition
          : 0;
        return {
          title: '📉 Atenção: Desceu no ranking',
          body: `Você desceu ${positions} posição${positions > 1 ? 'ões' : ''} e agora está na ${data.currentPosition}ª posição`,
          url,
        };
      }
      case 'engagement':
        return {
          title: '🔥 Post em alta!',
          body: data.postTitle
            ? `"${data.postTitle}" está gerando muito engajamento!`
            : 'Um post está gerando muito engajamento!',
          url,
        };
      case 'following':
        return {
          title: '👤 Nova publicação',
          body: data.authorName
            ? `${data.authorName} publicou algo novo`
            : 'Alguém que você segue publicou algo novo',
          url,
        };
      case 'reengagement':
        return {
          title: '🎁 Tem um prêmio esperando por você!',
          body: 'Volte e descubra o que mudou na plataforma',
          url,
        };
      case 'interaction_like':
        return {
          title: data.actorName
            ? `👍 ${data.actorName} curtiu seu post`
            : '👍 Alguém curtiu seu post',
          body: data.postTitle
            ? `"${data.postTitle}" recebeu uma nova curtida`
            : 'Seu post recebeu uma nova curtida',
          url,
        };
      case 'interaction_comment':
        return {
          title: data.actorName
            ? `💬 ${data.actorName} comentou no seu post`
            : '💬 Alguém comentou no seu post',
          body: data.commentPreview
            ? data.commentPreview
            : data.postTitle
            ? `Novo comentário em "${data.postTitle}"`
            : 'Seu post recebeu um novo comentário',
          url,
        };
      case 'manual':
        return {
          title: '📢 Nova notificação',
          body: 'Você tem uma nova notificação',
          url,
        };
      default:
        return {
          title: 'Hold Arena',
          body: 'Você tem uma nova notificação',
          url: '/',
        };
    }
  }
}

export const notificationMessageService = new NotificationMessageService();

