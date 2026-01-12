'use client';

import Link from 'next/link';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { getCurrentPeriod } from '@/lib/utils/period-utils';

interface UserStatsBadgeProps {
  userId: string;
  rankings?: {
    monthly: number | null;
    annual: number | null;
    monthlyReturn?: number | null;
    annualReturn?: number | null;
  };
  profitability?: number;
}

export function UserStatsBadge({ userId, rankings, profitability }: UserStatsBadgeProps) {
  const currentPeriod = getCurrentPeriod();
  const hasRankings = rankings && (rankings.monthly !== null || rankings.annual !== null);
  // const hasProfitability = profitability !== undefined; // Oculto temporariamente - reativar após 1 ano de ciclo
  const hasMonthlyReturn = rankings?.monthlyReturn !== null && rankings?.monthlyReturn !== undefined;
  const hasAnnualReturn = rankings?.annualReturn !== null && rankings?.annualReturn !== undefined;

  // Atualizado: removido hasProfitability da condição
  if (!hasRankings && !hasMonthlyReturn && !hasAnnualReturn) {
    return null;
  }

  const formatReturn = (value: number | null | undefined): { value: number; isPositive: boolean } | null => {
    if (value === null || value === undefined) return null;
    return {
      value,
      isPositive: value >= 0,
    };
  };

  const monthlyReturn = formatReturn(rankings?.monthlyReturn);
  const annualReturn = formatReturn(rankings?.annualReturn);
  // const perpetualReturn = formatReturn(profitability); // Oculto temporariamente - reativar após 1 ano de ciclo

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Rentabilidade Mensal */}
      {hasMonthlyReturn && monthlyReturn && (
        <Link
          href={`/carteira/${userId}/mensal/${currentPeriod.year}/${String(currentPeriod.month).padStart(2, '0')}`}
          className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {monthlyReturn.isPositive ? (
            <TrendingUp className="h-3 w-3 text-success flex-shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive flex-shrink-0" />
          )}
          <span className="text-muted-foreground">Mensal:</span>
          <span
            className={`text-xs font-bold ${
              monthlyReturn.isPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {monthlyReturn.isPositive ? '+' : ''}
            {monthlyReturn.value.toFixed(2)}%
          </span>
          {rankings?.monthly !== null && (
            <span className="text-muted-foreground ml-0.5">(#{rankings.monthly})</span>
          )}
        </Link>
      )}

      {/* Rentabilidade Anual */}
      {hasAnnualReturn && annualReturn && (
        <Link
          href={`/carteira/${userId}/anual/${currentPeriod.year}`}
          className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {annualReturn.isPositive ? (
            <TrendingUp className="h-3 w-3 text-success flex-shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive flex-shrink-0" />
          )}
          <span className="text-muted-foreground">Anual:</span>
          <span
            className={`text-xs font-bold ${
              annualReturn.isPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {annualReturn.isPositive ? '+' : ''}
            {annualReturn.value.toFixed(2)}%
          </span>
          {rankings?.annual !== null && (
            <span className="text-muted-foreground ml-0.5">(#{rankings.annual})</span>
          )}
        </Link>
      )}

      {/* 
        TODO: Reativar após completar 1 ano de ciclo
        Rentabilidade Perpétua (sem período específico)
        Descomentar quando tivermos finalizado um ciclo completo de 1 ano
      */}
      {/* {hasProfitability && perpetualReturn && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
          {perpetualReturn.isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-success flex-shrink-0" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
          )}
          <span className="text-xs font-semibold text-muted-foreground">Perpétua:</span>
          <span
            className={`text-xs font-bold ${
              perpetualReturn.isPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {perpetualReturn.isPositive ? '+' : ''}
            {perpetualReturn.value.toFixed(2)}%
          </span>
        </div>
      )} */}

      {/* Fallback: Mostrar apenas posições se não houver rentabilidades mas houver rankings */}
      {!hasMonthlyReturn && !hasAnnualReturn && hasRankings && (
        <>
          {rankings.monthly !== null && (
            <Link
              href={`/carteira/${userId}/mensal/${currentPeriod.year}/${String(currentPeriod.month).padStart(2, '0')}`}
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Trophy className="h-3 w-3 text-warning flex-shrink-0" />
              <span className="text-muted-foreground">M:</span>
              <span className="font-semibold">#{rankings.monthly}</span>
            </Link>
          )}
          {rankings.annual !== null && (
            <Link
              href={`/carteira/${userId}/anual/${currentPeriod.year}`}
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Trophy className="h-3 w-3 text-warning flex-shrink-0" />
              <span className="text-muted-foreground">A:</span>
              <span className="font-semibold">#{rankings.annual}</span>
            </Link>
          )}
        </>
      )}
    </div>
  );
}

