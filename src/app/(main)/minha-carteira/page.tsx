'use client';

import { useState } from 'react';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { TransactionList } from '@/components/portfolio/TransactionList';
import { TransactionModal } from '@/components/portfolio/TransactionModal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function MyPortfolioPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Minha Carteira" 
        backHref="/ranking"
      />
      <PortfolioSummary />
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

