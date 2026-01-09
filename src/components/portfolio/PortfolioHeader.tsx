'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { formatUserNameWithId, getNameWithoutId } from '@/lib/utils/format-user-name';
import Link from 'next/link';
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
          <Link 
            href={`/perfil/${competitor.id}`}
            className="group relative mb-4"
          >
            <Avatar className="h-20 w-20 cursor-pointer ring-2 ring-transparent group-hover:ring-primary transition-all group-hover:scale-105">
              <AvatarImage src={competitor.avatar} alt={competitor.name} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-3 w-3" />
            </div>
          </Link>
          <Link 
            href={`/perfil/${competitor.id}`}
            className="group inline-flex items-center gap-2 mb-2"
          >
            <h1 className="text-2xl font-bold text-primary group-hover:underline cursor-pointer transition-all">
              {formatUserNameWithId(competitor.name, competitor.id)}
            </h1>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100" />
          </Link>
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

