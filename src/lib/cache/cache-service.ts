import { CacheAdapter } from './cache-adapter';
import { MemoryCacheAdapter } from './memory-cache-adapter';
import { RedisCacheAdapter } from './redis-cache-adapter';
import { cacheConfig } from '../config/cache';

/**
 * Serviço unificado de cache
 * Escolhe automaticamente o adapter baseado em configuração
 * Permite migração transparente entre Memory e Redis
 */
class CacheService {
  private adapter: CacheAdapter;

  constructor() {
    const provider = cacheConfig.provider;
    
    if (provider === 'redis' && cacheConfig.redis.url) {
      try {
        this.adapter = new RedisCacheAdapter();
      } catch (error) {
        // Fallback para memory se Redis não estiver configurado
        console.warn('Redis not available, falling back to memory cache:', error);
        this.adapter = new MemoryCacheAdapter(
          cacheConfig.memory.maxSize,
          cacheConfig.memory.cleanupInterval
        );
      }
    } else {
      this.adapter = new MemoryCacheAdapter(
        cacheConfig.memory.maxSize,
        cacheConfig.memory.cleanupInterval
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.adapter.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.adapter.exists(key);
  }

  async clear(pattern?: string): Promise<void> {
    return this.adapter.clear(pattern);
  }
}

// Singleton instance
export const cacheService = new CacheService();




