'use client';

import { useRankingStore } from '@/lib/store/rankingStore';
import { useUserStore } from '@/lib/store/userStore';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { AssetList } from '@/components/portfolio/AssetList';
import { BlurOverlay } from '@/components/portfolio/BlurOverlay';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Star, Copy, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Competitor } from '@/types';

export default function BrunoMethodPage() {
  const { brunoPortfolio, isLoading } = useRankingStore();
  const { user } = useUserStore();
  const isPremium = user?.isPremium ?? false;

  if (isLoading || !brunoPortfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
        </div>
      </div>
    );
  }

  // Criar objeto Competitor compatível para usar os componentes existentes
  const brunoCompetitor: Competitor = {
    id: 'bruno-chimarelli',
    name: brunoPortfolio.name,
    avatar: undefined,
    rank: 0,
    monthlyReturn: brunoPortfolio.monthlyReturn,
    annualReturn: brunoPortfolio.annualReturn,
    portfolio: brunoPortfolio.assets,
    displayedPeriod: 'mensal',
  };

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-yellow-50/50 dark:from-yellow-950/10 to-background">
      <PageHeader 
        title={
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span>MIC Method</span>
          </div>
        }
        backHref="/ranking"
        className="border-yellow-200 dark:border-yellow-900"
      />

      <div className="bg-gradient-to-br from-yellow-100/50 dark:from-yellow-900/20 to-background border-b-2 border-yellow-300 dark:border-yellow-700">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full mb-4">
              <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                Estratégia Oficial
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-3">{brunoPortfolio.name}</h2>
            {brunoPortfolio.description && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {brunoPortfolio.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <PortfolioHeader competitor={brunoCompetitor} />
      <AssetAllocationChart assets={brunoPortfolio.assets} />
      <AssetList assets={brunoPortfolio.assets} isPremium={isPremium} />

      {!isPremium && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent pb-20 pt-8 px-4">
          <Card className="border-yellow-300 dark:border-yellow-700 shadow-lg bg-gradient-to-br from-yellow-50 dark:from-yellow-950/50">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">
                  Copie a estratégia do Bruno Chimarelli
                </h3>
                <p className="text-sm text-muted-foreground">
                  Desbloqueie acesso completo à carteira oficial e participe dos prêmios anuais
                </p>
              </div>
              <div className="space-y-3">
                <Link href="/perfil?from=cta" className="block">
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950" size="lg">
                    <Copy className="h-5 w-5 mr-2" />
                    Desbloquear Estratégia Completa
                  </Button>
                </Link>
                <Link href="/perfil?from=cta">
                  <Button variant="outline" className="w-full" size="sm">
                    Entenda como funciona
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

