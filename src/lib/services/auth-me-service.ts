'use client';

import type { AuthUser } from '@/lib/auth/client';

const CACHE_KEY = 'auth_me_cache';
const CACHE_TIMESTAMP_KEY = 'auth_me_cache_timestamp';
const CACHE_DURATION_MS = 10 * 1000; // 10 segundos

interface CacheData {
  user: AuthUser | null;
  timestamp: number;
}

/**
 * Service singleton para gerenciar chamadas ao /api/auth/me
 * com cache de 10 segundos no localStorage para evitar múltiplas chamadas
 * ao backend em curto espaço de tempo.
 */
export class AuthMeService {
  private pendingRequest: Promise<AuthUser | null> | null = null;

  /**
   * Obtém dados do usuário atual do cache ou do backend
   * Retorna do cache se ainda estiver válido (menos de 10 segundos)
   * Caso contrário, faz fetch do backend
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    // Verificar cache no localStorage
    const cachedData = this.getCachedData();
    
    if (cachedData) {
      const now = Date.now();
      const age = now - cachedData.timestamp;
      
      // Se cache ainda é válido (menos de 10 segundos), retornar do cache
      if (age < CACHE_DURATION_MS) {
        console.log(`✅ [AuthMeService] Returning cached data (age: ${age}ms)`);
        return cachedData.user;
      }
      
      console.log(`⏰ [AuthMeService] Cache expired (age: ${age}ms), fetching from backend`);
    }

    // Se já há uma requisição em andamento, aguardar ela
    if (this.pendingRequest) {
      console.log(`⏸️ [AuthMeService] Request already in progress, waiting...`);
      return this.pendingRequest;
    }

    // Fazer fetch do backend
    this.pendingRequest = this.fetchFromBackend();
    
    try {
      const user = await this.pendingRequest;
      return user;
    } finally {
      this.pendingRequest = null;
    }
  }

  /**
   * Busca dados do backend e atualiza o cache
   */
  private async fetchFromBackend(): Promise<AuthUser | null> {
    try {
      const timestamp = new Date().toISOString();
      console.log(`🔵 [${timestamp}] [AuthMeService] Fetching from backend...`);
      
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error(`❌ [AuthMeService] Failed to fetch user data:`, response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      const fetchTimestamp = new Date().toISOString();
      console.log(`✅ [${fetchTimestamp}] [AuthMeService] User data fetched from backend:`, data.user?.email || 'null/undefined');

      // IMPORTANTE: Não cachear valores null ou undefined quando vierem de uma resposta válida
      // mas sem usuário (pode ser que os cookies ainda não estejam disponíveis)
      // Só cachear se realmente temos um usuário válido
      if (data.user) {
        // Atualizar cache no localStorage apenas se temos um usuário válido
        this.setCachedData(data.user);
      } else {
        // Se não temos usuário, limpar cache para forçar nova tentativa
        console.log(`⚠️ [AuthMeService] No user data received, clearing cache to force retry`);
        this.clearCache();
      }

      return data.user as AuthUser | null;
    } catch (error) {
      console.error(`❌ [AuthMeService] Error fetching user data:`, error);
      return null;
    }
  }

  /**
   * Obtém dados do cache do localStorage
   */
  private getCachedData(): CacheData | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const cachedUser = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (!cachedUser || !cachedTimestamp) {
        return null;
      }

      return {
        user: JSON.parse(cachedUser),
        timestamp: parseInt(cachedTimestamp, 10),
      };
    } catch (error) {
      console.error('[AuthMeService] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Armazena dados no cache do localStorage
   */
  private setCachedData(user: AuthUser | null): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const timestamp = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(user));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString());
    } catch (error) {
      console.error('[AuthMeService] Error writing cache:', error);
    }
  }

  /**
   * Limpa o cache (útil para logout ou quando necessário forçar refresh)
   */
  clearCache(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log('[AuthMeService] Cache cleared');
    } catch (error) {
      console.error('[AuthMeService] Error clearing cache:', error);
    }
  }

  /**
   * Força uma nova busca do backend ignorando o cache
   */
  async refresh(): Promise<AuthUser | null> {
    this.clearCache();
    return this.fetchFromBackend();
  }
}

// Singleton instance
export const authMeService = new AuthMeService();

