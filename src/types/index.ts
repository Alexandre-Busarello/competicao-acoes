export type AssetType = 'acao' | 'fii' | 'renda-fixa' | 'cripto' | 'outros';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: AssetType;
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

