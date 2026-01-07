'use client';

import { useParams } from 'next/navigation';
import { useRankingStore } from '@/lib/store/rankingStore';
import { useUserStore } from '@/lib/store/userStore';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { AssetList } from '@/components/portfolio/AssetList';
import { BlurOverlay } from '@/components/portfolio/BlurOverlay';
import { PageHeader } from '@/components/navigation/PageHeader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PortfolioDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { competitors } = useRankingStore();
  const { user } = useUserStore();

  const competitor = competitors.find((c) => c.id === id);
  const isPremium = user?.isPremium ?? false;

  if (!competitor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Competidor não encontrado</h1>
          <Link href="/ranking">
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
        backHref="/ranking"
      />
      <PortfolioHeader competitor={competitor} />
      <AssetAllocationChart assets={competitor.portfolio} />
      <AssetList assets={competitor.portfolio} isPremium={isPremium} />
      {!isPremium && <BlurOverlay competitorName={competitor.name} />}
    </div>
  );
}

