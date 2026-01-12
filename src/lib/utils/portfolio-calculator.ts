import type { Transaction } from '@/types';
import type { PriceMap } from '@/types/price';

export interface Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
}

export interface PortfolioCalculation {
  positions: Position[];
  totalInvested: number;
  currentValue: number;
  return: number;
  returnPercentage: number;
}

/**
 * Calcula preço médio ponderado de transações de compra
 */
export function calculateAveragePrice(
  transactions: Transaction[]
): number {
  const buyTransactions = transactions.filter(tx => tx.type === 'compra');
  
  if (buyTransactions.length === 0) {
    return 0;
  }

  let totalQuantity = 0;
  let totalValue = 0;

  for (const tx of buyTransactions) {
    totalQuantity += tx.quantity;
    totalValue += tx.quantity * tx.price;
  }

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

/**
 * Normaliza ticker para formato consistente (agrupa variações como PETR4 e PETR4.SA)
 */
export function normalizeTickerForGrouping(ticker: string): string {
  const upperTicker = ticker.toUpperCase().trim();
  
  // Se já tem .SA, retorna como está
  if (upperTicker.endsWith('.SA')) {
    return upperTicker;
  }
  
  // Se parece ser ticker brasileiro (4-5 letras + 1-2 números), adiciona .SA
  // Ex: PETR4 -> PETR4.SA, VALE3 -> VALE3.SA
  if (/^[A-Z]{4,5}\d{1,2}$/.test(upperTicker)) {
    return `${upperTicker}.SA`;
  }
  
  // Caso contrário, retorna como está (pode ser ticker internacional)
  return upperTicker;
}

/**
 * Calcula total investido (apenas compras)
 * 
 * Para cálculo de rentabilidade, o investimento inicial é o valor total
 * investido em compras. O dinheiro recebido em vendas será incluído
 * no valor atual da carteira.
 */
export function calculateTotalInvested(
  transactions: Transaction[]
): number {
  return transactions
    .filter(tx => tx.type === 'compra')
    .reduce((total, tx) => total + tx.quantity * tx.price, 0);
}

/**
 * Calcula total recebido em vendas
 * 
 * Quando você vende ações, você recebe dinheiro. Esse dinheiro deve
 * ser incluído no valor atual da carteira para cálculo correto da rentabilidade.
 * 
 * IMPORTANTE: Soma todas as vendas, independente do ticker.
 * O agrupamento por ticker não é necessário aqui, pois cada transação é única.
 */
export function calculateTotalFromSales(
  transactions: Transaction[]
): number {
  return transactions
    .filter(tx => tx.type === 'venda')
    .reduce((total, tx) => total + tx.quantity * tx.price, 0);
}

/**
 * Calcula posições atuais (agrupando por ticker)
 * 
 * IMPORTANTE: Quando há vendas, o totalValue é reduzido proporcionalmente
 * para manter o preço médio de compra correto.
 * 
 * Exemplo:
 * - Compra 100 ações a R$ 10: quantity=100, totalValue=1000, avgPrice=10
 * - Vende 50 ações: quantity=50, totalValue=500 (reduzido proporcionalmente), avgPrice=10
 */
export function calculatePositions(
  transactions: Transaction[]
): Position[] {
  const positionsMap = new Map<string, { quantity: number; totalValue: number }>();

  for (const tx of transactions) {
    // Normaliza ticker para agrupar variações (ex: PETR4 e PETR4.SA)
    const ticker = normalizeTickerForGrouping(tx.ticker);
    const current = positionsMap.get(ticker) || { quantity: 0, totalValue: 0 };

    if (tx.type === 'compra') {
      current.quantity += tx.quantity;
      current.totalValue += tx.quantity * tx.price;
    } else if (tx.type === 'venda') {
      // Calcula o preço médio atual antes da venda
      const currentAveragePrice = current.quantity > 0 
        ? current.totalValue / current.quantity 
        : 0;
      
      // Reduz quantidade e totalValue proporcionalmente
      // Isso mantém o preço médio de compra correto
      current.quantity -= tx.quantity;
      
      if (currentAveragePrice > 0) {
        // Reduz o totalValue usando o preço médio de compra, não o preço de venda
        current.totalValue = current.quantity * currentAveragePrice;
      } else {
        // Se não havia posição antes, apenas reduz quantidade
        current.totalValue = 0;
      }
    }

    if (current.quantity > 0) {
      positionsMap.set(ticker, current);
    } else {
      positionsMap.delete(ticker);
    }
  }

  const positions: Position[] = [];

  for (const [ticker, data] of positionsMap.entries()) {
    const averagePrice = data.quantity > 0 ? data.totalValue / data.quantity : 0;
    
    positions.push({
      ticker,
      quantity: data.quantity,
      averagePrice,
    });
  }

  return positions;
}

/**
 * Calcula valor atual da carteira usando preços do cache
 * 
 * @param positions - Posições atuais da carteira
 * @param prices - Mapa de preços atualizados
 * @param cashFromSales - Dinheiro recebido em vendas (opcional, padrão 0)
 * @returns Valor total atual da carteira (posições + dinheiro de vendas)
 */
export function calculateCurrentValue(
  positions: Position[],
  prices: PriceMap,
  cashFromSales: number = 0
): number {
  let totalValue = 0;

  for (const position of positions) {
    // Busca preço no cache - tenta diferentes variações do ticker
    // Normaliza o ticker da posição primeiro
    const normalizedTicker = normalizeTickerForGrouping(position.ticker);
    
    const tickerVariations = [
      normalizedTicker, // Ticker normalizado
      position.ticker, // Ticker original
      normalizedTicker.toUpperCase(), // Uppercase do normalizado
      position.ticker.toUpperCase(), // Uppercase do original
      normalizedTicker.toLowerCase(), // Lowercase do normalizado
      position.ticker.toLowerCase(), // Lowercase do original
    ];
    
    // Para tickers brasileiros, também tentar sem .SA
    if (normalizedTicker.endsWith('.SA')) {
      const withoutSA = normalizedTicker.slice(0, -3);
      tickerVariations.push(withoutSA, withoutSA.toUpperCase(), withoutSA.toLowerCase());
    }
    
    // Para tickers que parecem brasileiros mas não têm .SA, tentar adicionar
    if (!normalizedTicker.includes('.') && /^[A-Z]{4,5}\d{1,2}$/i.test(normalizedTicker)) {
      tickerVariations.push(`${normalizedTicker}.SA`, `${normalizedTicker}.SA`.toUpperCase());
    }
    
    let currentPrice = 0;
    for (const variation of tickerVariations) {
      if (prices[variation] && prices[variation] > 0) {
        currentPrice = prices[variation];
        break;
      }
    }
    
    totalValue += position.quantity * currentPrice;
  }

  // Adiciona o dinheiro recebido em vendas ao valor atual
  return totalValue + cashFromSales;
}

/**
 * Calcula rentabilidade percentual
 */
export function calculateReturn(
  currentValue: number,
  investedValue: number
): number {
  if (investedValue === 0) {
    return 0;
  }

  return ((currentValue - investedValue) / investedValue) * 100;
}

/**
 * Calcula retorno mensal (percentual) baseado em valor investido e valor atual
 */
export function calculateMonthlyReturn(
  currentValue: number,
  totalInvested: number
): number {
  if (totalInvested === 0) {
    return 0;
  }
  return ((currentValue - totalInvested) / totalInvested) * 100;
}

/**
 * Calcula retorno anualizado usando fórmula de juros compostos
 * baseado no período real desde a primeira transação
 * 
 * Para investimentos muito recentes (< 30 dias), usa uma abordagem mais conservadora
 * para evitar valores extremos e irreais.
 * 
 * @param totalReturnPercent - Retorno total percentual desde o início
 * @param firstTransactionDate - Data da primeira transação
 * @returns Retorno anualizado percentual
 */
export function calculateAnnualizedReturn(
  totalReturnPercent: number,
  firstTransactionDate: Date
): number {
  // Calcular dias decorridos desde a primeira transação
  const daysSinceFirstTransaction = Math.max(
    1,
    Math.floor((Date.now() - firstTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Se retorno é zero ou período insuficiente, retornar o retorno total
  if (totalReturnPercent === 0 || daysSinceFirstTransaction <= 0) {
    return totalReturnPercent;
  }

  // Para investimentos muito recentes (< 30 dias), usar abordagem mais conservadora
  // Evita valores extremos e irreais para períodos muito curtos
  if (daysSinceFirstTransaction < 30) {
    // Projetar retorno mensal e multiplicar por 12
    const monthlyProjection = (totalReturnPercent / daysSinceFirstTransaction) * 30;
    const simpleAnnualized = monthlyProjection * 12;
    
    // Aplicar limites progressivos baseados no período
    // Períodos mais curtos têm limites mais conservadores
    if (daysSinceFirstTransaction < 3) {
      // Para investimentos de 1-2 dias, limite muito conservador (15% ao ano)
      // Evita distorções extremas (ex: 0.13% em 1 dia não vira 63% ao ano)
      return Math.min(simpleAnnualized, 15);
    } else if (daysSinceFirstTransaction < 7) {
      // Para investimentos de 3-6 dias, limite moderado (25% ao ano)
      return Math.min(simpleAnnualized, 25);
    } else if (daysSinceFirstTransaction < 14) {
      // Para investimentos de 7-13 dias, limite razoável (50% ao ano)
      return Math.min(simpleAnnualized, 50);
    } else {
      // Para investimentos de 14-29 dias, limite maior (100% ao ano)
      return Math.min(simpleAnnualized, 100);
    }
  }

  // Para investimentos com 30+ dias, usar fórmula de juros compostos completa
  // Fórmula: (1 + retorno_percentual/100)^(365/dias_decorridos) - 1
  const returnMultiplier = 1 + (totalReturnPercent / 100);
  const annualizedMultiplier = Math.pow(returnMultiplier, 365 / daysSinceFirstTransaction);
  const annualizedReturn = (annualizedMultiplier - 1) * 100;

  // Aplicar limite máximo mesmo para períodos maiores (500% ao ano)
  // Isso evita valores extremos em casos de retornos muito altos
  return Math.min(annualizedReturn, 500);
}

/**
 * Calcula retorno acumulado desde o início do ano (ou desde primeira transação se mais recente)
 * 
 * Para ranking anual, retorna o retorno percentual acumulado desde o início do ano.
 * Se a primeira transação foi depois do início do ano, usa desde a primeira transação.
 * 
 * IMPORTANTE: Esta função retorna o retorno acumulado REAL, não uma projeção anualizada.
 * Para ranking anual, queremos comparar retornos reais acumulados, não projeções.
 * 
 * @param currentValue - Valor atual da carteira
 * @param totalInvested - Valor total investido (desde o início do período considerado)
 * @param firstTransactionDate - Data da primeira transação
 * @returns Retorno acumulado percentual desde o início do ano (ou primeira transação)
 */
export function calculateYearToDateReturn(
  currentValue: number,
  totalInvested: number,
  firstTransactionDate: Date
): number {
  // Para ranking anual, simplesmente retornar o retorno percentual acumulado
  // desde o início (seja início do ano ou primeira transação)
  // Não fazemos projeção/anualização - apenas retorno real acumulado
  return calculateMonthlyReturn(currentValue, totalInvested);
}

/**
 * Calcula retorno mensal e anualizado/acumulado de forma centralizada
 * 
 * @param currentValue - Valor atual da carteira
 * @param totalInvested - Valor total investido
 * @param firstTransactionDate - Data da primeira transação
 * @param period - Período do ranking ('mensal' ou 'anual')
 * @returns Objeto com retorno mensal e anualizado/acumulado
 */
export function calculateReturns(
  currentValue: number,
  totalInvested: number,
  firstTransactionDate: Date,
  period: 'mensal' | 'anual' = 'mensal'
): {
  monthlyReturn: number;
  annualReturn: number;
} {
  const monthlyReturn = calculateMonthlyReturn(currentValue, totalInvested);
  
  // Para ranking anual, usar retorno acumulado desde início do ano (sem projeção)
  // Para ranking mensal, usar retorno anualizado (projeção)
  const annualReturn = period === 'anual'
    ? calculateYearToDateReturn(currentValue, totalInvested, firstTransactionDate)
    : calculateAnnualizedReturn(monthlyReturn, firstTransactionDate);

  return {
    monthlyReturn: Number(monthlyReturn.toFixed(2)),
    annualReturn: Number(annualReturn.toFixed(2)),
  };
}

/**
 * Calcula portfolio completo (posições, valores e rentabilidade)
 * 
 * IMPORTANTE: O valor atual inclui o dinheiro recebido em vendas.
 * Isso garante que a rentabilidade seja calculada corretamente quando há vendas.
 * 
 * Exemplo:
 * - Compra 100 ações a R$ 10 = R$ 1.000 investido
 * - Vende 50 ações a R$ 12 = R$ 600 recebido
 * - Posição atual: 50 ações
 * - Valor atual = (50 * preço atual) + R$ 600
 * - Rentabilidade = (Valor atual - R$ 1.000) / R$ 1.000
 */
export function calculatePortfolio(
  transactions: Transaction[],
  prices: PriceMap
): PortfolioCalculation {
  const positions = calculatePositions(transactions);
  const totalInvested = calculateTotalInvested(transactions);
  const cashFromSales = calculateTotalFromSales(transactions);
  const currentValue = calculateCurrentValue(positions, prices, cashFromSales);
  const returnValue = currentValue - totalInvested;
  const returnPercentage = calculateReturn(currentValue, totalInvested);

  return {
    positions,
    totalInvested,
    currentValue,
    return: returnValue,
    returnPercentage,
  };
}

/**
 * Interface para totais agrupados por moeda
 */
export interface CurrencyTotals {
  currency: string;
  totalInvested: number;
  currentValue: number;
  cashFromSales: number;
  positionsValue?: number; // Valor atual das posições (sem incluir vendas)
  return: number;
  returnPercentage: number;
}

/**
 * Calcula totais da carteira agrupados por moeda
 * 
 * IMPORTANTE: A moeda não impacta o ranking - todas as moedas têm equivalência 1:1
 * para cálculo de rentabilidade. Esta função apenas agrupa os valores por moeda
 * para exibição, mas o ranking considera todas as moedas igualmente.
 */
export function calculatePortfolioByCurrency(
  transactions: Transaction[],
  prices: PriceMap
): CurrencyTotals[] {
  // Agrupar transações por moeda
  const transactionsByCurrency = new Map<string, Transaction[]>();
  
  for (const tx of transactions) {
    // Usar 'BRL' como padrão se currency não estiver definida (transações antigas)
    const currency = tx.currency || 'BRL';
    
    if (!transactionsByCurrency.has(currency)) {
      transactionsByCurrency.set(currency, []);
    }
    transactionsByCurrency.get(currency)!.push(tx);
  }
  
  const currencyTotals: CurrencyTotals[] = [];
  
  // Calcular totais para cada moeda
  for (const [currency, currencyTransactions] of transactionsByCurrency.entries()) {
    const positions = calculatePositions(currencyTransactions);
    const totalInvested = calculateTotalInvested(currencyTransactions);
    const cashFromSales = calculateTotalFromSales(currencyTransactions);
    
    // Usar calculateCurrentValue diretamente para calcular valor das posições
    // Ela já tem toda a lógica de busca de preços com todas as variações
    // Passar cashFromSales=0 para obter apenas o valor das posições
    const positionsValue = calculateCurrentValue(positions, prices, 0);
    
    // Valor atual = posições + dinheiro de vendas
    const currentValue = positionsValue + cashFromSales;
    const returnValue = currentValue - totalInvested;
    const returnPercentage = calculateReturn(currentValue, totalInvested);
    
    currencyTotals.push({
      currency,
      totalInvested,
      currentValue,
      cashFromSales,
      positionsValue, // Valor atual das posições (sem incluir vendas)
      return: returnValue,
      returnPercentage,
    });
  }
  
  // Ordenar por moeda (BRL primeiro, depois alfabeticamente)
  currencyTotals.sort((a, b) => {
    if (a.currency === 'BRL') return -1;
    if (b.currency === 'BRL') return 1;
    return a.currency.localeCompare(b.currency);
  });
  
  return currencyTotals;
}

