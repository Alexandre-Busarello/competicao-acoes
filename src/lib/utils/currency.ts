/**
 * Detecta se um ticker é USD (criptomoedas ou ativos internacionais)
 */
export function isUSDCurrency(ticker: string): boolean {
  const upperTicker = ticker.toUpperCase().trim();
  
  // Criptomoedas (terminam com -USD, -EUR, etc.)
  if (/-[A-Z]{3}$/.test(upperTicker)) {
    return true;
  }
  
  // Tickers internacionais (sem sufixo de bolsa brasileira e não seguem padrão brasileiro)
  if (
    !upperTicker.includes('.SA') &&
    !upperTicker.match(/^[A-Z]{4,5}\d{1,2}$/) && // Não é padrão brasileiro (LETRAS+NÚMERO)
    upperTicker.length <= 5 &&
    !upperTicker.match(/^\d/) // Não começa com número
  ) {
    return true;
  }
  
  return false;
}

/**
 * Retorna o símbolo de moeda baseado no ticker
 */
export function getCurrencySymbol(ticker: string): string {
  return isUSDCurrency(ticker) ? '$' : 'R$';
}

/**
 * Formata preço com a moeda correta
 */
export function formatPrice(price: number, ticker: string): string {
  const symbol = getCurrencySymbol(ticker);
  const isUSD = isUSDCurrency(ticker);
  
  if (isUSD) {
    return `${symbol} ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  
  return `${symbol} ${price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

