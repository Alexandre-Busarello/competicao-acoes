'use client';

import { useState } from 'react';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { TransactionList } from '@/components/portfolio/TransactionList';
import { TransactionModal } from '@/components/portfolio/TransactionModal';
import { Button } from '@/components/ui/button';
import { Plus, Info } from 'lucide-react';

export default function MyPortfolioPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <PortfolioSummary />
      
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
      
      <TransactionList />
      
      {/* FAB - Floating Action Button */}
      <Button
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 md:hidden"
        size="icon"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Botão para desktop */}
      <div className="hidden md:block container mx-auto px-4 py-4">
        <Button onClick={() => setIsModalOpen(true)} className="w-full">
          <Plus className="h-5 w-5 mr-2" />
          Nova Transação
        </Button>
      </div>

      <TransactionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}

