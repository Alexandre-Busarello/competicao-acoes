'use client';

import { Trophy, Clock, Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RankingPeriod } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SHOW_MIC_METHOD } from '@/lib/config/features';

interface RankingHeaderProps {
  period: RankingPeriod;
  onPeriodChange: (period: RankingPeriod) => void;
  lastUpdate?: Date | string | null;
  isLoading?: boolean;
}

export function RankingHeader({ period, onPeriodChange, lastUpdate, isLoading }: RankingHeaderProps) {
  const formatLastUpdate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "HH:mm", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const lastUpdateTime = formatLastUpdate(lastUpdate);

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border safe-area-top">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center mb-4 gap-2">
          <Trophy className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold">Ranking</h1>
          <Link href="/como-funciona">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {lastUpdateTime && (
          <div className="flex items-center justify-center gap-1 mb-4">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Atualizado em: {lastUpdateTime}
            </span>
            {isLoading && (
              <span className="text-xs text-muted-foreground animate-pulse">
                (atualizando...)
              </span>
            )}
          </div>
        )}
        <Tabs value={period} onValueChange={(value) => onPeriodChange(value as RankingPeriod)}>
          <TabsList className={`grid w-full ${SHOW_MIC_METHOD ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="anual">Anual</TabsTrigger>
            {SHOW_MIC_METHOD && (
              <TabsTrigger value="bruno-method" className="relative">
                MIC Method
                <span className="ml-1 text-xs">⭐</span>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

