export type AssetType = 'acao' | 'fii' | 'etf' | 'renda-fixa' | 'cripto' | 'outros';

export type ETFCategory = 'acoes' | 'crypto' | 'commodities' | 'dividendos' | 'internacional' | 'setorial' | 'sustentabilidade' | 'renda-fixa';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: AssetType;
  etfCategory?: ETFCategory; // Categoria do ETF (apenas quando type === 'etf')
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  return: number; // Rentabilidade em %
  visible?: boolean; // Para controle de blur
}

export interface Portfolio {
  id: string;
  userId: string;
  assets: Asset[];
  totalValue: number;
  monthlyReturn: number;
  annualReturn?: number;
}

export interface Competitor {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  monthlyReturn: number;
  annualReturn?: number;
  displayedPeriod: 'mensal' | 'anual';
  portfolio: Asset[];
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isPremium: boolean;
  rank: number;
  monthlyReturn: number;
  annualReturn?: number;
  portfolio: Asset[];
}

export interface Transaction {
  id: string;
  userId: string;
  ticker: string;
  type: 'compra' | 'venda';
  quantity: number;
  price: number;
  date: Date;
  createdAt: Date;
}

export type RankingPeriod = 'mensal' | 'anual' | 'bruno-method';

export interface BrunoPortfolio {
  name: string;
  monthlyReturn: number;
  annualReturn?: number;
  assets: Asset[];
  description?: string;
}

export interface PollConfig {
  question: string;
  options: string[];
}

export interface Poll {
  id: string;
  postId: string;
  question: string;
  options: string[];
  totalVotes: number;
  voteCounts: number[]; // Contagem de votos por opção [count0, count1, ...]
  userVote?: {
    optionIndex: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  optionIndex: number;
  createdAt: string;
}

