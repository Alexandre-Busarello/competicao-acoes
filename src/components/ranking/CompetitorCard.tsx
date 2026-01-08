'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Eye } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { formatUserNameWithId, getNameWithoutId } from '@/lib/utils/format-user-name';
import Link from 'next/link';
import type { Competitor } from '@/types';

interface CompetitorCardProps {
  competitor: Competitor;
  period?: 'mensal' | 'anual';
  year?: number;
  month?: number;
}

export function CompetitorCard({ competitor, period, year, month }: CompetitorCardProps) {
  const { user } = useUserStore();
  const isPremium = user?.isPremium ?? false;
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

  const getTrophyIcon = () => {
    if (competitor.rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    }
    if (competitor.rank === 2) {
      return <Medal className="h-5 w-5 text-gray-400" />;
    }
    if (competitor.rank === 3) {
      return <Award className="h-5 w-5 text-amber-600" />;
    }
    return null;
  };

  // Construir URL da carteira com período se disponível
  const getCarteiraUrl = () => {
    if (period && year !== undefined) {
      if (period === 'mensal' && month !== undefined) {
        return `/carteira/${competitor.id}/mensal/${year}/${month.toString().padStart(2, '0')}`;
      } else if (period === 'anual') {
        return `/carteira/${competitor.id}/anual/${year}`;
      }
    }
    return `/carteira/${competitor.id}`;
  };

  return (
    <Link href={getCarteiraUrl()}>
      <Card className="mx-4 mb-3 transition-all hover:shadow-md active:scale-[0.98]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                {getTrophyIcon()}
                <span className="text-lg font-bold text-muted-foreground w-8">
                  #{competitor.rank}
                </span>
              </div>
              <Avatar className="h-10 w-10 flex-shrink-0">
                {competitor.avatar ? (
                  <AvatarImage src={competitor.avatar} alt={competitor.name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {formatUserNameWithId(competitor.name, competitor.id)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {competitor.portfolio.length} ativos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isPremium && (
                <Eye 
                  className="h-4 w-4 text-primary" 
                  aria-label="Você pode ver a carteira completa"
                />
              )}
              <div className="text-right">
                <span
                  className={`text-lg font-bold ${
                    isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {monthlyReturn.toFixed(2)}%
                </span>
                <p className="text-xs text-muted-foreground">{competitor.displayedPeriod}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

