'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { FIIRankingTable } from '@/components/ranking-fii/FIIRankingTable';
import { useFIIRankingStore } from '@/lib/store/fiiRankingStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Building2, Clock, BookOpen, ArrowUp } from 'lucide-react';
import Link from 'next/link';

export default function RankingFIIPage() {
  const { data, isLoading, lastUpdate, isPro } = useFIIRankingStore();

  const formatLastUpdate = (date: string | null | undefined) => {
    if (!date) return null;
    try {
      return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const scrollToMethodology = () => {
    const element = document.getElementById('metodologia-fii');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background border-b border-border safe-area-top">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Ranking FII</h1>
            </div>
            <Link href="/ranking-ggb">
              <Button variant="outline" size="sm">
                Ver Ranking GGB (Ações)
              </Button>
            </Link>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1 mb-4">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Atualizado em: {formatLastUpdate(lastUpdate)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
        {!isLoading && (
          <div className="mb-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={scrollToMethodology} className="gap-2">
              <BookOpen className="h-4 w-4" />
              Entendendo a metodologia
            </Button>
          </div>
        )}

        {isLoading ? (
          <PageLoading
            title="Carregando Ranking FII"
            description="Buscando dados do Fundamentus e calculando scores..."
          />
        ) : (
          <>
            <FIIRankingTable data={data || []} isLoading={isLoading} isPro={isPro} />

            <div id="metodologia-fii" className="mt-8 mb-6 scroll-mt-20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Ranking FII</h2>
                </div>
                <Button variant="outline" size="sm" onClick={scrollToTop} className="gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Voltar ao topo
                </Button>
              </div>
              <p className="text-muted-foreground mb-2">
                Ranking quantitativo de Fundos Imobiliários baseado em indicadores fundamentais.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Inclusão: FIIs de tijolo — liquidez ≥ R$ 1 mi e ≥ 5 imóveis; fundos de papel (títulos/crédito) — liquidez ≥ R$ 100 mil, sem exigência de imóveis. Fundos de papel aparecem com o selo &quot;Papel&quot; na coluna Segmento.
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>DY (30%):</strong> Dividend Yield - rentabilidade em dividendos</p>
                <p><strong>P/VP (20%):</strong> Preço/Valor Patrimonial - subvalorização</p>
                <p><strong>Vacância (15%):</strong> Taxa de vacância - menor é melhor</p>
                <p><strong>Cap Rate (15%):</strong> Retorno sobre ativos imobiliários</p>
                <p><strong>FFO Yield (10%):</strong> Funds From Operations - sustentabilidade</p>
                <p><strong>Liquidez (5%):</strong> Volume de negociação</p>
                <p><strong>Diversificação (5%):</strong> Quantidade de imóveis na carteira</p>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Última atualização: {formatLastUpdate(lastUpdate)}</span>
                </div>
              )}
            </div>

            <div className="mb-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Aviso importante</p>
              <p>
                Este ranking é apenas uma ferramenta de análise e não constitui recomendação de investimento.
                Consulte um profissional de investimentos antes de tomar decisões.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center opacity-70">
                Dados de FIIs fornecidos por{' '}
                <a
                  href="https://www.fundamentus.com.br/fii_resultado.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Fundamentus - Dados de FIIs"
                  className="hover:underline"
                >
                  Fundamentus
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
