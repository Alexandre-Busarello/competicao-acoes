export interface PriceData {
  ticker: string;
  price: number;
  name?: string;
  currency?: string;
  lastUpdate: Date;
}

export interface PriceMap {
  [ticker: string]: number;
}

export interface PriceCache {
  prices: PriceMap;
  lastUpdate: Date | null;
  tickers: Set<string>;
}

export interface TickerValidationResult {
  valid: boolean;
  ticker: string;
  name?: string;
  price?: number;
  currency?: string; // Moeda do ativo (BRL, USD, EUR, etc.)
  error?: string;
}

export interface BatchPriceResult {
  [ticker: string]: {
    price: number;
    name?: string;
    error?: string;
  };
}

