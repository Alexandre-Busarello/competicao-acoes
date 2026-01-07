import type { PriceCache, PriceMap } from '@/types/price';

class PriceCacheManager {
  private cache: PriceCache = {
    prices: {},
    lastUpdate: null,
    tickers: new Set<string>(),
  };

  private ttl: number;

  constructor(ttlSeconds: number = 900) {
    // Default: 15 minutos
    this.ttl = ttlSeconds * 1000;
  }

  /**
   * Verifica se o cache está válido (não expirado)
   */
  isValid(): boolean {
    if (!this.cache.lastUpdate) {
      return false;
    }
    
    const now = Date.now();
    const lastUpdate = this.cache.lastUpdate.getTime();
    return (now - lastUpdate) < this.ttl;
  }

  /**
   * Obtém todos os preços do cache
   */
  getPrices(): PriceMap {
    return { ...this.cache.prices };
  }

  /**
   * Obtém preço de um ticker específico
   */
  getPrice(ticker: string): number | null {
    return this.cache.prices[ticker] || null;
  }

  /**
   * Atualiza o cache com novos preços
   */
  updatePrices(prices: PriceMap): void {
    this.cache.prices = { ...prices };
    this.cache.lastUpdate = new Date();
  }

  /**
   * Adiciona um ticker à lista de monitoramento
   */
  addTicker(ticker: string): void {
    this.cache.tickers.add(ticker);
  }

  /**
   * Adiciona múltiplos tickers
   */
  addTickers(tickers: string[]): void {
    tickers.forEach(ticker => this.cache.tickers.add(ticker));
  }

  /**
   * Obtém todos os tickers únicos sendo monitorados
   */
  getTickers(): string[] {
    return Array.from(this.cache.tickers);
  }

  /**
   * Limpa o cache
   */
  clear(): void {
    this.cache = {
      prices: {},
      lastUpdate: null,
      tickers: new Set<string>(),
    };
  }

  /**
   * Obtém informações do cache
   */
  getCacheInfo() {
    return {
      tickerCount: this.cache.tickers.size,
      priceCount: Object.keys(this.cache.prices).length,
      lastUpdate: this.cache.lastUpdate,
      isValid: this.isValid(),
    };
  }

  /**
   * Define TTL customizado
   */
  setTTL(seconds: number): void {
    this.ttl = seconds * 1000;
  }
}

// Singleton instance
const ttl = parseInt(process.env.PRICE_CACHE_TTL || '900', 10);
export const priceCache = new PriceCacheManager(ttl);

