'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowUp } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useRankingStore } from '@/lib/store/rankingStore';
import Link from 'next/link';

export function UserRankCard() {
  const { user } = useUserStore();
  const { competitors, totalParticipants } = useRankingStore();

  if (!user) return null;

  const isPositive = user.monthlyReturn >= 0;
  
  // Encontrar o usuário atual na lista de competidores
  const userInRanking = competitors.find(c => c.id === user.id);
  
  // Se o usuário está na lista, usar o rank dele de lá
  // Caso contrário, usar o rank do userStore
  const displayRank = userInRanking?.rank ?? user.rank;
  
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
                className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
              />
              <span
                className={`text-sm font-semibold ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {isPositive ? '+' : ''}
                {user.monthlyReturn.toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground">este mês</span>
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

