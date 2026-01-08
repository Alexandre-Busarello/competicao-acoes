/**
 * Lista de ETFs brasileiros e internacionais organizados por categoria
 * 
 * Categorias:
 * - acoes: ETFs de índices de ações (Ibovespa, S&P 500, Small Caps, etc.)
 * - crypto: ETFs de criptomoedas
 * - commodities: ETFs de commodities (ouro, petróleo, etc.)
 * - dividendos: ETFs focados em dividendos
 * - internacional: ETFs de índices internacionais
 * - setorial: ETFs setoriais (tecnologia, energia, etc.)
 * - sustentabilidade: ETFs ESG e sustentabilidade
 * - renda-fixa: ETFs de renda fixa
 */

export interface ETFInfo {
  ticker: string;
  name: string;
  category: 'acoes' | 'crypto' | 'commodities' | 'dividendos' | 'internacional' | 'setorial' | 'sustentabilidade' | 'renda-fixa';
  exchange?: 'B3' | 'NYSE' | 'NASDAQ' | 'other';
}

export const ETFS: ETFInfo[] = [
  // ===== ETFs DE AÇÕES (Índices) =====
  { ticker: 'BOVA11', name: 'iShares Ibovespa Fundo de Índice', category: 'acoes', exchange: 'B3' },
  { ticker: 'IVVB11', name: 'iShares S&P 500', category: 'acoes', exchange: 'B3' },
  { ticker: 'SMAL11', name: 'iShares Small Cap Fundo de Índice', category: 'acoes', exchange: 'B3' },
  { ticker: 'SPXI11', name: 'iShares S&P 500 (outro)', category: 'acoes', exchange: 'B3' },
  { ticker: 'BOVV11', name: 'iShares Valor Fundo de Índice', category: 'acoes', exchange: 'B3' },
  { ticker: 'BOVB11', name: 'iShares Brasil Fundo de Índice', category: 'acoes', exchange: 'B3' },
  { ticker: 'BOVX11', name: 'iShares Brasil (outro)', category: 'acoes', exchange: 'B3' },
  { ticker: 'SMAC11', name: 'iShares Small Cap', category: 'acoes', exchange: 'B3' },
  { ticker: 'BRAX11', name: 'iShares IBrX-50 Fundo de Índice', category: 'acoes', exchange: 'B3' },
  { ticker: 'BOVS11', name: 'iShares Ibovespa Setorial', category: 'acoes', exchange: 'B3' },
  { ticker: 'BOVH11', name: 'iShares Ibovespa High Dividend', category: 'acoes', exchange: 'B3' },
  { ticker: 'BBOV11', name: 'BB ETF Ibovespa', category: 'acoes', exchange: 'B3' },
  { ticker: 'TRIG11', name: 'Trígono ETF Ações Micro Caps', category: 'acoes', exchange: 'B3' },
  
  // ===== ETFs DE CRIPTOMOEDAS =====
  { ticker: 'HASH11', name: 'Hashdex Bitcoin', category: 'crypto', exchange: 'B3' },
  { ticker: 'CRIP11', name: 'Hashdex Criptomoedas', category: 'crypto', exchange: 'B3' },
  { ticker: 'BITH11', name: 'Hashdex Bitcoin (outro)', category: 'crypto', exchange: 'B3' },
  { ticker: 'QBTC11', name: 'QR Asset Bitcoin', category: 'crypto', exchange: 'B3' },
  { ticker: 'QETH11', name: 'QR Asset Ethereum', category: 'crypto', exchange: 'B3' },
  { ticker: 'BCHG11', name: 'Hashdex Bitcoin Cash', category: 'crypto', exchange: 'B3' },
  { ticker: 'BLCK11', name: 'Hashdex Blockchain', category: 'crypto', exchange: 'B3' },
  { ticker: 'DEFI11', name: 'Hashdex DeFi', category: 'crypto', exchange: 'B3' },
  { ticker: 'ETHE11', name: 'Hashdex Ethereum', category: 'crypto', exchange: 'B3' },
  { ticker: 'NFTS11', name: 'Hashdex NFTs', category: 'crypto', exchange: 'B3' },
  { ticker: 'QDFI11', name: 'QR Asset DeFi', category: 'crypto', exchange: 'B3' },
  { ticker: 'COIN11', name: 'Buena Vista Neos Bitcoin High Income ETF', category: 'crypto', exchange: 'B3' },
  
  // ===== ETFs DE COMMODITIES =====
  { ticker: 'GOLD11', name: 'iShares Ouro', category: 'commodities', exchange: 'B3' },
  { ticker: 'GOLD', name: 'SPDR Gold Shares', category: 'commodities', exchange: 'NYSE' },
  { ticker: 'GLD', name: 'SPDR Gold Trust', category: 'commodities', exchange: 'NYSE' },
  { ticker: 'SLV', name: 'iShares Silver Trust', category: 'commodities', exchange: 'NYSE' },
  { ticker: 'USO', name: 'United States Oil Fund', category: 'commodities', exchange: 'NYSE' },
  { ticker: 'BBOI11', name: 'BB ETF Boi Gordo', category: 'commodities', exchange: 'B3' },
  { ticker: 'CORN11', name: 'BB ETF Milho', category: 'commodities', exchange: 'B3' },
  
  // ===== ETFs DE DIVIDENDOS =====
  { ticker: 'DIVO11', name: 'iShares Dividendos', category: 'dividendos', exchange: 'B3' },
  { ticker: 'FIND11', name: 'iShares Índice de Dividendos', category: 'dividendos', exchange: 'B3' },
  { ticker: 'DVFI11', name: 'iShares Dividendos FIIs', category: 'dividendos', exchange: 'B3' },
  { ticker: 'RDIV11', name: 'iShares Dividendos Reais', category: 'dividendos', exchange: 'B3' },
  { ticker: 'HIGH11', name: 'iShares High Dividend', category: 'dividendos', exchange: 'B3' },
  
  // ===== ETFs INTERNACIONAIS =====
  { ticker: 'ISUS11', name: 'iShares S&P 500 (USD)', category: 'internacional', exchange: 'B3' },
  { ticker: 'WRLD11', name: 'iShares MSCI World', category: 'internacional', exchange: 'B3' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', category: 'internacional', exchange: 'NYSE' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', category: 'internacional', exchange: 'NASDAQ' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'internacional', exchange: 'NYSE' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'internacional', exchange: 'NYSE' },
  { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', category: 'internacional', exchange: 'NYSE' },
  { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', category: 'internacional', exchange: 'NYSE' },
  { ticker: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF', category: 'internacional', exchange: 'NYSE' },
  { ticker: 'EFA', name: 'iShares MSCI EAFE ETF', category: 'internacional', exchange: 'NYSE' },
  { ticker: 'IWM', name: 'iShares Russell 2000 ETF', category: 'internacional', exchange: 'NYSE' },
  { ticker: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', category: 'internacional', exchange: 'NYSE' },
  
  // ===== ETFs SETORIAIS =====
  { ticker: 'WEB311', name: 'iShares Web 3.0', category: 'setorial', exchange: 'B3' },
  { ticker: 'TECB11', name: 'iShares Tecnologia', category: 'setorial', exchange: 'B3' },
  { ticker: 'ECOO11', name: 'iShares Sustentabilidade', category: 'setorial', exchange: 'B3' },
  { ticker: 'XLK', name: 'Technology Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLF', name: 'Financial Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLE', name: 'Energy Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLV', name: 'Health Care Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLI', name: 'Industrial Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLP', name: 'Consumer Staples Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLY', name: 'Consumer Discretionary Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLB', name: 'Materials Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLU', name: 'Utilities Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  { ticker: 'XLRE', name: 'Real Estate Select Sector SPDR Fund', category: 'setorial', exchange: 'NYSE' },
  
  // ===== ETFs DE SUSTENTABILIDADE =====
  { ticker: 'ECOO11', name: 'iShares Sustentabilidade', category: 'sustentabilidade', exchange: 'B3' },
  { ticker: 'ESG11', name: 'iShares ESG', category: 'sustentabilidade', exchange: 'B3' },
  { ticker: 'ESGU', name: 'iShares MSCI USA ESG Optimized ETF', category: 'sustentabilidade', exchange: 'NYSE' },
  { ticker: 'ESGD', name: 'iShares MSCI EAFE ESG Optimized ETF', category: 'sustentabilidade', exchange: 'NYSE' },
  { ticker: 'ESGE', name: 'iShares MSCI Emerging Markets ESG Optimized ETF', category: 'sustentabilidade', exchange: 'NYSE' },
  
  // ===== ETFs DE RENDA FIXA =====
  { ticker: 'AGTB11', name: 'iShares Renda Fixa', category: 'renda-fixa', exchange: 'B3' },
  { ticker: 'B5P211', name: 'iShares Renda Fixa IPCA+', category: 'renda-fixa', exchange: 'B3' },
  { ticker: 'B5MB11', name: 'iShares Renda Fixa CDI', category: 'renda-fixa', exchange: 'B3' },
  { ticker: 'LFTS11', name: 'iShares Renda Fixa LFT', category: 'renda-fixa', exchange: 'B3' },
  { ticker: 'LFTBETF11', name: 'iShares Renda Fixa LFT B', category: 'renda-fixa', exchange: 'B3' },
  { ticker: 'BDAP11', name: 'iShares Renda Fixa DAP', category: 'renda-fixa', exchange: 'B3' },
  { ticker: 'DEBB11', name: 'Trígono ETF Debêntures', category: 'renda-fixa', exchange: 'B3' },
  { ticker: 'FIXA11', name: 'iShares Renda Fixa DI', category: 'renda-fixa', exchange: 'B3' },
  { ticker: 'AREA11', name: 'Raul Senna ETF IPCA Rendimento', category: 'renda-fixa', exchange: 'B3' },
];

/**
 * Mapa rápido de ticker para informação do ETF
 */
export const ETF_MAP = new Map<string, ETFInfo>(
  ETFS.map(etf => [etf.ticker.toUpperCase(), etf])
);

/**
 * Busca informação de um ETF pelo ticker
 */
export function getETFInfo(ticker: string): ETFInfo | null {
  const upperTicker = ticker.toUpperCase().trim();
  // Remover sufixo .SA se presente
  const baseTicker = upperTicker.replace('.SA', '');
  return ETF_MAP.get(baseTicker) || ETF_MAP.get(upperTicker) || null;
}

/**
 * Retorna todos os tickers de ETFs conhecidos
 */
export function getKnownETFTickers(): string[] {
  return ETFS.map(etf => etf.ticker);
}

/**
 * Retorna ETFs por categoria
 */
export function getETFsByCategory(category: ETFInfo['category']): ETFInfo[] {
  return ETFS.filter(etf => etf.category === category);
}

/**
 * Retorna nome da categoria para exibição
 */
export function getCategoryDisplayName(category: ETFInfo['category']): string {
  const names: Record<ETFInfo['category'], string> = {
    'acoes': 'ETF - Ações',
    'crypto': 'ETF - Cripto',
    'commodities': 'ETF - Commodities',
    'dividendos': 'ETF - Dividendos',
    'internacional': 'ETF - Internacional',
    'setorial': 'ETF - Setorial',
    'sustentabilidade': 'ETF - Sustentabilidade',
    'renda-fixa': 'ETF - Renda Fixa',
  };
  return names[category];
}

