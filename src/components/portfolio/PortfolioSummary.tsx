'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useQuery } from '@tanstack/react-query';

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

  if (!user) return null;

  // Usar dados do portfolio ou valores padrão
  const monthlyReturn = portfolioData?.monthlyReturn ?? 0;
  const annualReturn = portfolioData?.annualReturn ?? 0;
  const totalValue = portfolioData?.totalValue ?? 0;

  const isMonthlyPositive = monthlyReturn >= 0;
  const isAnnualPositive = annualReturn >= 0;

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Saldo Atual</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-6">
            R${' '}
            {(totalValue || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          <div className="grid grid-cols-2 gap-4">
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
        </CardContent>
      </Card>
    </div>
  );
}

