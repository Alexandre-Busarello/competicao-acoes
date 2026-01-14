'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RankingHeader } from '@/components/ranking/RankingHeader';
import { UserRankCard } from '@/components/ranking/UserRankCard';
import { RankingList } from '@/components/ranking/RankingList';
import { ConversionBanner } from '@/components/ranking/ConversionBanner';
import { PeriodFilters } from '@/components/ranking/PeriodFilters';
import { PageLoading } from '@/components/ui/page-loading';
import { useUserStore } from '@/lib/store/userStore';
import { useAuth } from '@/lib/auth/client';
import { Info } from 'lucide-react';
import type { Competitor, RankingPeriod } from '@/types';
import { SHOW_MIC_METHOD } from '@/lib/config/features';
import { isValidPeriod, getCurrentPeriod } from '@/lib/utils/period-utils';

export default function RankingAnualPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const { isAuthenticated } = useAuth();
  
  const year = parseInt(params.year as string, 10);
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validar parâmetros e redirecionar se inválidos
  useEffect(() => {
    if (!isValidPeriod(year)) {
      const current = getCurrentPeriod();
      router.replace(`/ranking/anual/${current.year}`);
      return;
    }
  }, [year, router]);

  // Buscar ranking do período específico
  useEffect(() => {
    if (!isValidPeriod(year)) return;

    const fetchRanking = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/ranking?period=anual&year=${year}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar ranking');
        }
        const data = await response.json();
        
        const competitorsList: Competitor[] = data.ranking.map((entry: any) => ({
          id: entry.userId,
          name: entry.name,
          avatar: entry.avatar,
          rank: entry.rank,
          monthlyReturn: entry.annualReturn ?? entry.monthlyReturn,
          annualReturn: entry.annualReturn,
          displayedPeriod: 'anual' as const,
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
  }, [year]);

  const handlePeriodChange = (newPeriod: RankingPeriod) => {
    const current = getCurrentPeriod();
    if (newPeriod === 'bruno-method' && SHOW_MIC_METHOD) {
      router.push('/bruno-method');
    } else if (newPeriod === 'mensal') {
      router.push(`/ranking/mensal/${current.year}/${current.month.toString().padStart(2, '0')}`);
    } else {
      router.push(`/ranking/anual/${current.year}`);
    }
  };

  const displayedCompetitors = competitors.map(c => ({
    ...c,
    monthlyReturn: c.annualReturn ?? c.monthlyReturn,
    displayedPeriod: 'anual' as const,
  })) as Competitor[];

  const hasCompetitors = displayedCompetitors.length > 0;

  if (!isValidPeriod(year)) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <RankingHeader 
        period="anual" 
        onPeriodChange={handlePeriodChange}
        lastUpdate={lastUpdate}
        isLoading={isLoading}
      />
      
      {/* Seletor de Período e Indicador */}
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <PeriodFilters period="anual" year={year} basePath="/ranking" />
      </div>

      {/* Mostrar loading ou conteúdo baseado no estado */}
      {isLoading ? (
        <PageLoading 
          title="Carregando ranking anual"
          description="Buscando os melhores investidores do ano..."
        />
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
              displayedPeriod="anual"
            />
          )}
          <RankingList 
            competitors={displayedCompetitors}
            period="anual"
            year={year}
          />
        </>
      )}
    </div>
  );
}

