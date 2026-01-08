'use client';

import { useParams } from 'next/navigation';
import { useRankingStore } from '@/lib/store/rankingStore';
import { useUserStore } from '@/lib/store/userStore';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { AssetList } from '@/components/portfolio/AssetList';
import { UserTransactionList } from '@/components/portfolio/UserTransactionList';
import { BlurOverlay } from '@/components/portfolio/BlurOverlay';
import { PageHeader } from '@/components/navigation/PageHeader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Info, Wallet } from 'lucide-react';

export default function PortfolioDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { competitors, isLoading } = useRankingStore();
  const { user } = useUserStore();

  const competitor = competitors.find((c) => c.id === id);
  const isPremium = user?.isPremium ?? false;
  const isOwner = user?.id === id; // Verifica se o usuário é o dono da carteira

  // Mostrar loading enquanto os dados estão sendo carregados
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

  // Só mostrar "não encontrado" quando não estiver carregando e realmente não encontrar
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
      
      {/* Disclaimer sobre delay de atualização */}
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
      
      <AssetAllocationChart assets={competitor.portfolio} />
      <AssetList assets={competitor.portfolio} isPremium={isPremium} />
      <UserTransactionList userId={competitor.id} isPremium={isPremium} />
      {!isPremium && <BlurOverlay competitorName={competitor.name} />}
      
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

