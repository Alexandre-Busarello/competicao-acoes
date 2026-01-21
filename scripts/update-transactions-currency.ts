/**
 * Script para atualizar transações antigas que não têm currency
 * 
 * Este script:
 * 1. Busca todas as transações sem currency no banco de dados
 * 2. Agrupa por ticker para otimizar (evita buscar o mesmo ticker múltiplas vezes)
 * 3. Para cada ticker único, busca a currency no Yahoo Finance
 * 4. Atualiza todas as transações desse ticker com a currency encontrada
 * 
 * Uso:
 *   npm run update-currency
 * 
 * Ou diretamente:
 *   npx tsx scripts/update-transactions-currency.ts
 * 
 * Requisitos:
 *   - Variáveis de ambiente configuradas (.env com DIRECT_DATABASE_URL)
 *   - Prisma Client gerado (npx prisma generate)
 *   - Conexão com o banco de dados ativa
 */

import { PrismaClient } from '@prisma/client';
import YahooFinance from 'yahoo-finance2';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const prisma = new PrismaClient();

// Lista de User-Agents válidos para rotação (evita detecção de padrões)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
];

// Contador para rotação sequencial de User-Agents
let userAgentIndex = 0;

/**
 * Obtém um User-Agent rotacionado da lista
 */
function getRotatedUserAgent(): string {
  const userAgent = USER_AGENTS[userAgentIndex];
  userAgentIndex = (userAgentIndex + 1) % USER_AGENTS.length;
  return userAgent;
}

/**
 * Cria uma instância do YahooFinance com um User-Agent específico
 */
function createYahooFinanceInstance(userAgent?: string) {
  return new YahooFinance({
    suppressNotices: ['yahooSurvey'],
    fetchOptions: {
      headers: {
        'User-Agent': userAgent || getRotatedUserAgent(),
      },
    },
  });
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

/**
 * Busca currency de um ticker no Yahoo Finance
 */
async function getCurrencyFromYahoo(ticker: string): Promise<string | null> {
  try {
    const result: any = await retryWithBackoff(async () => {
      // Cria nova instância com User-Agent rotacionado para cada requisição
      const yfInstance = createYahooFinanceInstance();
      return await yfInstance.quote(ticker);
    });
    
    if (!result) {
      return null;
    }
    
    // Extrair currency do resultado (pode estar em currency ou financialCurrency)
    const currency = result.currency || result.financialCurrency || null;
    return currency;
  } catch (error) {
    console.error(`Erro ao buscar currency de ${ticker}:`, error);
    return null;
  }
}

/**
 * Normaliza ticker para formato Yahoo Finance
 */
function normalizeTicker(ticker: string): string {
  const upperTicker = ticker.toUpperCase().trim();
  
  // Se já tem sufixo de bolsa (.SA, .TO, etc.), retorna como está
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
  
  if (cryptoMap[upperTicker]) {
    return cryptoMap[upperTicker];
  }
  
  // Se termina com -USD, -BRL, etc., já está no formato correto
  if (/-[A-Z]{3}$/.test(upperTicker)) {
    return upperTicker;
  }
  
  // Tickers brasileiros (padrão: 4-5 letras + 1-2 números)
  const brazilianTickerPattern = /^[A-Z]{4,5}\d{1,2}$/;
  
  if (brazilianTickerPattern.test(upperTicker)) {
    return `${upperTicker}.SA`;
  }
  
  // Tickers internacionais geralmente têm 1-5 caracteres
  return upperTicker;
}

/**
 * Delay entre requisições para evitar rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Iniciando atualização de currency nas transações...\n');
  
  try {
    // Buscar todas as transações sem currency
    const transactionsWithoutCurrency = await prisma.transaction.findMany({
      where: {
        currency: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    console.log(`📊 Encontradas ${transactionsWithoutCurrency.length} transações sem currency\n`);
    
    if (transactionsWithoutCurrency.length === 0) {
      console.log('✅ Nenhuma transação precisa ser atualizada!');
      return;
    }
    
    // Agrupar por ticker para otimizar (evitar buscar o mesmo ticker múltiplas vezes)
    const tickerMap = new Map<string, string[]>();
    
    for (const tx of transactionsWithoutCurrency) {
      const normalizedTicker = normalizeTicker(tx.ticker);
      if (!tickerMap.has(normalizedTicker)) {
        tickerMap.set(normalizedTicker, []);
      }
      tickerMap.get(normalizedTicker)!.push(tx.id);
    }
    
    console.log(`📈 Encontrados ${tickerMap.size} tickers únicos para processar\n`);
    
    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    // Processar cada ticker único
    for (const [normalizedTicker, transactionIds] of tickerMap.entries()) {
      console.log(`🔍 Processando ${normalizedTicker}...`);
      
      // Buscar currency do Yahoo Finance
      const currency = await getCurrencyFromYahoo(normalizedTicker);
      
      // Delay para evitar rate limiting (100ms entre requisições)
      await delay(100);
      
      if (!currency) {
        console.log(`  ⚠️  Currency não encontrada para ${normalizedTicker}, usando BRL como padrão`);
        
        // Atualizar todas as transações deste ticker com BRL como padrão
        const result = await prisma.transaction.updateMany({
          where: {
            id: {
              in: transactionIds,
            },
          },
          data: {
            currency: 'BRL',
          },
        });
        
        skippedCount += result.count;
        console.log(`  📝 ${result.count} transações atualizadas com BRL (padrão)\n`);
        continue;
      }
      
      console.log(`  ✅ Currency encontrada: ${currency}`);
      
      // Atualizar todas as transações deste ticker
      const result = await prisma.transaction.updateMany({
        where: {
          id: {
            in: transactionIds,
          },
        },
        data: {
          currency: currency,
        },
      });
      
      updatedCount += result.count;
      console.log(`  📝 ${result.count} transações atualizadas\n`);
    }
    
    console.log('\n📊 Resumo da atualização:');
    console.log(`  ✅ Atualizadas com currency do Yahoo: ${updatedCount}`);
    console.log(`  ⚠️  Atualizadas com BRL (padrão): ${skippedCount}`);
    console.log(`  ❌ Falhas: ${failedCount}`);
    console.log(`  📈 Total processado: ${updatedCount + skippedCount + failedCount}`);
    
    console.log('\n✅ Atualização concluída!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a atualização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
main()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });

