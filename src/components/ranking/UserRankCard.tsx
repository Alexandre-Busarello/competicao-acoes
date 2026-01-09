'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowUp } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useRankingStore } from '@/lib/store/rankingStore';
import Link from 'next/link';
import type { Competitor } from '@/types';

interface UserRankCardProps {
  competitors?: Competitor[];
  totalParticipants?: number;
  displayedPeriod?: 'mensal' | 'anual';
}

export function UserRankCard({ 
  competitors: propCompetitors,
  totalParticipants: propTotalParticipants,
  displayedPeriod = 'mensal'
}: UserRankCardProps = {}) {
  const { user } = useUserStore();
  const { competitors: storeCompetitors, totalParticipants: storeTotalParticipants } = useRankingStore();

  // Usar props se fornecidas, senão usar do store
  const competitors = propCompetitors ?? storeCompetitors;
  const totalParticipants = propTotalParticipants ?? storeTotalParticipants;

  if (!user) return null;
  
  // Encontrar o usuário atual na lista de competidores
  const userInRanking = competitors.find(c => c.id === user.id);
  
  // Usar monthlyReturn do ranking se disponível, senão do userStore, senão 0
  const monthlyReturn = userInRanking?.monthlyReturn ?? (user as any).monthlyReturn ?? 0;
  const isPositive = monthlyReturn >= 0;
  
  // Se o usuário está na lista, usar o rank dele de lá
  // Caso contrário, usar o rank do userStore
  const displayRank = userInRanking?.rank ?? (user as any).rank ?? 0;
  
  // Usar o total de participantes do backend (total real do ranking completo)
  // Se não estiver disponível ainda, usar fallback baseado nos competidores exibidos
  // IMPORTANTE: Se o usuário não está na lista e seu rank é maior que o total,
  // garantir que o total seja pelo menos igual ao rank (pois ele está fora do top N)
  let totalCompetitors: number | null = null;
  if (totalParticipants > 0) {
    totalCompetitors = userInRanking 
      ? totalParticipants 
      : Math.max(totalParticipants, displayRank);
  } else if (competitors.length > 0) {
    totalCompetitors = userInRanking 
      ? competitors.length 
      : Math.max(competitors.length, displayRank);
  }

  const periodLabel = displayedPeriod === 'anual' ? 'este ano' : 'este mês';

  return (
    <Card className="mx-4 mt-4 mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Sua Posição</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">#{displayRank}</span>
              {totalCompetitors !== null && totalCompetitors > 0 && (
                <span className="text-sm text-muted-foreground">de {totalCompetitors}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp
                className={`h-4 w-4 ${isPositive ? 'text-success' : 'text-destructive'}`}
              />
              <span
                className={`text-sm font-semibold ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {isPositive ? '+' : ''}
                {monthlyReturn.toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground">{periodLabel}</span>
            </div>
          </div>
          <Link href="/minha-carteira">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowUp className="h-4 w-4" />
              Subir no Ranking
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

