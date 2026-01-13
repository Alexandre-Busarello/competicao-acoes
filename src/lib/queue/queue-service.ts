import { DatabaseQueueAdapter } from './database-queue-adapter';
import type { QueueAdapter } from './queue-adapter';

/**
 * Serviço unificado de fila
 * Escolhe automaticamente o adapter baseado em configuração
 * Permite migração transparente entre Database e filas externas
 */
class QueueService {
  private adapter: QueueAdapter;

  constructor() {
    const provider = process.env.QUEUE_PROVIDER || 'database';
    
    if (provider === 'database') {
      this.adapter = new DatabaseQueueAdapter();
    } else {
      // TODO: Implementar outros adapters (RabbitMQ, SQS, Redis) no futuro
      // Por enquanto, usa database como fallback
      this.adapter = new DatabaseQueueAdapter();
    }
  }

  async enqueue(actionType: string, payload: any, priority?: number): Promise<string> {
    return this.adapter.enqueue(actionType, payload, priority);
  }

  async dequeue(limit: number) {
    return this.adapter.dequeue(limit);
  }

  async markCompleted(id: string): Promise<void> {
    return this.adapter.markCompleted(id);
  }

  async markFailed(id: string, error: string): Promise<void> {
    return this.adapter.markFailed(id, error);
  }

  async getStats() {
    return this.adapter.getStats();
  }
}

export const queueService = new QueueService();





