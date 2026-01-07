'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useTransactionStore } from '@/lib/store/transactionStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PortfolioSummary() {
  const { user } = useUserStore();
  const { getTransactionsByUser } = useTransactionStore();

  if (!user) return null;

  const transactions = getTransactionsByUser(user.id);
  
  // Calcular valores baseados nas transações (simplificado para MVP)
  const totalValue = 50000; // Mock
  const todayReturn = user.monthlyReturn * 0.1; // Mock - 10% do mensal
  const monthlyReturn = user.monthlyReturn;

  const isTodayPositive = todayReturn >= 0;
  const isMonthlyPositive = monthlyReturn >= 0;

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
            {totalValue.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hoje</p>
              <div className="flex items-center gap-1">
                {isTodayPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`font-semibold ${
                    isTodayPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isTodayPositive ? '+' : ''}
                  {todayReturn.toFixed(2)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Este Mês</p>
              <div className="flex items-center gap-1">
                {isMonthlyPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`font-semibold ${
                    isMonthlyPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isMonthlyPositive ? '+' : ''}
                  {monthlyReturn.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

