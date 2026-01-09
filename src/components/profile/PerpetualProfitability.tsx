'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface PerpetualProfitabilityProps {
  userId: string;
}

export function PerpetualProfitability({ userId }: PerpetualProfitabilityProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['perpetual-profitability', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/perpetual-profitability`);
      if (!response.ok) throw new Error('Failed to fetch profitability');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const profitability = data.profitability || 0;
  const isPositive = profitability >= 0;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-3">
          {isPositive ? (
            <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-green-500 flex-shrink-0" />
          ) : (
            <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 text-red-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Rentabilidade Perpétua</p>
            <p
              className={`text-2xl sm:text-3xl font-bold ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {profitability.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

