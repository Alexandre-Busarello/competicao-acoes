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
import { TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RankingGGBPage() {
  const router = useRouter();
  const { data, isLoading, lastUpdate } = useGGBRankingStore();

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

  return (
    <div className="min-h-screen">
      <RankingHeader 
        period="ggb" 
        onPeriodChange={handlePeriodChange}
        lastUpdate={lastUpdate ? new Date(lastUpdate) : null}
        isLoading={isLoading}
      />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header explicativo */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Ranking GGB</h2>
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

        {/* Tabela de ranking */}
        {isLoading ? (
          <PageLoading 
            title="Carregando Ranking GGB"
            description="Buscando dados financeiros e calculando scores..."
          />
        ) : (
          <GGBRankingTable data={data || []} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

