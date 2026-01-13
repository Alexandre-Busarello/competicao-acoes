import { prisma } from '@/lib/prisma/client';
import type { QueueAdapter, QueueItem, QueueStats } from './queue-adapter';

/**
 * Implementação de fila usando tabela ActionQueue no banco de dados
 * Usado quando fila externa não está disponível
 */
export class DatabaseQueueAdapter implements QueueAdapter {
  async enqueue(actionType: string, payload: any, priority: number = 0): Promise<string> {
    const action = await prisma.actionQueue.create({
      data: {
        actionType,
        payload,
        status: 'pending',
        priority,
        retryCount: 0,
        maxRetries: 3,
      },
    });

    return action.id;
  }

  async dequeue(limit: number): Promise<QueueItem[]> {
    // Busca ações pendentes ordenadas por prioridade e data de criação
    // Usa lock para evitar processamento simultâneo
    const workerId = `worker-${Date.now()}-${Math.random()}`;
    const lockTimeout = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos atrás

    // Remove locks expirados primeiro
    await prisma.actionQueue.updateMany({
      where: {
        status: 'processing',
        lockedAt: {
          lt: lockTimeout,
        },
      },
      data: {
        status: 'pending',
        lockedAt: null,
        lockedBy: null,
      },
    });

    // Busca ações pendentes e marca como processing com lock
    const actions = await prisma.actionQueue.findMany({
      where: {
        status: 'pending',
        retryCount: {
          lt: prisma.actionQueue.fields.maxRetries,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    // Marca como processing com lock
    const ids = actions.map(a => a.id);
    if (ids.length === 0) {
      return [];
    }

    await prisma.actionQueue.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'processing',
        lockedAt: new Date(),
        lockedBy: workerId,
      },
    });

    // Retorna ações atualizadas
    const updatedActions = await prisma.actionQueue.findMany({
      where: {
        id: { in: ids },
      },
    });

    return updatedActions.map(this.mapToQueueItem);
  }

  async markCompleted(id: string): Promise<void> {
    await prisma.actionQueue.update({
      where: { id },
      data: {
        status: 'completed',
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      },
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    const action = await prisma.actionQueue.findUnique({
      where: { id },
    });

    if (!action) {
      return;
    }

    const newRetryCount = action.retryCount + 1;
    const shouldFail = newRetryCount >= action.maxRetries;

    await prisma.actionQueue.update({
      where: { id },
      data: {
        status: shouldFail ? 'failed' : 'pending',
        retryCount: newRetryCount,
        errorMessage: error,
        lockedAt: null,
        lockedBy: null,
      },
    });
  }

  async getStats(): Promise<QueueStats> {
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.actionQueue.count({ where: { status: 'pending' } }),
      prisma.actionQueue.count({ where: { status: 'processing' } }),
      prisma.actionQueue.count({ where: { status: 'completed' } }),
      prisma.actionQueue.count({ where: { status: 'failed' } }),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      total: pending + processing + completed + failed,
    };
  }

  private mapToQueueItem(action: any): QueueItem {
    return {
      id: action.id,
      actionType: action.actionType,
      payload: action.payload as any,
      status: action.status as QueueItem['status'],
      priority: action.priority,
      retryCount: action.retryCount,
      maxRetries: action.maxRetries,
      errorMessage: action.errorMessage || undefined,
      processedAt: action.processedAt || undefined,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
      lockedAt: action.lockedAt || undefined,
      lockedBy: action.lockedBy || undefined,
    };
  }
}




