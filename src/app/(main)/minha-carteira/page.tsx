'use client';

import { useState } from 'react';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { TransactionList } from '@/components/portfolio/TransactionList';
import { TransactionModal } from '@/components/portfolio/TransactionModal';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Info, ChevronDown } from 'lucide-react';

export default function MyPortfolioPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <PortfolioSummary />
      
      {/* Disclaimer sobre delay de atualização e moeda */}
      <div className="container mx-auto px-4 py-2 space-y-2">
        <Collapsible>
          <CollapsibleTrigger className="w-full [&[data-state=open]>div>svg:last-child]:rotate-180">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
              <div className="flex items-start gap-2 flex-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-800 dark:text-blue-200" />
                <span className="text-xs text-blue-800 dark:text-blue-200 text-left">
                  <strong>Atenção:</strong> Clique para ver informações sobre atualização de dados.
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-blue-800 dark:text-blue-200 flex-shrink-0 ml-2 transition-transform" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-2">
              <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  O cálculo da carteira e rentabilidade no ranking é atualizado automaticamente a cada 15 minutos. 
                  Transações recém-cadastradas podem levar até 15 minutos para serem contabilizadas nas posições e rentabilidade exibidas.
                </span>
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <Collapsible>
          <CollapsibleTrigger className="w-full [&[data-state=open]>div>svg:last-child]:rotate-180">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3 flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors">
              <div className="flex items-start gap-2 flex-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-800 dark:text-green-200" />
                <span className="text-xs text-green-800 dark:text-green-200 text-left">
                  <strong>Como funciona a moeda no ranking:</strong> Clique para ver detalhes sobre moeda e câmbio.
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-green-800 dark:text-green-200 flex-shrink-0 ml-2 transition-transform" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3 mt-2">
              <p className="text-xs text-green-800 dark:text-green-200 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  A moeda do ativo (BRL, USD, EUR, etc.) <strong>não impacta</strong> o cálculo da rentabilidade no ranking. 
                  Todas as moedas têm equivalência 1:1 para fins de cálculo. Isso significa que se você comprar um ativo em dólar e ele se valorizar frente ao real 
                  (ou qualquer outra moeda), essa variação cambial <strong>não será contabilizada</strong> na rentabilidade. A rentabilidade é calculada apenas pela variação 
                  do preço do ativo na sua moeda original. Na hora de calcular as proporções de diversificação da carteira, considere que toda moeda tem a mesma equivalência.
                </span>
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {/* Botão para desktop - antes das transações */}
      <div className="hidden md:block container mx-auto px-4 py-4">
        <Button onClick={() => setIsModalOpen(true)} className="w-full">
          <Plus className="h-5 w-5 mr-2" />
          Nova Transação
        </Button>
      </div>
      
      <TransactionList />
      
      {/* FAB - Floating Action Button para mobile */}
      <Button
        className="fixed bottom-28 right-4 h-14 w-14 rounded-full shadow-lg z-40 md:hidden"
        size="icon"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TransactionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}

