/**
 * Utilitário para ofuscar ticker e valores em mensagens do feed
 * Para usuários não PRO, o ticker e valores devem aparecer ofuscados
 */

/**
 * Ofusca o ticker e valores monetários em uma mensagem markdown
 * Substitui todas as ocorrências de **TICKER** por **XXXX**
 * Também substitui valores monetários (R$ X.XX) por R$ XXXX
 */
export function obfuscateTickerInMessage(
  message: string,
  ticker: string,
  price?: number
): string {
  if (!message) {
    return message;
  }

  let obfuscated = message;

  // Se tem ticker, ofuscar ticker
  if (ticker) {
    const tickerUpper = ticker.toUpperCase();
    const tickerLower = ticker.toLowerCase();
    
    // Substituir **TICKER** por **XXXX**
    obfuscated = obfuscated.replace(
      new RegExp(`\\*\\*${tickerUpper}\\*\\*`, 'gi'),
      '**XXXX**'
    );
    
    // Substituir **ticker** (minúsculo) por **XXXX**
    obfuscated = obfuscated.replace(
      new RegExp(`\\*\\*${tickerLower}\\*\\*`, 'gi'),
      '**XXXX**'
    );
    
    // Substituir ticker isolado (não dentro de outras palavras)
    // Usa word boundary (\b) para garantir que não substitua dentro de outras palavras
    obfuscated = obfuscated.replace(
      new RegExp(`\\b${tickerUpper}\\b`, 'g'),
      'XXXX'
    );
    
    obfuscated = obfuscated.replace(
      new RegExp(`\\b${tickerLower}\\b`, 'g'),
      'XXXX'
    );
  }

  // Se tem preço, ofuscar valores monetários
  if (price !== undefined && price !== null) {
    // Primeiro, ofuscar TODOS os valores monetários genéricos (mais abrangente)
    // Isso garante que capture todos os formatos: R$ X.XX, R$ XXXX.XX, etc.
    
    // Substituir **R$ X.XX** ou **R$ XXXX.XX** por **R$ XXXX**
    obfuscated = obfuscated.replace(
      /\*\*R\$\s*\d+[\.,]\d{2}\*\*/gi,
      '**R$ XXXX**'
    );
    
    // Substituir R$ X.XX ou R$ XXXX.XX (sem markdown) por R$ XXXX
    obfuscated = obfuscated.replace(
      /R\$\s*\d+[\.,]\d{2}/gi,
      'R$ XXXX'
    );
    
    // Também capturar valores sem decimais: **R$ XXXX** ou R$ XXXX
    obfuscated = obfuscated.replace(
      /\*\*R\$\s*\d+\*\*/gi,
      '**R$ XXXX**'
    );
    
    obfuscated = obfuscated.replace(
      /R\$\s*\d+(?![\.,]\d)/gi,
      'R$ XXXX'
    );
  }
  
  return obfuscated;
}

/**
 * Ofusca o ticker e preço em um objeto de transação
 * Mantém todas as propriedades originais, apenas alterando ticker e price
 */
export function obfuscateTickerInTransaction(transaction: {
  ticker: string;
  type: string;
  quantity: number;
  price: number;
  date: Date;
  [key: string]: any;
}): {
  ticker: string;
  type: string;
  quantity: number;
  price: number;
  date: Date;
  [key: string]: any;
} {
  return {
    ...transaction,
    ticker: 'XXXX',
    price: 0, // Ofuscar preço também
  };
}

