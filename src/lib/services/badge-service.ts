import { checkBadgeSupport } from '@/lib/utils/push-notification-support';

/**
 * Serviço para atualizar badge no ícone do PWA
 */
export class BadgeService {
  /**
   * Atualiza badge com contagem de notificações não lidas
   */
  async updateBadge(count: number): Promise<void> {
    if (!checkBadgeSupport()) {
      // Silently fail se não suportar
      return;
    }

    try {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
    } catch (error) {
      console.warn('Erro ao atualizar badge:', error);
    }
  }

  /**
   * Limpa o badge
   */
  async clearBadge(): Promise<void> {
    if (!checkBadgeSupport()) {
      return;
    }

    try {
      await navigator.clearAppBadge();
    } catch (error) {
      console.warn('Erro ao limpar badge:', error);
    }
  }
}

export const badgeService = new BadgeService();

