'use client';

import { useState } from 'react';
import { PeriodSelector } from './PeriodSelector';
import { PeriodIndicator } from './PeriodIndicator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Filter } from 'lucide-react';

interface PeriodFiltersProps {
  period: 'mensal' | 'anual';
  year: number;
  month?: number;
  basePath: string; // Ex: '/ranking' ou '/carteira/[id]'
}

export function PeriodFilters({ period, year, month, basePath }: PeriodFiltersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      {/* Desktop: sempre visível */}
      <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <PeriodIndicator period={period} year={year} month={month} />
        <PeriodSelector period={period} year={year} month={month} basePath={basePath} />
      </div>

      {/* Mobile: indicador + botão de filtro */}
      <div className="flex sm:hidden items-center justify-between gap-3 w-full">
        <PeriodIndicator period={period} year={year} month={month} />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filtrar Período</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <PeriodSelector 
                period={period} 
                year={year} 
                month={month} 
                basePath={basePath}
                onSelect={() => {
                  // Fechar dialog após seleção (com pequeno delay para permitir navegação)
                  setTimeout(() => setIsDialogOpen(false), 100);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

