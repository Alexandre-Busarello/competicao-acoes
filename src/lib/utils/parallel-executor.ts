/**
 * Utilitário para executar tarefas em paralelo com controle de concorrência
 * Evita sobrecarregar recursos (banco de dados, APIs externas, etc.)
 */

export interface ParallelExecutorOptions {
  /**
   * Número máximo de tarefas executadas simultaneamente
   * Padrão: 10
   */
  concurrency?: number;
  
  /**
   * Delay mínimo entre execuções (em ms)
   * Útil para evitar rate limiting em APIs externas
   * Padrão: 0
   */
  minDelay?: number;
  
  /**
   * Delay máximo aleatório adicional (em ms)
   * Adiciona jitter para evitar sincronização de requisições
   * Padrão: 0
   */
  maxJitter?: number;
}

/**
 * Executa um array de tarefas em paralelo com controle de concorrência
 * 
 * @param tasks Array de funções que retornam Promises
 * @param options Opções de configuração
 * @returns Array de resultados na mesma ordem das tarefas
 */
export async function executeInParallel<T>(
  tasks: Array<() => Promise<T>>,
  options: ParallelExecutorOptions = {}
): Promise<Array<{ success: boolean; result?: T; error?: Error; index: number }>> {
  const {
    concurrency = 10,
    minDelay = 0,
    maxJitter = 0,
  } = options;

  const results: Array<{ success: boolean; result?: T; error?: Error; index: number }> = [];
  const executing: Promise<void>[] = [];
  let currentIndex = 0;

  const executeTask = async (index: number): Promise<void> => {
    // Adiciona delay progressivo com jitter para evitar sincronização
    if (minDelay > 0 || maxJitter > 0) {
      const delay = minDelay + (maxJitter > 0 ? Math.random() * maxJitter : 0);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    try {
      const result = await tasks[index]();
      results[index] = { success: true, result, index };
    } catch (error) {
      results[index] = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        index,
      };
    }
  };

  // Executa tarefas com controle de concorrência
  console.log(`[ParallelExecutor] Iniciando execução de ${tasks.length} tarefas com concorrência ${concurrency}`);
  while (currentIndex < tasks.length || executing.length > 0) {
    // Inicia novas tarefas até atingir o limite de concorrência
    while (executing.length < concurrency && currentIndex < tasks.length) {
      const taskIndex = currentIndex++;
      if (taskIndex < 3 || taskIndex % 5 === 0) {
        console.log(`[ParallelExecutor] Iniciando tarefa ${taskIndex + 1}/${tasks.length} (${executing.length + 1} executando simultaneamente)`);
      }
      const promise = executeTask(taskIndex).then(() => {
        // Remove da lista de executando quando completa
        const index = executing.indexOf(promise);
        if (index > -1) {
          executing.splice(index, 1);
        }
      });
      executing.push(promise);
    }

    // Aguarda pelo menos uma tarefa completar antes de iniciar novas
    if (executing.length > 0) {
      await Promise.race(executing);
    }
  }

  // Garante que todas as tarefas foram executadas
  await Promise.all(executing);

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;
  console.log(`[ParallelExecutor] Execução concluída: ${successCount} sucessos, ${errorCount} erros`);

  return results;
}

/**
 * Executa tarefas em paralelo e retorna apenas os resultados bem-sucedidos
 */
export async function executeInParallelSuccessOnly<T>(
  tasks: Array<() => Promise<T>>,
  options: ParallelExecutorOptions = {}
): Promise<T[]> {
  const results = await executeInParallel(tasks, options);
  return results
    .filter(r => r.success && r.result !== undefined)
    .map(r => r.result!);
}

/**
 * Executa tarefas em paralelo e retorna resultados e erros separados
 */
export async function executeInParallelWithErrors<T>(
  tasks: Array<() => Promise<T>>,
  options: ParallelExecutorOptions = {}
): Promise<{
  successes: T[];
  errors: Array<{ index: number; error: Error }>;
}> {
  const results = await executeInParallel(tasks, options);
  const successes: T[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  for (const result of results) {
    if (result.success && result.result !== undefined) {
      successes.push(result.result);
    } else if (result.error) {
      errors.push({ index: result.index, error: result.error });
    }
  }

  return { successes, errors };
}

/**
 * Processa itens em lotes (chunks) com paralelismo controlado
 * Útil para processar grandes arrays sem sobrecarregar recursos
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: ParallelExecutorOptions = {}
): Promise<Array<{ success: boolean; result?: R; error?: Error; index: number }>> {
  const tasks = items.map((item, index) => () => processor(item, index));
  return executeInParallel(tasks, options);
}

