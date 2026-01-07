/**
 * Tipos TypeScript para integração futura com Supabase
 * 
 * Schema do banco de dados (preparado para implementação):
 * 
 * Tables:
 * - users: id, name, email, avatar_url, is_premium, created_at, updated_at
 * - transactions: id, user_id, ticker, type, quantity, price, date, created_at
 * - portfolios: id, user_id, total_value, monthly_return, annual_return, updated_at
 * - portfolio_assets: id, portfolio_id, ticker, name, type, quantity, average_price, current_price, return_percentage
 * - competitors: id, user_id, rank, monthly_return, annual_return, period
 * - bruno_portfolio: id, monthly_return, annual_return, description, updated_at
 * - bruno_portfolio_assets: id, bruno_portfolio_id, ticker, name, type, quantity, average_price, current_price, return_percentage
 */

export interface SupabaseUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseTransaction {
  id: string;
  user_id: string;
  ticker: string;
  type: 'compra' | 'venda';
  quantity: number;
  price: number;
  date: string;
  created_at: string;
}

export interface SupabasePortfolio {
  id: string;
  user_id: string;
  total_value: number;
  monthly_return: number;
  annual_return?: number;
  updated_at: string;
}

export interface SupabasePortfolioAsset {
  id: string;
  portfolio_id: string;
  ticker: string;
  name: string;
  type: 'acao' | 'fii' | 'renda-fixa' | 'outros';
  quantity: number;
  average_price: number;
  current_price: number;
  return_percentage: number;
}

export interface SupabaseCompetitor {
  id: string;
  user_id: string;
  rank: number;
  monthly_return: number;
  annual_return?: number;
  period: 'mensal' | 'anual';
}

export interface SupabaseBrunoPortfolio {
  id: string;
  monthly_return: number;
  annual_return?: number;
  description?: string;
  updated_at: string;
}

export interface SupabaseBrunoPortfolioAsset {
  id: string;
  bruno_portfolio_id: string;
  ticker: string;
  name: string;
  type: 'acao' | 'fii' | 'renda-fixa' | 'outros';
  quantity: number;
  average_price: number;
  current_price: number;
  return_percentage: number;
}

