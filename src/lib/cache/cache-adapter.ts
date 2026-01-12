/**
 * Interface abstrata para adaptadores de cache
 * Permite trocar entre implementações (Memory, Redis, etc) sem mudar código dos serviços
 */
export interface CacheAdapter {
  /**
   * Busca um valor do cache
   * @param key Chave do cache
   * @returns Valor encontrado ou null se não existir
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Armazena um valor no cache
   * @param key Chave do cache
   * @param value Valor a ser armazenado
   * @param ttlSeconds Tempo de vida em segundos (opcional)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Remove uma chave do cache
   * @param key Chave a ser removida
   */
  delete(key: string): Promise<void>;

  /**
   * Verifica se uma chave existe no cache
   * @param key Chave a ser verificada
   * @returns true se existe, false caso contrário
   */
  exists(key: string): Promise<boolean>;

  /**
   * Limpa chaves do cache baseado em um padrão
   * @param pattern Padrão para buscar chaves (ex: "feed:userId:*")
   */
  clear(pattern?: string): Promise<void>;
}


