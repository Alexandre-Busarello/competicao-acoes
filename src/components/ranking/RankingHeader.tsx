'use client';

import { Trophy, Clock, Info, TrendingUp } from 'lucide-react';
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
      <div className="container mx-auto px-4 py-4 max-w-4xl">
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
        <Tabs value={period} onValueChange={(value) => onPeriodChange(value as RankingPeriod)} className="w-full">
          <TabsList className={`grid w-full ${SHOW_MIC_METHOD ? 'grid-cols-4' : 'grid-cols-3'} min-w-0`}>
            <TabsTrigger value="mensal" className="min-w-0 truncate">Mensal</TabsTrigger>
            <TabsTrigger value="anual" className="min-w-0 truncate">Anual</TabsTrigger>
            <TabsTrigger 
              value="ggb" 
              className={`relative font-semibold min-w-0 overflow-hidden ${
                period === 'ggb' 
                  ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 dark:from-green-500/30 dark:to-blue-500/30 border-2 border-green-500/40' 
                  : ''
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="truncate hidden sm:inline">Ranking GGB</span>
                <span className="flex items-center gap-1 sm:hidden">
                  <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">GGB</span>
                </span>
                <span className={`hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-tight flex-shrink-0 ${
                  period === 'ggb'
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                    : 'bg-gradient-to-r from-green-500/70 to-blue-500/70 text-white/90'
                }`}>NEW</span>
              </span>
            </TabsTrigger>
            {SHOW_MIC_METHOD && (
              <TabsTrigger value="bruno-method" className="relative min-w-0 truncate">
                <span className="truncate">MIC Method</span>
                <span className="ml-1 text-xs flex-shrink-0">⭐</span>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

