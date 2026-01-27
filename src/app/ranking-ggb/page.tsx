'use client';

import { useRouter } from 'next/navigation';
import { RankingHeader } from '@/components/ranking/RankingHeader';
import { PageLoading } from '@/components/ui/page-loading';
import { GGBRankingTable } from '@/components/ranking-ggb/GGBRankingTable';
import { GGBDisclaimer } from '@/components/ranking-ggb/GGBDisclaimer';
import { useGGBRankingStore } from '@/lib/store/ggbRankingStore';
import type { RankingPeriod } from '@/types';
import { SHOW_MIC_METHOD } from '@/lib/config/features';
import { getCurrentPeriod } from '@/lib/utils/period-utils';
import { TrendingUp, Clock, BookOpen, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export default function RankingGGBPage() {
  const router = useRouter();
  const { data, isLoading, lastUpdate, isPro } = useGGBRankingStore();

  const handlePeriodChange = (newPeriod: RankingPeriod) => {
    const current = getCurrentPeriod();
    if (newPeriod === 'bruno-method' && SHOW_MIC_METHOD) {
      router.push('/bruno-method');
    } else if (newPeriod === 'mensal') {
      router.push(`/ranking/mensal/${current.year}/${current.month.toString().padStart(2, '0')}`);
    } else if (newPeriod === 'anual') {
      router.push(`/ranking/anual/${current.year}`);
    }
  };

  const formatLastUpdate = (date: string | null | undefined) => {
    if (!date) return null;
    try {
      return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const scrollToMethodology = () => {
    const element = document.getElementById('metodologia-ggb');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <RankingHeader 
        period="ggb" 
        onPeriodChange={handlePeriodChange}
        lastUpdate={lastUpdate ? new Date(lastUpdate) : null}
        isLoading={isLoading}
      />
      
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
        {/* Link rápido para metodologia */}
        {!isLoading && (
          <div className="mb-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToMethodology}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Entendendo a metodologia
            </Button>
          </div>
        )}

        {/* Ranking direto */}
        {isLoading ? (
          <PageLoading 
            title="Carregando Ranking GGB"
            description="Buscando dados financeiros e calculando scores..."
          />
        ) : (
          <>
            <GGBRankingTable data={data || []} isLoading={isLoading} isPro={isPro} />
            
            {/* Header explicativo no final */}
            <div id="metodologia-ggb" className="mt-8 mb-6 scroll-mt-20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Ranking GGB</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scrollToTop}
                  className="gap-2"
                >
                  <ArrowUp className="h-4 w-4" />
                  Voltar ao topo
                </Button>
              </div>
              <p className="text-muted-foreground mb-2">
                Ranking quantitativo de ações baseado na metodologia GGB (Greenblatt-Graham-Bazin).
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>🟩 Greenblatt (45%):</strong> ROIC e Earnings Yield - escolhe quem é bom e barato
                </p>
                <p>
                  <strong>🟦 Graham (35%):</strong> Dívida, Liquidez e Histórico - protege contra erro estrutural
                </p>
                <p>
                  <strong>🟨 Bazin (20%):</strong> Dividend Yield e Payout - define se o preço compensa o tempo
                </p>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Última atualização: {formatLastUpdate(lastUpdate)}</span>
                </div>
              )}
            </div>

            {/* Disclaimer importante */}
            <div className="mb-6">
              <GGBDisclaimer />
            </div>

            {/* Fonte de dados */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center opacity-70">
                Dados das empresas do GGB fornecidos por{' '}
                <a 
                  href="https://precojusto.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Preço Justo AI - Análise Fundamentalista de Ações da B3"
                  className="hover:underline"
                >
                  Preço Justo AI
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

