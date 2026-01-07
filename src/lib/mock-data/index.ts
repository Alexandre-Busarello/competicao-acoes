import type { Competitor, BrunoPortfolio, Asset, AssetType } from '@/types';

// Tickers comuns para mock (brasileiros, internacionais e criptomoedas)
export const COMMON_TICKERS = [
  // Brasileiros
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'MGLU3', 'RENT3',
  'BBAS3', 'B3SA3', 'SUZB3', 'ELET3', 'HAPV3', 'RADL3', 'VIVT3', 'CMIG4',
  'CSAN3', 'GGBR4', 'USIM5', 'CYRE3', 'HYPE3', 'LREN3', 'RAIL3', 'SAPR11',
  'HGLG11', 'XPML11', 'VISC11', 'KNRI11', 'BRCR11', 'HGRE11',
  // Internacionais (NYSE/NASDAQ)
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM',
  'V', 'JNJ', 'WMT', 'MA', 'PG', 'UNH', 'DIS', 'HD',
  // Criptomoedas
  'BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD', 'ADA-USD',
  'DOGE-USD', 'MATIC-USD', 'AVAX-USD', 'DOT-USD', 'LINK-USD', 'UNI-USD'
];

const ASSET_TYPES: AssetType[] = ['acao', 'fii', 'renda-fixa', 'outros'];

/**
 * Detecta o tipo de ativo baseado no ticker
 */
function detectAssetType(ticker: string): AssetType {
  const upperTicker = ticker.toUpperCase();
  
  // Criptomoedas (terminam com -USD, -BRL, etc.)
  if (/-[A-Z]{3}$/.test(upperTicker)) {
    return 'outros'; // Criptomoedas como "outros"
  }
  
  // FIIs brasileiros (geralmente terminam com 11)
  if (/11$/.test(upperTicker) && upperTicker.includes('.')) {
    return 'fii';
  }
  
  // Tickers internacionais (sem sufixo de bolsa ou com sufixos conhecidos)
  if (/\.(TO|L|PA|AS|DE|F|HK|T|KS|SS|MX|BA|V|SN|SW|ST|CO|OL|HE|MC|MI|TA|IL|VI|BR|LS|AT|RG|VS|DU|HM|MU|HA)$/.test(upperTicker)) {
    return 'acao'; // Ações internacionais
  }
  
  // Tickers brasileiros (padrão 4-5 letras + número)
  if (/^[A-Z]{4,5}\d{1,2}\.SA$/.test(upperTicker) || /^[A-Z]{4,5}\d{1,2}$/.test(upperTicker)) {
    // FIIs terminam com 11
    if (/11/.test(upperTicker)) {
      return 'fii';
    }
    return 'acao';
  }
  
  // Tickers curtos (1-5 caracteres) geralmente são ações internacionais
  if (/^[A-Z]{1,5}$/.test(upperTicker)) {
    return 'acao';
  }
  
  // Default
  return 'acao';
}

// Função para gerar um ativo mockado
function generateMockAsset(index: number, visible: boolean = false): Asset {
  const ticker = COMMON_TICKERS[index % COMMON_TICKERS.length];
  const type = detectAssetType(ticker);
  const quantity = Math.floor(Math.random() * 1000) + 50;
  const averagePrice = Math.random() * 100 + 10;
  const currentPrice = averagePrice * (0.85 + Math.random() * 0.3);
  const returnValue = ((currentPrice - averagePrice) / averagePrice) * 100;

  // Nome mais descritivo baseado no tipo
  let name = ticker;
  if (type === 'acao') {
    name = `${ticker} - Ação`;
  } else if (type === 'fii') {
    name = `${ticker} - FII`;
  } else if (ticker.includes('-USD')) {
    name = `${ticker} - Criptomoeda`;
  } else {
    name = `${ticker} - Ativo`;
  }

  return {
    id: `asset-${index}`,
    ticker,
    name,
    type,
    quantity,
    averagePrice: Number(averagePrice.toFixed(2)),
    currentPrice: Number(currentPrice.toFixed(2)),
    return: Number(returnValue.toFixed(2)),
    visible,
  };
}

// Função para gerar um competidor mockado
function generateMockCompetitor(id: number, rank: number): Competitor {
  const names = [
    'Trader Vencedor', 'Investidor Pro', 'Carteira Elite', 'Mestre dos Ativos',
    'Estrategista Financeiro', 'Análise Profunda', 'Mercado Inteligente',
    'Portfolio Master', 'Investimentos Premium', 'Carteira Seletiva',
    'Trader Experiente', 'Análise Técnica', 'Fundamentalista', 'Value Investor',
    'Growth Investor', 'Dividendos Fáceis', 'Renda Passiva', 'FIIs Premium',
    'Ações Blue Chip', 'Small Caps', 'Momentum Trader', 'Swing Trader',
    'Day Trader Pro', 'Long Term Investor', 'Dividend Hunter', 'FII Collector',
    'Stock Picker', 'Market Maker', 'Portfolio Builder', 'Asset Manager'
  ];

  const name = names[id % names.length];
  const monthlyReturn = -5 + Math.random() * 30; // Entre -5% e +25%
  const assetCount = Math.floor(Math.random() * 8) + 3; // Entre 3 e 10 ativos
  
  const assets: Asset[] = [];
  for (let i = 0; i < assetCount; i++) {
    assets.push(generateMockAsset(id * 100 + i, i === 0)); // Primeiro visível
  }

  return {
    id: `competitor-${id}`,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    rank,
    monthlyReturn: Number(monthlyReturn.toFixed(2)),
    annualReturn: monthlyReturn * 12, // Simplificado
    portfolio: assets,
    displayedPeriod: 'mensal',
  };
}

// Gerar lista de competidores (25 competidores)
export function generateMockCompetitors(): Competitor[] {
  const competitors: Competitor[] = [];
  for (let i = 0; i < 25; i++) {
    competitors.push(generateMockCompetitor(i, i + 1));
  }
  // Ordenar por rentabilidade mensal (maior primeiro)
  return competitors.sort((a, b) => b.monthlyReturn - a.monthlyReturn).map((c, index) => ({
    ...c,
    rank: index + 1,
  }));
}

// Carteira do Bruno Chimarelli
export function generateBrunoPortfolio(): BrunoPortfolio {
  const assets: Asset[] = [
    {
      id: 'bruno-asset-1',
      ticker: 'PETR4',
      name: 'Petrobras - Ação',
      type: 'acao',
      quantity: 500,
      averagePrice: 32.50,
      currentPrice: 36.20,
      return: 11.38,
      visible: true, // Primeiro sempre visível
    },
    {
      id: 'bruno-asset-2',
      ticker: 'VALE3',
      name: 'Vale - Ação',
      type: 'acao',
      quantity: 300,
      averagePrice: 65.80,
      currentPrice: 72.15,
      return: 9.65,
      visible: false,
    },
    {
      id: 'bruno-asset-3',
      ticker: 'ITUB4',
      name: 'Itaú Unibanco - Ação',
      type: 'acao',
      quantity: 200,
      averagePrice: 28.90,
      currentPrice: 31.45,
      return: 8.82,
      visible: false,
    },
    {
      id: 'bruno-asset-4',
      ticker: 'HGLG11',
      name: 'CSHG Logística - FII',
      type: 'fii',
      quantity: 1000,
      averagePrice: 95.50,
      currentPrice: 102.30,
      return: 7.12,
      visible: false,
    },
    {
      id: 'bruno-asset-5',
      ticker: 'XPML11',
      name: 'XP Malls - FII',
      type: 'fii',
      quantity: 800,
      averagePrice: 88.20,
      currentPrice: 94.50,
      return: 7.14,
      visible: false,
    },
    {
      id: 'bruno-asset-6',
      ticker: 'WEGE3',
      name: 'WEG - Ação',
      type: 'acao',
      quantity: 150,
      averagePrice: 42.30,
      currentPrice: 48.90,
      return: 15.60,
      visible: false,
    },
  ];

  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.currentPrice * asset.quantity,
    0
  );
  const weightedReturn = assets.reduce(
    (sum, asset) => {
      const weight = (asset.currentPrice * asset.quantity) / totalValue;
      return sum + asset.return * weight;
    },
    0
  );

  return {
    name: 'Bruno Chimarelli',
    monthlyReturn: Number(weightedReturn.toFixed(2)),
    annualReturn: Number((weightedReturn * 12).toFixed(2)),
    assets,
    description: 'Esta é a minha seleção oficial para o mês. Uma estratégia focada em ações de qualidade e FIIs com boa distribuição de dividendos.',
  };
}

// Função para inicializar dados mockados
export function initializeMockData() {
  const competitors = generateMockCompetitors();
  const brunoPortfolio = generateBrunoPortfolio();

  // Salvar no localStorage se não existir
  if (typeof window !== 'undefined') {
    const storedCompetitors = localStorage.getItem('competicao_competitors');
    if (!storedCompetitors) {
      // Os stores do Zustand vão persistir automaticamente
      return { competitors, brunoPortfolio };
    }
  }

  return { competitors, brunoPortfolio };
}

// Função para resetar dados mockados (útil para desenvolvimento)
export function resetMockData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('competicao_competitors');
    localStorage.removeItem('competicao_user');
    localStorage.removeItem('competicao_transactions');
  }
}

