/**
 * Interface abstrata para adaptadores de fila
 * Permite trocar entre implementações (Database, RabbitMQ, SQS, Redis) sem mudar código dos serviços
 */
export interface QueueItem {
  id: string;
  actionType: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lockedAt?: Date;
  lockedBy?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export interface QueueAdapter {
  /**
   * Adiciona ação à fila
   * @param actionType Tipo da ação ('like' | 'comment' | 'follow' | etc)
   * @param payload Dados da ação
   * @param priority Prioridade (maior = mais prioritário, padrão: 0)
   * @returns ID da ação enfileirada
   */
  enqueue(actionType: string, payload: any, priority?: number): Promise<string>;

  /**
   * Remove ações da fila para processamento
   * @param limit Número máximo de ações a remover
   * @returns Array de ações removidas
   */
  dequeue(limit: number): Promise<QueueItem[]>;

  /**
   * Marca ação como completada
   * @param id ID da ação
   */
  markCompleted(id: string): Promise<void>;

  /**
   * Marca ação como falhada
   * @param id ID da ação
   * @param error Mensagem de erro
   */
  markFailed(id: string, error: string): Promise<void>;

  /**
   * Obtém estatísticas da fila
   */
  getStats(): Promise<QueueStats>;
}





