import type { AssetType, ETFCategory } from '@/types';
import { getETFInfo } from '@/lib/data/etfs';

/**
 * Determina o tipo de ativo baseado no ticker
 * 
 * Padrões brasileiros:
 * - Ações: 4-5 letras + 1-2 números (PETR4, VALE3, ITUB4)
 * - ETFs: geralmente terminam com 11 (IVVB11, BOVA11, GOLD11, SMAL11)
 * - FIIs: geralmente terminam com 11 mas têm padrões específicos (HGLG11, XPLG11, HGRU11)
 * - Renda Fixa: geralmente começam com TESOURO, NTN, LFT, etc.
 * - Criptomoedas: terminam com -USD ou são conhecidas (BTC, ETH, etc.)
 */
export function determineAssetType(ticker: string, quoteData?: any): AssetType {
  const upperTicker = ticker.toUpperCase().trim();
  
  // Criptomoedas - verificar padrão -USD, -BRL, etc.
  if (/-[A-Z]{3}$/.test(upperTicker)) {
    return 'cripto';
  }
  
  // Criptomoedas conhecidas sem sufixo
  const cryptoList = [
    'BTC', 'BITCOIN', 'ETH', 'ETHEREUM', 'BNB', 'SOL', 'SOLANA',
    'XRP', 'ADA', 'CARDANO', 'DOGE', 'DOGECOIN', 'MATIC', 'POLYGON',
    'AVAX', 'AVALANCHE', 'DOT', 'POLKADOT', 'LINK', 'CHAINLINK',
    'UNI', 'UNISWAP', 'LTC', 'LITECOIN'
  ];
  
  if (cryptoList.includes(upperTicker)) {
    return 'cripto';
  }
  
  // IMPORTANTE: Verificar ETFs conhecidos ANTES de usar quoteData
  // porque o Yahoo Finance pode classificar ETFs como "equity" ou "stock"
  // Remover sufixo .SA se presente para comparação
  const baseTicker = upperTicker.replace('.SA', '');
  
  // Verificar se é ETF conhecido usando arquivo de dados
  const etfInfo = getETFInfo(baseTicker);
  if (etfInfo) {
    return 'etf';
  }
  
  // Verificar se há dados do Yahoo Finance que possam ajudar
  if (quoteData) {
    const quoteType = quoteData.quoteType?.toLowerCase() || '';
    const longName = (quoteData.longName || quoteData.shortName || '').toLowerCase();
    
    // Verificar se é ETF (Exchange Traded Fund)
    // IMPORTANTE: Verificar ETF antes de FII, pois ETFs também podem ter "etf" no quoteType
    if (
      quoteType.includes('etf') ||
      longName.includes('exchange traded fund') ||
      longName.includes('índice') ||
      longName.includes('index fund')
    ) {
      // Verificar se não é FII (Fundos Imobiliários)
      if (
        longName.includes('fundo imobiliário') ||
        longName.includes('fii') ||
        longName.includes('real estate')
      ) {
        return 'fii';
      }
      return 'etf';
    }
    
    // Verificar se é FII (Fundos Imobiliários)
    if (
      longName.includes('fundo imobiliário') ||
      longName.includes('fii') ||
      longName.includes('real estate')
    ) {
      return 'fii';
    }
    
    // Verificar se é ação (stock) - mas só se não for ETF conhecido
    if (quoteType === 'equity' || quoteType === 'stock') {
      return 'acao';
    }
  }
  
  // Padrões brasileiros
  // Tickers que terminam com 11 podem ser ETFs ou FIIs
  // FIIs geralmente têm padrões específicos (ex: HGLG11, XPLG11, HGRU11)
  // Se não está na lista de ETFs conhecidos e termina com 11, assumir FII
  if (/11$/.test(baseTicker)) {
    return 'fii';
  }
  
  // Renda Fixa - padrões comuns
  if (
    upperTicker.startsWith('TESOURO') ||
    upperTicker.startsWith('NTN') ||
    upperTicker.startsWith('LFT') ||
    upperTicker.startsWith('LTN') ||
    upperTicker.startsWith('CDB') ||
    upperTicker.startsWith('LCI') ||
    upperTicker.startsWith('LCA')
  ) {
    return 'renda-fixa';
  }
  
  // Ações brasileiras: padrão 4-5 letras + 1-2 números
  // Ex: PETR4, VALE3, ITUB4, USIM5, BBDC4
  const brazilianStockPattern = /^[A-Z]{4,5}\d{1,2}$/;
  if (brazilianStockPattern.test(upperTicker)) {
    return 'acao';
  }
  
  // Tickers internacionais sem sufixo de bolsa (geralmente ações)
  if (
    !upperTicker.includes('.') &&
    upperTicker.length <= 5 &&
    /^[A-Z]+$/.test(upperTicker)
  ) {
    return 'acao';
  }
  
  // Tickers com sufixo .SA (Brasil) - já processado acima (baseTicker)
  // Se chegou aqui e tem .SA mas não termina com 11, é ação
  if (upperTicker.endsWith('.SA')) {
    return 'acao';
  }
  
  // Padrão não reconhecido - retorna "outros"
  return 'outros';
}

/**
 * Obtém a categoria do ETF se o ativo for um ETF conhecido
 */
export function getETFCategory(ticker: string): ETFCategory | undefined {
  const upperTicker = ticker.toUpperCase().trim();
  const baseTicker = upperTicker.replace('.SA', '');
  const etfInfo = getETFInfo(baseTicker);
  return etfInfo?.category;
}

/**
 * Obtém o nome do ativo, tentando usar dados do Yahoo Finance ou gerando um nome padrão
 */
export function getAssetName(ticker: string, quoteData?: any): string {
  // Primeiro tentar buscar nome do arquivo de ETFs
  const upperTicker = ticker.toUpperCase().trim();
  const baseTicker = upperTicker.replace('.SA', '');
  const etfInfo = getETFInfo(baseTicker);
  if (etfInfo) {
    return etfInfo.name;
  }
  
  if (quoteData) {
    return (
      quoteData.longName ||
      quoteData.shortName ||
      quoteData.displayName ||
      quoteData.symbol ||
      ticker
    );
  }
  
  // Se não há dados do quote, retorna o ticker normalizado
  return ticker;
}

/**
 * Verifica se um ativo permite quantidades fracionadas (menores que 1)
 * Criptomoedas e ativos estrangeiros normalmente permitem frações
 */
export function allowsFractionalQuantity(ticker: string): boolean {
  const upperTicker = ticker.toUpperCase().trim();
  const assetType = determineAssetType(upperTicker);
  
  // Criptomoedas sempre permitem frações
  if (assetType === 'cripto') {
    return true;
  }
  
  // Ativos estrangeiros (sem sufixo .SA e não seguem padrão brasileiro) permitem frações
  // Padrão brasileiro: 4-5 letras + 1-2 números (ex: PETR4, VALE3)
  const isBrazilianPattern = /^[A-Z]{4,5}\d{1,2}$/.test(upperTicker);
  const hasBrazilianSuffix = upperTicker.includes('.SA');
  
  // Se não é padrão brasileiro e não tem sufixo brasileiro, provavelmente é ativo estrangeiro
  if (!isBrazilianPattern && !hasBrazilianSuffix) {
    // Verificar se termina com sufixo de moeda (cripto) - já tratado acima
    // Verificar se é ticker internacional simples (ex: AAPL, TSLA, MSFT)
    if (
      upperTicker.length <= 5 &&
      /^[A-Z]+$/.test(upperTicker) &&
      !upperTicker.match(/^\d/)
    ) {
      return true;
    }
  }
  
  // Ativos brasileiros (ações, FIIs, renda fixa) não permitem frações
  return false;
}

