'use client';

import { useState, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Building2, FileText } from 'lucide-react';
import { formatSegmentDisplay } from '@/lib/utils/fii-segment-display';
import { FIIScoreBreakdown } from './FIIScoreBreakdown';
import { Button } from '@/components/ui/button';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { useConversionTracking } from '@/lib/hooks/useConversionTracking';
import { useEffect, useRef } from 'react';

interface FIIRankingItem {
  ticker: string;
  fundName: string | null;
  segment: string | null;
  dyScore: number | string;
  pvpScore: number | string;
  vacancyScore: number | string;
  debtScore: number | string;
  payoutScore: number | string;
  liquidityScore: number | string;
  finalScore: number | string;
  rank: number;
  financialData: Record<string, any>;
  breakdown?: Record<string, any>;
  lastUpdated?: string;
}

interface FIIRankingTableProps {
  data: FIIRankingItem[];
  isLoading?: boolean;
  isPro?: boolean;
}

function parseScore(v: number | string): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export function FIIRankingTable({ data, isLoading, isPro = false }: FIIRankingTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'rank' | 'finalScore' | 'ticker'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const paywallRef = useRef<HTMLDivElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const { trackView } = useConversionTracking();

  useEffect(() => {
    if (isPro || hasTrackedView || !paywallRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            trackView('fii_ranking');
            setHasTrackedView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(paywallRef.current);
    return () => observer.disconnect();
  }, [isPro, hasTrackedView, trackView]);

  const toggleRow = (rank: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rank)) newExpanded.delete(rank);
    else newExpanded.add(rank);
    setExpandedRows(newExpanded);
  };

  const handleRowClick = (rank: number) => {
    if (typeof window !== 'undefined' && window.getSelection()?.toString()) return;
    toggleRow(rank);
  };

  const handleSort = (field: 'rank' | 'finalScore' | 'ticker') => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'rank') comparison = a.rank - b.rank;
    else if (sortBy === 'finalScore') comparison = parseScore(a.finalScore) - parseScore(b.finalScore);
    else if (sortBy === 'ticker') comparison = a.ticker.localeCompare(b.ticker);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 65) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando ranking de FIIs...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível no momento.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Ranking FII
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {!isPro && (
          <div
            ref={paywallRef}
            className="mb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex justify-center w-8 h-8 rounded-full bg-primary/20 flex-shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm">Ranking FII Exclusivo para Membros Pro</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    Desbloqueie acesso completo aos dados detalhados
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 w-full sm:w-auto">
                <CheckoutCTA source="fii_ranking" buttonText="Desbloquear" size="sm" variant="default" className="w-full sm:w-auto" />
              </div>
            </div>
          </div>
        )}

        <div className={`space-y-3 md:space-y-0 ${!isPro ? 'select-none' : ''}`} style={!isPro ? { filter: 'blur(4px)' } : {}}>
          <div className="md:hidden space-y-3">
            {sortedData.slice(0, 50).map((item) => {
              const isExpanded = expandedRows.has(item.rank);
              const medal = getMedal(item.rank);
              const finalScore = parseScore(item.finalScore);
              return (
                <div
                  key={item.ticker}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(item.rank)}
                  onKeyDown={(e) => e.key === 'Enter' && toggleRow(item.rank)}
                  className="border rounded-lg p-4 bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {medal && <span className="text-xl">{medal}</span>}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">#{item.rank}</span>
                          <span className="font-mono font-bold text-base">{item.ticker}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        {formatSegmentDisplay(item.segment)}
                        {item.financialData?.isPapel && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-[10px] font-medium">
                            <FileText className="h-3 w-3" />
                            Papel
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getScoreColor(finalScore)}`}>
                        {finalScore > 0 ? finalScore.toFixed(1) : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                    <div>
                      <span className="text-muted-foreground">DY:</span>{' '}
                      {item.financialData.dividendYield != null
                        ? `${(item.financialData.dividendYield * 100).toFixed(1)}%`
                        : '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">P/VP:</span>{' '}
                      {item.financialData.pvp != null ? item.financialData.pvp.toFixed(2) : '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vacância:</span>{' '}
                      {item.financialData.vacanciaMedia != null
                        ? `${(item.financialData.vacanciaMedia * 100).toFixed(1)}%`
                        : '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Liquidez:</span>{' '}
                      {item.financialData.liquidez != null
                        ? item.financialData.liquidez.toLocaleString('pt-BR')
                        : '-'}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleRow(item.rank); }} className="w-full mt-3">
                    {isExpanded ? <><ChevronUp className="h-4 w-4 mr-2" />Ocultar</> : <><ChevronDown className="h-4 w-4 mr-2" />Detalhes</>}
                  </Button>
                  {isExpanded && (
                    <div className="mt-4">
                      <FIIScoreBreakdown
                        finalScore={parseScore(item.finalScore)}
                        isPapel={item.financialData?.isPapel}
                        breakdown={item.breakdown}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('rank')} className="h-auto p-1">
                      Rank {sortBy === 'rank' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('ticker')} className="h-auto p-1">
                      Ticker {sortBy === 'ticker' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">Segmento</th>
                  <th className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('finalScore')} className="h-auto p-1">
                      Score {sortBy === 'finalScore' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-right p-2">DY</th>
                  <th className="text-right p-2">P/VP</th>
                  <th className="text-right p-2">Vacância</th>
                  <th className="w-10 p-2" aria-label="Detalhes do score" />
                </tr>
              </thead>
              <tbody>
                {sortedData.slice(0, 100).map((item) => {
                  const isExpanded = expandedRows.has(item.rank);
                  const medal = getMedal(item.rank);
                  const finalScore = parseScore(item.finalScore);
                  return (
                    <Fragment key={item.ticker}>
                      <tr
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowClick(item.rank)}
                        onKeyDown={(e) => e.key === 'Enter' && toggleRow(item.rank)}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                      >
                        <td className="p-2">
                          <span className="flex items-center gap-1">
                            {medal && <span>{medal}</span>}
                            <span className="font-medium">{item.rank}</span>
                          </span>
                        </td>
                        <td className="p-2 font-mono font-semibold">{item.ticker}</td>
                        <td className="p-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            {formatSegmentDisplay(item.segment)}
                            {item.financialData?.isPapel && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-[10px] font-medium">
                                <FileText className="h-3 w-3" />
                                Papel
                              </span>
                            )}
                          </span>
                        </td>
                        <td className={`p-2 text-right font-bold ${getScoreColor(finalScore)}`}>
                          {finalScore > 0 ? finalScore.toFixed(1) : '-'}
                        </td>
                        <td className="p-2 text-right text-sm">
                          {item.financialData.dividendYield != null
                            ? `${(item.financialData.dividendYield * 100).toFixed(1)}%`
                            : '-'}
                        </td>
                        <td className="p-2 text-right text-sm">
                          {item.financialData.pvp != null ? item.financialData.pvp.toFixed(2) : '-'}
                        </td>
                        <td className="p-2 text-right text-sm">
                          {item.financialData.vacanciaMedia != null
                            ? `${(item.financialData.vacanciaMedia * 100).toFixed(1)}%`
                            : '-'}
                        </td>
                        <td className="p-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleRow(item.rank); }}
                            className="h-8 w-8 p-0"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-muted/30 border-b">
                            <FIIScoreBreakdown
                              finalScore={parseScore(item.finalScore)}
                              isPapel={item.financialData?.isPapel}
                              breakdown={item.breakdown}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
