import YahooFinance from 'yahoo-finance2';
import type { TickerValidationResult, BatchPriceResult } from '@/types/price';
import { executeInParallel } from '@/lib/utils/parallel-executor';

// Instanciar YahooFinance (requerido na v3)
const yahooFinance = new YahooFinance();

/**
 * Normaliza ticker para formato Yahoo Finance
 * Suporta:
 * - Tickers brasileiros (PETR4 -> PETR4.SA)
 * - Tickers internacionais (AAPL, TSLA, etc.)
 * - Criptomoedas (BTC -> BTC-USD, BITCOIN -> BTC-USD)
 * - Tickers com sufixos já definidos (.SA, .TO, etc.)
 */
function normalizeTicker(ticker: string): string {
  const upperTicker = ticker.toUpperCase().trim();
  
  // Se já tem sufixo de bolsa (.SA, .TO, .L, etc.), retorna como está
  if (/\.(SA|TO|L|PA|AS|DE|F|HK|T|KS|SS|MX|BA|V|SN|SW|ST|CO|OL|HE|MC|MI|TA|IL|VI|BR|LS|AT|RG|VS|DU|HM|MU|HA|DE|F|HM|HA|MU|DU|RG|VS|LS|BR|VI|IL|TA|MI|MC|HE|OL|CO|ST|SW|SN|V|BA|MX|SS|KS|T|HK|F|DE|AS|PA|L|TO)$/.test(upperTicker)) {
    return upperTicker;
  }
  
  // Criptomoedas - mapeamento comum
  const cryptoMap: Record<string, string> = {
    'BITCOIN': 'BTC-USD',
    'BTC': 'BTC-USD',
    'ETHEREUM': 'ETH-USD',
    'ETH': 'ETH-USD',
    'BNB': 'BNB-USD',
    'SOLANA': 'SOL-USD',
    'SOL': 'SOL-USD',
    'XRP': 'XRP-USD',
    'ADA': 'ADA-USD',
    'CARDANO': 'ADA-USD',
    'DOGE': 'DOGE-USD',
    'DOGECOIN': 'DOGE-USD',
    'MATIC': 'MATIC-USD',
    'POLYGON': 'MATIC-USD',
    'AVAX': 'AVAX-USD',
    'AVALANCHE': 'AVAX-USD',
    'DOT': 'DOT-USD',
    'POLKADOT': 'DOT-USD',
    'LINK': 'LINK-USD',
    'CHAINLINK': 'LINK-USD',
    'UNI': 'UNI-USD',
    'UNISWAP': 'UNI-USD',
    'LTC': 'LTC-USD',
    'LITECOIN': 'LTC-USD',
  };
  
  // Verificar se é criptomoeda conhecida
  if (cryptoMap[upperTicker]) {
    return cryptoMap[upperTicker];
  }
  
  // Se termina com -USD, -BRL, etc., já está no formato correto (ex: BTC-USD)
  if (/-[A-Z]{3}$/.test(upperTicker)) {
    return upperTicker;
  }
  
  // Tickers brasileiros (padrão: 4-5 letras + 1-2 números)
  // Ex: PETR4, VALE3, ITUB4, USIM5, BBDC4
  const brazilianTickerPattern = /^[A-Z]{4,5}\d{1,2}$/;
  
  if (brazilianTickerPattern.test(upperTicker)) {
    return `${upperTicker}.SA`;
  }
  
  // Tickers internacionais geralmente têm 1-5 caracteres
  // Se não se encaixa no padrão brasileiro e não tem sufixo, assume que é internacional
  // Retorna como está (Yahoo Finance aceita tickers sem sufixo para algumas bolsas)
  return upperTicker;
}

/**
 * Retry logic com backoff exponencial
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export class YahooFinanceService {
  /**
   * Valida se um ticker existe no Yahoo Finance
   */
  async validateTicker(ticker: string): Promise<TickerValidationResult> {
    try {
      const normalizedTicker = normalizeTicker(ticker);
      
      const result: any = await retryWithBackoff(async () => {
        // v3 API: quote retorna um objeto com os dados
        return await yahooFinance.quote(normalizedTicker);
      });
      
      // v3: verificar se o resultado é válido
      if (!result) {
        return {
          valid: false,
          ticker: normalizedTicker,
          error: 'Ticker não encontrado',
        };
      }

      // v3: acessar preço regular do mercado (pode estar em diferentes campos)
      const price = result.regularMarketPrice || result.price || result.currentPrice || null;
      
      if (!price || price === 0) {
        return {
          valid: false,
          ticker: normalizedTicker,
          error: 'Ticker não encontrado ou sem preço disponível',
        };
      }
      
      // Extrair currency do resultado (pode estar em currency ou financialCurrency)
      const currency = result.currency || result.financialCurrency || null;
      
      return {
        valid: true,
        ticker: normalizedTicker,
        name: result.longName || result.shortName || result.displayName || result.symbol || normalizedTicker,
        price: typeof price === 'number' ? price : parseFloat(price),
        currency: currency || undefined,
      };
    } catch (error) {
      let errorMessage = 'Erro ao validar ticker';
      
      if (error instanceof Error) {
        const errorStr = error.message || error.toString();
        
        // Detectar rate limiting
        if (
          errorStr.includes('Too Many Requests') ||
          errorStr.includes('429') ||
          errorStr.includes('rate limit') ||
          errorStr.includes('Rate limit') ||
          errorStr.includes('quota') ||
          errorStr.includes('crumb')
        ) {
          errorMessage = 'Too Many Requests - Limite de requisições excedido. Aguarde alguns instantes.';
        } else if (errorStr.includes('not found') || errorStr.includes('Invalid') || errorStr.includes('No such ticker')) {
          errorMessage = 'Ticker não encontrado no Yahoo Finance';
        } else {
          errorMessage = errorStr;
        }
      }
      
      return {
        valid: false,
        ticker: normalizeTicker(ticker),
        error: errorMessage,
      };
    }
  }

  /**
   * Obtém preço atual de um ticker
   */
  async getCurrentPrice(ticker: string): Promise<number | null> {
    try {
      const normalizedTicker = normalizeTicker(ticker);
      const result: any = await retryWithBackoff(async () => {
        return await yahooFinance.quote(normalizedTicker);
      });
      
      if (!result) {
        return null;
      }

      // v3: tentar diferentes campos de preço
      const price = result.regularMarketPrice || result.price || result.currentPrice || null;
      return price ? (typeof price === 'number' ? price : parseFloat(price)) : null;
    } catch (error) {
      console.error(`Erro ao obter preço de ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Obtém dados completos do quote (incluindo tipo, nome, etc.)
   */
  async getQuoteData(ticker: string): Promise<any | null> {
    try {
      const normalizedTicker = normalizeTicker(ticker);
      const result: any = await retryWithBackoff(async () => {
        return await yahooFinance.quote(normalizedTicker);
      });
      
      return result || null;
    } catch (error) {
      console.error(`Erro ao obter dados do quote de ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Obtém preços de múltiplos tickers em batch (otimizado com paralelismo controlado)
   */
  async getBatchPrices(tickers: string[]): Promise<BatchPriceResult> {
    const normalizedTickers = tickers.map(normalizeTicker);
    const uniqueTickers = [...new Set(normalizedTickers)];
    const result: BatchPriceResult = {};
    
    if (uniqueTickers.length === 0) {
      return result;
    }
    
    // Usa paralelismo controlado para evitar rate limiting e sobrecarga
    // Concorrência de 15 para APIs externas (Yahoo Finance)
    // Delay mínimo de 50ms entre requisições para evitar rate limiting
    // Jitter de até 50ms para evitar sincronização
    try {
      const tasks = uniqueTickers.map((ticker) => async () => {
        try {
          const quote: any = await retryWithBackoff(async () => {
            return await yahooFinance.quote(ticker);
          });
          
          return { ticker, quote, error: null };
        } catch (error) {
          return {
            ticker,
            quote: null,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      });

      const results = await executeInParallel(tasks, {
        concurrency: 15, // Processa até 15 tickers simultaneamente
        minDelay: 50, // Delay mínimo de 50ms entre requisições
        maxJitter: 50, // Jitter aleatório de até 50ms
      });
      
      // Processa resultados na ordem correta
      for (let i = 0; i < results.length; i++) {
        const taskResult = results[i];
        const ticker = uniqueTickers[i];
        
        if (!taskResult.success || !taskResult.result) {
          result[ticker] = {
            price: 0,
            error: taskResult.error?.message || 'Erro ao buscar ticker',
          };
          continue;
        }

        const { quote, error } = taskResult.result;
        
        if (error || !quote) {
          result[ticker] = {
            price: 0,
            error: error?.message || 'Ticker não encontrado',
          };
          continue;
        }

        const price = quote.regularMarketPrice || quote.price || quote.currentPrice;
        
        if (price && price > 0) {
          const priceNum = typeof price === 'number' ? price : parseFloat(price);
          result[ticker] = {
            price: priceNum,
            name: quote.longName || quote.shortName || quote.displayName || quote.symbol || ticker,
          };
        } else {
          result[ticker] = {
            price: 0,
            error: 'Ticker sem preço disponível',
          };
        }
      }
    } catch (error) {
      console.error('Erro ao obter preços em batch:', error);
      // Marcar todos como erro
      for (const ticker of uniqueTickers) {
        result[ticker] = {
          price: 0,
          error: error instanceof Error ? error.message : 'Erro ao buscar preço',
        };
      }
    }
    
    return result;
  }
}

// Singleton instance
export const yahooFinanceService = new YahooFinanceService();

