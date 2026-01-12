'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useQuery } from '@tanstack/react-query';

/**
 * Retorna símbolo de moeda baseado no código
 */
function getCurrencySymbol(currency: string): string {
  const currencyMap: Record<string, string> = {
    'BRL': 'R$',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'INR': '₹',
  };
  return currencyMap[currency] || currency;
}

/**
 * Formata valor com símbolo de moeda
 */
function formatCurrencyValue(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const locale = currency === 'USD' ? 'en-US' : 'pt-BR';
  
  return `${symbol} ${value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PortfolioSummary() {
  const { user } = useUserStore();

  // Buscar portfolio do usuário da API
  // Busca ranking mensal para monthlyReturn e ranking anual para annualReturn acumulado
  const { data: portfolioData } = useQuery({
    queryKey: ['user-portfolio', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Buscar ambos os rankings em paralelo
      const [monthlyResponse, annualResponse] = await Promise.all([
        fetch(`/api/ranking?period=mensal`),
        fetch(`/api/ranking?period=anual`),
      ]);
      
      if (!monthlyResponse.ok) return null;
      
      const monthlyData = await monthlyResponse.json();
      const userInMonthlyRanking = monthlyData.ranking?.find((entry: any) => entry.userId === user.id);
      
      // Buscar retorno acumulado anual do ranking anual
      let annualAccumulatedReturn = 0;
      if (annualResponse.ok) {
        const annualData = await annualResponse.json();
        const userInAnnualRanking = annualData.ranking?.find((entry: any) => entry.userId === user.id);
        if (userInAnnualRanking) {
          // No ranking anual, o annualReturn é o retorno acumulado real
          annualAccumulatedReturn = userInAnnualRanking.annualReturn || 0;
        }
      }
      
      return userInMonthlyRanking ? {
        monthlyReturn: userInMonthlyRanking.monthlyReturn || 0,
        annualReturn: annualAccumulatedReturn, // Retorno acumulado do ranking anual
        totalValue: userInMonthlyRanking.currentValue || 0,
      } : null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Buscar totais por moeda
  const { data: currencyTotalsData } = useQuery({
    queryKey: ['portfolio-currency-totals', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const response = await fetch('/api/portfolio/currency-totals');
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.currencyTotals || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  if (!user) return null;

  // Usar dados do portfolio ou valores padrão
  const monthlyReturn = portfolioData?.monthlyReturn ?? 0;
  const annualReturn = portfolioData?.annualReturn ?? 0;
  const totalValue = portfolioData?.totalValue ?? 0;
  const currencyTotals = currencyTotalsData || [];

  const isMonthlyPositive = monthlyReturn >= 0;
  const isAnnualPositive = annualReturn >= 0;

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Rentabilidade</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Este Mês</p>
              <div className="flex items-center gap-1">
                {isMonthlyPositive ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={`font-semibold ${
                    isMonthlyPositive ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {isMonthlyPositive ? '+' : ''}
                  {(monthlyReturn || 0).toFixed(2)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Anual</p>
              <div className="flex items-center gap-1">
                {isAnnualPositive ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={`font-semibold ${
                    isAnnualPositive ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {isAnnualPositive ? '+' : ''}
                  {(annualReturn || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Totais por moeda */}
          {currencyTotals.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-semibold mb-3 text-muted-foreground">Totais por Moeda</p>
              <div className="space-y-3">
                {currencyTotals.map((total: any) => {
                  const positionsValue = total.positionsValue || 0;
                  
                  return (
                    <div key={total.currency} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{total.currency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrencyValue(positionsValue, total.currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

