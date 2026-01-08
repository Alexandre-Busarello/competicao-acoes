import { yahooFinanceService } from './yahoo-finance-service';
import { priceCache } from '@/lib/cache/price-cache';
import type { PriceMap, TickerValidationResult } from '@/types/price';

export class PriceService {
  /**
   * Obtém preços atuais do cache
   */
  getCurrentPrices(): PriceMap {
    return priceCache.getPrices();
  }

  /**
   * Obtém preço de um ticker específico do cache
   */
  getPrice(ticker: string): number | null {
    return priceCache.getPrice(ticker);
  }

  /**
   * Adiciona ticker à lista de monitoramento
   */
  addTicker(ticker: string): void {
    priceCache.addTicker(ticker);
  }

  /**
   * Valida ticker e adiciona à lista de monitoramento se válido
   */
  async validateAndAddTicker(ticker: string): Promise<TickerValidationResult> {
    const result = await yahooFinanceService.validateTicker(ticker);
    
    if (result.valid && result.ticker) {
      priceCache.addTicker(result.ticker);
    }
    
    return result;
  }

  /**
   * Atualiza preços de todos os tickers monitorados
   */
  async updatePrices(): Promise<{
    success: boolean;
    tickersUpdated: number;
    errors: string[];
    lastUpdate: Date;
  }> {
    const tickers = priceCache.getTickers();
    
    if (tickers.length === 0) {
      return {
        success: true,
        tickersUpdated: 0,
        errors: [],
        lastUpdate: new Date(),
      };
    }

    try {
      const batchResult = await yahooFinanceService.getBatchPrices(tickers);
      const prices: PriceMap = {};
      const errors: string[] = [];

      for (const [ticker, data] of Object.entries(batchResult)) {
        if (data.error) {
          errors.push(`${ticker}: ${data.error}`);
        } else if (data.price > 0) {
          prices[ticker] = data.price;
        } else {
          errors.push(`${ticker}: Preço inválido`);
        }
      }

      // Atualiza cache mesmo com alguns erros (preços válidos são salvos)
      priceCache.updatePrices(prices);

      return {
        success: errors.length < tickers.length, // Sucesso se pelo menos alguns preços foram atualizados
        tickersUpdated: Object.keys(prices).length,
        errors,
        lastUpdate: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        tickersUpdated: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        lastUpdate: new Date(),
      };
    }
  }

  /**
   * Obtém informações do cache
   */
  getCacheInfo() {
    return priceCache.getCacheInfo();
  }

  /**
   * Coleta todos os tickers únicos do sistema (de transações)
   * Esta função será chamada antes de atualizar preços
   */
  collectTickersFromTransactions(transactions: Array<{ ticker: string }>): void {
    const uniqueTickers = new Set<string>();
    
    transactions.forEach(tx => {
      if (tx.ticker) {
        const ticker = tx.ticker.toUpperCase().trim();
        // Adiciona tanto o ticker original quanto o normalizado (.SA)
        uniqueTickers.add(ticker);
        // Se não termina com .SA e parece ser brasileiro, adiciona também com .SA
        if (!ticker.endsWith('.SA') && /^[A-Z]{4,5}\d{1,2}$/.test(ticker)) {
          uniqueTickers.add(`${ticker}.SA`);
        }
      }
    });
    
    priceCache.addTickers(Array.from(uniqueTickers));
  }
}

// Singleton instance
export const priceService = new PriceService();

