'use client';

import { useEffect, useState } from 'react';
import { RankingHeader } from '@/components/ranking/RankingHeader';
import { UserRankCard } from '@/components/ranking/UserRankCard';
import { RankingList } from '@/components/ranking/RankingList';
import { useRankingStore } from '@/lib/store/rankingStore';
import { useUserStore } from '@/lib/store/userStore';
import { useRouter, usePathname } from 'next/navigation';
import { Info } from 'lucide-react';
import type { Competitor, RankingPeriod } from '@/types';
import type { RankingResult } from '@/lib/services/ranking-service';

export default function RankingPage() {
  const { period, competitors, setPeriod, setCompetitors, setTotalParticipants } = useRankingStore();
  const { user, setUser } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Resetar período para 'mensal' se estiver em 'bruno-method' ao entrar na página de ranking
  useEffect(() => {
    if (pathname === '/ranking' && period === 'bruno-method') {
      setPeriod('mensal');
    }
  }, [pathname, period, setPeriod]);

  // Buscar ranking da API quando o período mudar (apenas leitura, sem calcular)
  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      try {
        // Usa /api/ranking que apenas retorna dados já calculados
        const response = await fetch(`/api/ranking?period=${period}`);
        if (response.ok) {
          const data: RankingResult = await response.json();
          // Converter ranking para formato Competitor
          const competitorsData: Competitor[] = data.ranking.map(entry => ({
            id: entry.userId,
            name: entry.name,
            avatar: entry.avatar, // Avatar vindo da API
            rank: entry.rank,
            monthlyReturn: entry.monthlyReturn,
            annualReturn: entry.annualReturn,
            displayedPeriod: (period === 'anual' ? 'anual' : 'mensal') as 'mensal' | 'anual',
            portfolio: entry.portfolio || [], // Portfolio vindo da API
          }));
          setCompetitors(competitorsData);
          // Armazenar total de participantes do backend
          setTotalParticipants(data.totalParticipants || competitorsData.length);
          
          // Atualizar rank do usuário atual se ele estiver na lista de competidores
          if (user) {
            const userInRanking = competitorsData.find(c => c.id === user.id);
            if (userInRanking) {
              // Atualizar o rank do usuário com o valor real do ranking
              setUser({
                ...user,
                rank: userInRanking.rank,
                monthlyReturn: userInRanking.monthlyReturn,
                annualReturn: userInRanking.annualReturn,
              });
            }
          }
          
          // Usar a data do lastUpdate que vem da API (data real do cálculo)
          const updateDate = data.lastUpdate instanceof Date 
            ? data.lastUpdate 
            : new Date(data.lastUpdate);
          setLastUpdate(updateDate);
        }
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        // Em caso de erro, mantém dados mockados
      } finally {
        setIsLoading(false);
      }
    };

    if (period !== 'bruno-method') {
      fetchRanking();
    }
  }, [period, setCompetitors, setTotalParticipants, user, setUser]);

  const handlePeriodChange = (newPeriod: RankingPeriod) => {
    if (newPeriod === 'bruno-method') {
      router.push('/bruno-method');
    } else {
      setPeriod(newPeriod);
    }
  };

  // Filtrar competidores baseado no período
  const displayedCompetitors = period === 'anual' 
    ? competitors.map(c => ({
        ...c,
        monthlyReturn: c.annualReturn ?? c.monthlyReturn * 12,
        displayedPeriod: 'anual',
      })) as Competitor[]
    : competitors.map(c => ({
        ...c,
        monthlyReturn: c.monthlyReturn,
        displayedPeriod: 'mensal',
      })) as Competitor[];

  return (
    <div className="min-h-screen">
      <RankingHeader 
        period={period} 
        onPeriodChange={handlePeriodChange}
        lastUpdate={lastUpdate}
        isLoading={isLoading}
      />
      {/* Disclaimer sobre delay de atualização */}
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
      <UserRankCard />
      <RankingList competitors={displayedCompetitors} />
    </div>
  );
}

