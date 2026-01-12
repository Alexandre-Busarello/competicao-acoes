/**
 * Configuração de cache
 */
export const cacheConfig = {
  provider: process.env.CACHE_PROVIDER || 'memory', // 'memory' | 'redis'
  redis: {
    url: process.env.REDIS_URL,
    ttl: {
      default: 3600, // 1 hora
      profitability: 86400, // 1 dia
      feed: 300, // 5 minutos
      notifications: 60, // 1 minuto
      stats: 900, // 15 minutos
    }
  },
  memory: {
    maxSize: 1000, // máximo de entradas em memória
    cleanupInterval: 60000, // limpeza a cada 1 minuto
  }
};


