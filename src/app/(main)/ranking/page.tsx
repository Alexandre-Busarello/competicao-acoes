'use client';

import { useEffect, useState } from 'react';
import { RankingHeader } from '@/components/ranking/RankingHeader';
import { UserRankCard } from '@/components/ranking/UserRankCard';
import { RankingList } from '@/components/ranking/RankingList';
import { useRankingStore } from '@/lib/store/rankingStore';
import { useUserStore } from '@/lib/store/userStore';
import { useRouter, usePathname } from 'next/navigation';
import { Info, Trophy } from 'lucide-react';
import type { Competitor, RankingPeriod } from '@/types';
import type { RankingResult } from '@/lib/services/ranking-service';
import { SHOW_MIC_METHOD } from '@/lib/config/features';

export default function RankingPage() {
  const { period, competitors, setPeriod, totalParticipants, lastUpdate, isLoading } = useRankingStore();
  const { user } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  // Resetar período para 'mensal' se estiver em 'bruno-method' ao entrar na página de ranking
  useEffect(() => {
    if (pathname === '/ranking' && period === 'bruno-method' && !SHOW_MIC_METHOD) {
      setPeriod('mensal');
    }
  }, [pathname, period, setPeriod]);

  const handlePeriodChange = (newPeriod: RankingPeriod) => {
    if (newPeriod === 'bruno-method' && SHOW_MIC_METHOD) {
      router.push('/bruno-method');
    } else {
      setPeriod(newPeriod);
    }
  };

  // Filtrar competidores baseado no período
  const displayedCompetitors = period === 'anual' 
    ? competitors.map(c => ({
        ...c,
        monthlyReturn: c.annualReturn ?? c.monthlyReturn, // Usa annualReturn se disponível, senão mantém monthlyReturn
        displayedPeriod: 'anual',
      })) as Competitor[]
    : competitors.map(c => ({
        ...c,
        monthlyReturn: c.monthlyReturn,
        displayedPeriod: 'mensal',
      })) as Competitor[];

  const hasCompetitors = displayedCompetitors.length > 0;

  return (
    <div className="min-h-screen">
      <RankingHeader 
        period={period} 
        onPeriodChange={handlePeriodChange}
        lastUpdate={lastUpdate}
        isLoading={isLoading}
      />
      {/* Mostrar loading ou conteúdo baseado no estado */}
      {isLoading ? (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg animate-pulse">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <p className="text-muted-foreground">Carregando ranking...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Disclaimer sobre delay de atualização - só mostra se há competidores */}
          {hasCompetitors && (
          <div className="container mx-auto px-4 py-2 max-w-4xl">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Atenção:</strong> O ranking é atualizado automaticamente a cada 15 minutos. 
                  Transações recém-cadastradas podem levar até 15 minutos para aparecer no ranking.
                </span>
              </p>
            </div>
          </div>
          )}
          {/* UserRankCard só aparece se há competidores e usuário está logado */}
          {hasCompetitors && <UserRankCard />}
          <RankingList competitors={displayedCompetitors} />
        </>
      )}
    </div>
  );
}

