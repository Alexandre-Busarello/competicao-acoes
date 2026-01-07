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
 * Calcula total investido (apenas compras)
 */
export function calculateTotalInvested(
  transactions: Transaction[]
): number {
  return transactions
    .filter(tx => tx.type === 'compra')
    .reduce((total, tx) => total + tx.quantity * tx.price, 0);
}

/**
 * Calcula posições atuais (agrupando por ticker)
 */
export function calculatePositions(
  transactions: Transaction[]
): Position[] {
  const positionsMap = new Map<string, { quantity: number; totalValue: number }>();

  for (const tx of transactions) {
    const ticker = tx.ticker.toUpperCase().trim();
    const current = positionsMap.get(ticker) || { quantity: 0, totalValue: 0 };

    if (tx.type === 'compra') {
      current.quantity += tx.quantity;
      current.totalValue += tx.quantity * tx.price;
    } else if (tx.type === 'venda') {
      current.quantity -= tx.quantity;
      // Vendas não afetam o preço médio (FIFO simplificado)
      // O preço médio é calculado apenas sobre as compras
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
 */
export function calculateCurrentValue(
  positions: Position[],
  prices: PriceMap
): number {
  let totalValue = 0;

  for (const position of positions) {
    // Busca preço no cache - tenta diferentes variações do ticker
    const tickerVariations = [
      position.ticker, // Ticker original
      position.ticker.toUpperCase(), // Uppercase
      position.ticker.endsWith('.SA') ? position.ticker : `${position.ticker}.SA`, // Com .SA se não tiver
    ];
    
    let currentPrice = 0;
    for (const variation of tickerVariations) {
      if (prices[variation]) {
        currentPrice = prices[variation];
        break;
      }
    }
    
    totalValue += position.quantity * currentPrice;
  }

  return totalValue;
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
 * Calcula portfolio completo (posições, valores e rentabilidade)
 */
export function calculatePortfolio(
  transactions: Transaction[],
  prices: PriceMap
): PortfolioCalculation {
  const positions = calculatePositions(transactions);
  const totalInvested = calculateTotalInvested(transactions);
  const currentValue = calculateCurrentValue(positions, prices);
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

