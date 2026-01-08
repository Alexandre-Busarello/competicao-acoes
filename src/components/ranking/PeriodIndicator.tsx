'use client';

import { Badge } from '@/components/ui/badge';
import { formatPeriod, isCurrentPeriod } from '@/lib/utils/period-utils';
import { Calendar } from 'lucide-react';

interface PeriodIndicatorProps {
  period: 'mensal' | 'anual';
  year: number;
  month?: number;
}

export function PeriodIndicator({ period, year, month }: PeriodIndicatorProps) {
  const isCurrent = isCurrentPeriod(period, year, month);
  const formattedPeriod = formatPeriod(period, year, month);

  return (
    <Badge
      variant={isCurrent ? 'default' : 'secondary'}
      className="flex items-center gap-1.5"
    >
      <Calendar className="h-3 w-3" />
      <span>{formattedPeriod}</span>
      {isCurrent && (
        <span className="ml-1 text-xs opacity-75">(Atual)</span>
      )}
    </Badge>
  );
}


