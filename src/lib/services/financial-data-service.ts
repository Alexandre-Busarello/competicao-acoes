/**
 * Serviço para buscar dados financeiros da API externa
 */

const API_BASE_URL = process.env.FINANCIAL_DATA_API_URL || '';
const API_KEY = process.env.FINANCIAL_DATA_API_KEY || '';

interface FinancialDataResponse {
  success: boolean;
  data: Array<{
    ticker: string;
    company: {
      name: string;
      sector: string;
      industry: string;
    };
    financialData: Record<string, any>;
    historicalAverages?: {
      dy?: number | null;
      roe?: number | null;
      roic?: number | null;
      [key: string]: any;
    } | null;
    year: number;
    updatedAt: string;
  }>;
  notFound?: string[];
  error?: string;
}

interface SingleFinancialDataResponse {
  success: boolean;
  data: {
    ticker: string;
    company: {
      name: string;
      sector: string;
      industry: string;
    };
    financialData: Record<string, any>;
    historicalAverages?: {
      dy?: number | null;
      roe?: number | null;
      roic?: number | null;
      [key: string]: any;
    } | null;
    year: number;
    updatedAt: string;
  };
  error?: string;
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

export class FinancialDataService {
  /**
   * Busca dados financeiros de múltiplos tickers em batch
   * Suporta até 50 tickers por requisição
   */
  async fetchFinancialData(tickers: string[]): Promise<FinancialDataResponse['data']> {
    if (!API_BASE_URL || !API_KEY) {
      throw new Error('FINANCIAL_DATA_API_URL e FINANCIAL_DATA_API_KEY devem estar configuradas');
    }

    if (tickers.length === 0) {
      return [];
    }

    // Limitar a 50 tickers por requisição (limite da API)
    const maxBatchSize = 50;
    const batches: string[][] = [];
    
    for (let i = 0; i < tickers.length; i += maxBatchSize) {
      batches.push(tickers.slice(i, i + maxBatchSize));
    }

    console.log(`[Financial Data Service] Total de tickers: ${tickers.length}, Total de batches: ${batches.length}`);
    batches.forEach((batch, index) => {
      console.log(`[Financial Data Service] Batch ${index + 1}/${batches.length}: ${batch.length} tickers (${batch[0]} até ${batch[batch.length - 1]})`);
    });

    const allResults: FinancialDataResponse['data'] = [];
    const notFound: string[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      try {
        console.log(`[Financial Data Service] Processando batch ${batchIndex + 1}/${batches.length} com ${batch.length} tickers...`);
        const tickersStr = batch.join(',');
        const url = `${API_BASE_URL}?tickers=${encodeURIComponent(tickersStr)}`;

        console.log(`${API_BASE_URL}?tickers=${encodeURIComponent(tickersStr)}`);
        
        const response = await retryWithBackoff(async () => {
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            if (res.status === 429) {
              const retryAfter = res.headers.get('Retry-After');
              const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
              await new Promise(resolve => setTimeout(resolve, delay));
              throw new Error('Rate limit exceeded, retrying...');
            }
            throw new Error(`API retornou status ${res.status}`);
          }

          return res;
        });

        const data: FinancialDataResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erro ao buscar dados financeiros');
        }

        if (data.data) {
          allResults.push(...data.data);
          console.log(`[Financial Data Service] Batch ${batchIndex + 1}/${batches.length} processado com sucesso: ${data.data.length} resultados`);
        } else {
          console.warn(`[Financial Data Service] Batch ${batchIndex + 1}/${batches.length} retornou sem dados`);
        }

        if (data.notFound && data.notFound.length > 0) {
          notFound.push(...data.notFound);
          console.warn(`[Financial Data Service] Batch ${batchIndex + 1}/${batches.length} - Tickers não encontrados: ${data.notFound.join(', ')}`);
        }
      } catch (error) {
        console.error(`[Financial Data Service] Erro ao buscar dados do batch ${batchIndex + 1}/${batches.length} (${batch.join(',')}):`, error);
        // Continuar com outros batches mesmo se um falhar
      }
    }

    console.log(`[Financial Data Service] Processamento concluído: ${allResults.length} resultados totais, ${notFound.length} tickers não encontrados`);
    
    // Verificar se todos os batches foram processados
    // Alguns tickers podem não retornar dados mesmo não estando em notFound (dados indisponíveis)
    const expectedTickers = tickers.length - notFound.length;
    const missingTickers = expectedTickers - allResults.length;
    
    // Só avisar se a diferença for significativa (mais de 5% ou mais de 5 tickers)
    if (missingTickers > 0 && (missingTickers > 5 || (missingTickers / tickers.length) > 0.05)) {
      console.warn(`[Financial Data Service] ATENÇÃO: Esperado aproximadamente ${expectedTickers} resultados, mas recebido apenas ${allResults.length} (faltam ${missingTickers} tickers). Alguns batches podem não ter sido processados completamente.`);
      console.warn(`[Financial Data Service] Total de batches criados: ${batches.length}, Total de tickers enviados: ${tickers.length}`);
    } else if (missingTickers > 0) {
      console.log(`[Financial Data Service] Nota: ${missingTickers} ticker(s) não retornaram dados (pode ser normal se dados não estiverem disponíveis)`);
    }

    if (notFound.length > 0) {
      console.warn(`Tickers não encontrados: ${notFound.join(', ')}`);
    }

    return allResults;
  }

  /**
   * Busca dados financeiros de um único ticker
   */
  async fetchSingleTicker(ticker: string): Promise<SingleFinancialDataResponse['data'] | null> {
    if (!API_BASE_URL || !API_KEY) {
      throw new Error('FINANCIAL_DATA_API_URL e FINANCIAL_DATA_API_KEY devem estar configuradas');
    }

    try {
      const url = `${API_BASE_URL}/${ticker}`;
      
      const response = await retryWithBackoff(async () => {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            return null; // Ticker não encontrado
          }
          if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
            await new Promise(resolve => setTimeout(resolve, delay));
            throw new Error('Rate limit exceeded, retrying...');
          }
          throw new Error(`API retornou status ${res.status}`);
        }

        return res;
      });

      if (!response) {
        return null;
      }

      const data: SingleFinancialDataResponse = await response.json();

      if (!data.success || !data.data) {
        return null;
      }

      return data.data;
    } catch (error) {
      console.error(`Erro ao buscar dados de ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Busca dados de todos os tickers fornecidos
   * Processa em lotes se necessário
   */
  async fetchAllTickers(tickers: string[]): Promise<FinancialDataResponse['data']> {
    return this.fetchFinancialData(tickers);
  }
}

// Singleton instance
export const financialDataService = new FinancialDataService();

