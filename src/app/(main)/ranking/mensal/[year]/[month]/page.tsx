'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RankingHeader } from '@/components/ranking/RankingHeader';
import { UserRankCard } from '@/components/ranking/UserRankCard';
import { RankingList } from '@/components/ranking/RankingList';
import { ConversionBanner } from '@/components/ranking/ConversionBanner';
import { PeriodSelector } from '@/components/ranking/PeriodSelector';
import { PeriodIndicator } from '@/components/ranking/PeriodIndicator';
import { useRankingStore } from '@/lib/store/rankingStore';
import { useUserStore } from '@/lib/store/userStore';
import { useAuth } from '@/lib/auth/client';
import { Info, Trophy } from 'lucide-react';
import type { Competitor, RankingPeriod } from '@/types';
import { SHOW_MIC_METHOD } from '@/lib/config/features';
import { isValidPeriod, getCurrentPeriod } from '@/lib/utils/period-utils';

export default function RankingMensalPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const { isAuthenticated } = useAuth();
  
  const year = parseInt(params.year as string, 10);
  const month = parseInt(params.month as string, 10);
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validar parâmetros e redirecionar se inválidos
  useEffect(() => {
    if (!isValidPeriod(year, month)) {
      const current = getCurrentPeriod();
      router.replace(`/ranking/mensal/${current.year}/${current.month.toString().padStart(2, '0')}`);
      return;
    }
  }, [year, month, router]);

  // Buscar ranking do período específico
  useEffect(() => {
    if (!isValidPeriod(year, month)) return;

    const fetchRanking = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/ranking?period=mensal&year=${year}&month=${month}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar ranking');
        }
        const data = await response.json();
        
        const competitorsList: Competitor[] = data.ranking.map((entry: any) => ({
          id: entry.userId,
          name: entry.name,
          avatar: entry.avatar,
          rank: entry.rank,
          monthlyReturn: entry.monthlyReturn,
          annualReturn: entry.annualReturn,
          displayedPeriod: 'mensal' as const,
          portfolio: entry.portfolio || [],
        }));
        
        setCompetitors(competitorsList);
        setTotalParticipants(data.totalParticipants || 0);
        setLastUpdate(data.lastUpdate ? new Date(data.lastUpdate) : null);
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, [year, month]);

  const handlePeriodChange = (newPeriod: RankingPeriod) => {
    const current = getCurrentPeriod();
    if (newPeriod === 'bruno-method' && SHOW_MIC_METHOD) {
      router.push('/bruno-method');
    } else if (newPeriod === 'anual') {
      router.push(`/ranking/anual/${year}`);
    } else {
      router.push(`/ranking/mensal/${current.year}/${current.month.toString().padStart(2, '0')}`);
    }
  };

  const displayedCompetitors = competitors.map(c => ({
    ...c,
    monthlyReturn: c.monthlyReturn,
    displayedPeriod: 'mensal' as const,
  })) as Competitor[];

  const hasCompetitors = displayedCompetitors.length > 0;

  if (!isValidPeriod(year, month)) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <RankingHeader 
        period="mensal" 
        onPeriodChange={handlePeriodChange}
        lastUpdate={lastUpdate}
        isLoading={isLoading}
      />
      
      {/* Seletor de Período e Indicador */}
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <PeriodIndicator period="mensal" year={year} month={month} />
          <PeriodSelector period="mensal" year={year} month={month} basePath="/ranking" />
        </div>
      </div>

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
          {/* Banner de conversão para usuários não logados quando há competidores */}
          {hasCompetitors && !isAuthenticated && <ConversionBanner />}
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
          {hasCompetitors && (
            <UserRankCard 
              competitors={displayedCompetitors}
              totalParticipants={totalParticipants}
              displayedPeriod="mensal"
            />
          )}
          <RankingList 
            competitors={displayedCompetitors}
            period="mensal"
            year={year}
            month={month}
          />
        </>
      )}
    </div>
  );
}

