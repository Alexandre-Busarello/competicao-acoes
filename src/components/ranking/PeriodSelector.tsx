'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAvailableYears,
  getAvailableMonths,
  getMonthName,
  getCurrentPeriod,
  isCurrentPeriod,
} from '@/lib/utils/period-utils';
import { Label } from '@/components/ui/label';

interface PeriodSelectorProps {
  period: 'mensal' | 'anual';
  year: number;
  month?: number;
  basePath: string; // Ex: '/ranking' ou '/carteira/[id]'
  onSelect?: () => void; // Callback opcional chamado quando uma seleção é feita
}

export function PeriodSelector({ period, year, month, basePath, onSelect }: PeriodSelectorProps) {
  const router = useRouter();
  const current = getCurrentPeriod();
  const availableYears = getAvailableYears();
  const availableMonths = period === 'mensal' ? getAvailableMonths(year) : [];

  const handleYearChange = (newYear: string) => {
    const yearNum = parseInt(newYear, 10);
    if (period === 'mensal') {
      // Manter o mês atual ou usar o último mês disponível do novo ano
      const months = getAvailableMonths(yearNum);
      const newMonth = month && months.includes(month) ? month : months[0] || current.month;
      router.push(`${basePath}/mensal/${yearNum}/${newMonth.toString().padStart(2, '0')}`);
    } else {
      router.push(`${basePath}/anual/${yearNum}`);
    }
    onSelect?.();
  };

  const handleMonthChange = (newMonth: string) => {
    const monthNum = parseInt(newMonth, 10);
    router.push(`${basePath}/mensal/${year}/${monthNum.toString().padStart(2, '0')}`);
    onSelect?.();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Label htmlFor="year-select" className="text-xs text-muted-foreground mb-1 block">
          Ano
        </Label>
        <Select value={year.toString()} onValueChange={handleYearChange}>
          <SelectTrigger id="year-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
                {y === current.year && ' (Atual)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {period === 'mensal' && (
        <div className="flex-1">
          <Label htmlFor="month-select" className="text-xs text-muted-foreground mb-1 block">
            Mês
          </Label>
          <Select
            value={month?.toString() || ''}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger id="month-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {getMonthName(m)}
                  {isCurrentPeriod('mensal', year, m) && ' (Atual)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

