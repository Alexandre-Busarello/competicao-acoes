'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatUserNameWithId, getNameWithoutId } from '@/lib/utils/format-user-name';
import type { Competitor } from '@/types';

interface PortfolioHeaderProps {
  competitor: Competitor;
}

export function PortfolioHeader({ competitor }: PortfolioHeaderProps) {
  const monthlyReturn = competitor.monthlyReturn ?? 0;
  const isPositive = monthlyReturn >= 0;
  // Remover ID do nome para gerar iniciais corretamente
  const nameWithoutId = getNameWithoutId(competitor.name);
  const initials = nameWithoutId
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-gradient-to-br from-primary/10 to-background border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={competitor.avatar} alt={competitor.name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold mb-2">
            {formatUserNameWithId(competitor.name, competitor.id)}
          </h1>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <span
              className={`text-3xl font-bold ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {monthlyReturn.toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Rentabilidade Mensal</p>
        </div>
      </div>
    </div>
  );
}

