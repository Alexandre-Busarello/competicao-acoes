'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, XCircle } from 'lucide-react';

const SCALE_PAPEL = 100 / 95; // papel: 95% redistribuído para 100%, diversificação 0

/** Tijolo: DY 30%, P/VP 20%, Vacância 15%, Cap Rate 15%, FFO 10%, Liquidez 5%, Diversificação 5% */
const CRITERIA_TIJOLO = [
  { key: 'dy' as const, label: 'Dividend Yield (DY)', maxPts: 30, pct: 30 },
  { key: 'pvp' as const, label: 'P/VP', maxPts: 20, pct: 20 },
  { key: 'vacancy' as const, label: 'Vacância', maxPts: 15, pct: 15 },
  { key: 'capRate' as const, label: 'Cap Rate', maxPts: 15, pct: 15 },
  { key: 'ffoYield' as const, label: 'FFO Yield', maxPts: 10, pct: 10 },
  { key: 'liquidity' as const, label: 'Liquidez', maxPts: 5, pct: 5 },
  { key: 'diversification' as const, label: 'Diversificação', maxPts: 5, pct: 5 },
];

/** Papel: sem diversificação; demais % escalados proporcionalmente */
const CRITERIA_PAPEL = [
  { key: 'dy' as const, label: 'Dividend Yield (DY)', maxPts: 30 * SCALE_PAPEL, pct: Math.round(30 * SCALE_PAPEL * 10) / 10 },
  { key: 'pvp' as const, label: 'P/VP', maxPts: 20 * SCALE_PAPEL, pct: Math.round(20 * SCALE_PAPEL * 10) / 10 },
  { key: 'vacancy' as const, label: 'Vacância', maxPts: 15 * SCALE_PAPEL, pct: Math.round(15 * SCALE_PAPEL * 10) / 10 },
  { key: 'capRate' as const, label: 'Cap Rate', maxPts: 15 * SCALE_PAPEL, pct: Math.round(15 * SCALE_PAPEL * 10) / 10 },
  { key: 'ffoYield' as const, label: 'FFO Yield', maxPts: 10 * SCALE_PAPEL, pct: Math.round(10 * SCALE_PAPEL * 10) / 10 },
  { key: 'liquidity' as const, label: 'Liquidez', maxPts: 5 * SCALE_PAPEL, pct: Math.round(5 * SCALE_PAPEL * 10) / 10 },
  { key: 'diversification' as const, label: 'Diversificação', maxPts: 0, pct: 0 },
];

export interface FIIScoreBreakdownProps {
  finalScore: number;
  isPapel?: boolean;
  breakdown?: {
    dy?: number;
    dyValue?: number | null;
    pvp?: number;
    pvpValue?: number | null;
    vacancy?: number;
    vacancyValue?: number | null;
    capRate?: number;
    capRateValue?: number | null;
    ffoYield?: number;
    ffoYieldValue?: number | null;
    liquidity?: number;
    liquidityValue?: number | null;
    diversification?: number;
    diversificationValue?: number | null;
  };
}

function ptsTo100(pts: number, maxPts: number): number {
  if (maxPts <= 0) return 0;
  return Math.min(100, (pts / maxPts) * 100);
}

export function FIIScoreBreakdown({ finalScore, isPapel = false, breakdown }: FIIScoreBreakdownProps) {
  const CRITERIA = isPapel ? CRITERIA_PAPEL : CRITERIA_TIJOLO;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 65) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Ótimo';
    if (score >= 65) return 'Bom';
    if (score >= 50) return 'Médio';
    return 'Ruim';
  };

  const getIndicatorColor = (isPositive: boolean) =>
    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const getIndicatorBorderColor = (isPositive: boolean) =>
    isPositive ? 'border-green-500/30' : 'border-red-500/30';

  const formatValue = (
    key: (typeof CRITERIA)[number]['key'],
    value: number | null | undefined
  ): string => {
    if (value == null) return '—';
    switch (key) {
      case 'dy':
      case 'vacancy':
      case 'capRate':
      case 'ffoYield':
        return `${(value * 100).toFixed(2)}%`;
      case 'pvp':
        return value.toFixed(2);
      case 'liquidity':
        return value.toLocaleString('pt-BR');
      case 'diversification':
        return `${value} imóveis`;
      default:
        return String(value);
    }
  };

  const getValueLabel = (key: (typeof CRITERIA)[number]['key']) => {
    switch (key) {
      case 'dy':
        return 'Valor real';
      case 'pvp':
        return 'P/VP';
      case 'vacancy':
        return 'Vacância';
      case 'capRate':
        return 'Cap Rate';
      case 'ffoYield':
        return 'FFO Yield';
      case 'liquidity':
        return 'Liquidez (R$)';
      case 'diversification':
        return 'Qtd. imóveis';
      default:
        return 'Valor';
    }
  };

  /** Para P/VP e Vacância, menor valor real é melhor. Demais: maior é melhor. */
  const isPositiveByValue = (
    key: (typeof CRITERIA)[number]['key'],
    valueRaw: number | null | undefined,
    value100: number
  ): boolean => {
    if (valueRaw == null) return value100 >= 50;
    switch (key) {
      case 'pvp':
        return valueRaw <= 1;
      case 'vacancy':
        return valueRaw <= 0.15;
      default:
        return value100 >= 50;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Breakdown de Scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Final */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Score Final</span>
            <span className={`text-xl font-bold ${getScoreColor(finalScore)}`}>
              {finalScore.toFixed(1)}
              <span className="text-sm ml-2 text-muted-foreground">
                ({getScoreLabel(finalScore)})
              </span>
            </span>
          </div>
          <Progress value={finalScore} className="h-3" />
        </div>

        {/* Cada critério com barra e contribuição (papel: diversificação não aplica) */}
        {CRITERIA.map(({ key, label, maxPts, pct }) => {
          if (maxPts <= 0) return null;
          const pts = breakdown?.[key] ?? 0;
          const value100 = ptsTo100(pts, maxPts);
          const valueRaw =
            key === 'dy'
              ? breakdown?.dyValue
              : key === 'pvp'
                ? breakdown?.pvpValue
                : key === 'vacancy'
                  ? breakdown?.vacancyValue
                  : key === 'capRate'
                    ? breakdown?.capRateValue
                    : key === 'ffoYield'
                      ? breakdown?.ffoYieldValue
                      : key === 'liquidity'
                        ? breakdown?.liquidityValue
                        : breakdown?.diversificationValue;
          const positive = isPositiveByValue(key, valueRaw, value100);
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">
                  <span
                    className={`inline-block w-2 h-2 rounded-sm mr-1.5 align-middle ${
                      key === 'dy'
                        ? 'bg-green-500'
                        : key === 'pvp'
                          ? 'bg-blue-500'
                          : key === 'vacancy'
                            ? 'bg-amber-500'
                            : key === 'capRate'
                              ? 'bg-violet-500'
                              : key === 'ffoYield'
                                ? 'bg-cyan-500'
                                : key === 'liquidity'
                                  ? 'bg-sky-500'
                                  : 'bg-slate-500'
                    }`}
                  />
                  {label} <span className="text-muted-foreground">({pct}%)</span>
                </span>
                <span className={`font-semibold ${getScoreColor(value100)}`}>
                  {pts.toFixed(1)}
                </span>
              </div>
              <Progress value={value100} className="h-2" />
              <div
                className={`text-xs mt-2 ml-4 border-l-2 ${getIndicatorBorderColor(positive)} pl-2`}
              >
                <div className="font-medium text-foreground mb-0.5">{label}</div>
                <div>
                  Score: {pts.toFixed(1)}/{maxPts} pts
                  <span className="ml-1 text-muted-foreground">
                    (posição relativa:{' '}
                    {value100 >= 80 ? 'Top' : value100 >= 50 ? 'Média' : 'Baixa'})
                  </span>
                </div>
                {valueRaw != null && (
                  <div className="text-muted-foreground">
                    {getValueLabel(key)}: {formatValue(key, valueRaw)}
                    {positive ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>
                        <Check className="h-3 w-3 inline" /> Positivo
                      </span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>
                        <XCircle className="h-3 w-3 inline" /> Negativo
                      </span>
                    )}
                  </div>
                )}
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  Contribuição: {pts.toFixed(1)}/{maxPts} pts
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
