'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { AssetList } from '@/components/portfolio/AssetList';
import { UserTransactionList } from '@/components/portfolio/UserTransactionList';
import { BlurOverlay } from '@/components/portfolio/BlurOverlay';
import { PeriodFilters } from '@/components/ranking/PeriodFilters';
import { PageHeader } from '@/components/navigation/PageHeader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, Info, Wallet } from 'lucide-react';
import { isValidPeriod, getCurrentPeriod } from '@/lib/utils/period-utils';
import { useUserStore } from '@/lib/store/userStore';
import type { Competitor } from '@/types';

export default function PortfolioAnualPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const year = parseInt(params.year as string, 10);

  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validar parâmetros e redirecionar se inválidos
  useEffect(() => {
    if (!isValidPeriod(year)) {
      const current = getCurrentPeriod();
      router.replace(`/carteira/${id}/anual/${current.year}`);
      return;
    }
  }, [year, id, router]);

  // Buscar dados do competidor do período específico
  useEffect(() => {
    if (!isValidPeriod(year)) return;

    const fetchCompetitor = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/ranking?period=anual&year=${year}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar ranking');
        }
        const data = await response.json();
        
        const found = data.ranking.find((entry: any) => entry.userId === id);
        
        if (found) {
          setCompetitor({
            id: found.userId,
            name: found.name,
            avatar: found.avatar,
            rank: found.rank,
            monthlyReturn: found.annualReturn ?? found.monthlyReturn,
            annualReturn: found.annualReturn,
            displayedPeriod: 'anual' as const,
            portfolio: found.portfolio || [],
          });
        } else {
          setCompetitor(null);
        }
      } catch (error) {
        console.error('Erro ao buscar competidor:', error);
        setCompetitor(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitor();
  }, [id, year]);

  const { user } = useUserStore();
  const isPremium = user?.isPremium ?? false;
  const isOwner = user?.id === id;
  const canAccess = isOwner || isPremium;

  if (!isValidPeriod(year)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg animate-pulse">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Carregando carteira...</p>
        </div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Competidor não encontrado</h1>
          <Link href={`/ranking/anual/${year}`}>
            <Button variant="outline">Voltar ao Ranking</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 max-w-4xl mx-auto">
      <PageHeader 
        title="Detalhes da Carteira" 
        backHref={`/ranking/anual/${year}`}
      />
      
      {/* Seletor de Período e Indicador */}
      {canAccess && (
        <div className="container mx-auto px-4 py-4">
          <PeriodFilters period="anual" year={year} basePath={`/carteira/${id}`} />
        </div>
      )}

      <PortfolioHeader competitor={competitor} />
      
      {/* Disclaimer sobre delay de atualização */}
      {canAccess && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Atenção:</strong> O cálculo da carteira e rentabilidade no ranking é atualizado automaticamente a cada 15 minutos. 
                Transações recém-cadastradas podem levar até 15 minutos para serem contabilizadas nas posições e rentabilidade exibidas.
              </span>
            </p>
          </div>
        </div>
      )}
      
      {canAccess ? (
        <>
          <AssetAllocationChart assets={competitor.portfolio} />
          <AssetList assets={competitor.portfolio} isPremium={canAccess} isOwner={isOwner} />
          <UserTransactionList userId={competitor.id} isPremium={canAccess} isOwner={isOwner} period="anual" year={year} />
        </>
      ) : (
        <>
          <AssetAllocationChart assets={competitor.portfolio} />
          <AssetList assets={competitor.portfolio} isPremium={false} isOwner={false} />
          <UserTransactionList userId={competitor.id} isPremium={false} isOwner={false} period="anual" year={year} />
          <BlurOverlay competitorName={competitor.name} />
        </>
      )}
      
      {/* Botão de edição para o dono da carteira */}
      {isOwner && (
        <>
          {/* FAB para mobile */}
          <Link href="/minha-carteira">
            <Button
              className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 md:hidden"
              size="icon"
            >
              <Edit className="h-6 w-6" />
            </Button>
          </Link>

          {/* Botão para desktop */}
          <div className="hidden md:block container mx-auto px-4 py-4">
            <Link href="/minha-carteira">
              <Button className="w-full">
                <Edit className="h-5 w-5 mr-2" />
                Editar Minha Carteira
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

