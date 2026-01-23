'use client';

import { useState, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GGBScoreBreakdown } from './GGBScoreBreakdown';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GGBRankingItem {
  ticker: string;
  companyName: string | null;
  sector: string | null;
  industry: string | null;
  greenblattScore: number;
  grahamScore: number;
  bazinScore: number;
  finalScore: number;
  rank: number;
  financialData: Record<string, any>;
  breakdown?: {
    roic: number;
    roicValue?: number | null;
    usingRoeAsProxy?: boolean;
    canEvaluateROIC?: boolean;
    earningsYield: number;
    canEvaluateEarningsYield?: boolean;
    divida: number;
    dividaValue?: number | null;
    usingCalculatedDivida?: boolean;
    canEvaluateDivida?: boolean;
    liquidez: number;
    liquidezValue?: number | null;
    usingCalculatedLiquidez?: boolean;
    canEvaluateLiquidez?: boolean;
    historicoLucro: number;
    canEvaluateHistoricoLucro?: boolean;
    pvp?: number;
    dy: number;
    canEvaluateDY?: boolean;
    payout: number;
    canEvaluatePayout?: boolean;
    consistencia: number;
    canEvaluateConsistencia?: boolean;
  };
  lastUpdated?: string;
}

interface GGBRankingTableProps {
  data: GGBRankingItem[];
  isLoading?: boolean;
}

export function GGBRankingTable({ data, isLoading }: GGBRankingTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'rank' | 'finalScore' | 'ticker'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleRow = (rank: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rank)) {
      newExpanded.delete(rank);
    } else {
      newExpanded.add(rank);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field: 'rank' | 'finalScore' | 'ticker') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'rank') {
      comparison = a.rank - b.rank;
    } else if (sortBy === 'finalScore') {
      comparison = a.finalScore - b.finalScore;
    } else if (sortBy === 'ticker') {
      comparison = a.ticker.localeCompare(b.ticker);
    }
    
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
            Carregando ranking...
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
    <Card>
      <CardHeader>
        <CardTitle>Ranking GGB</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('rank')}
                    className="h-auto p-1"
                  >
                    Rank
                    {sortBy === 'rank' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </th>
                <th className="text-left p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('ticker')}
                    className="h-auto p-1"
                  >
                    Ticker
                    {sortBy === 'ticker' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </th>
                <th className="text-left p-2">Empresa</th>
                <th className="text-left p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('finalScore')}
                    className="h-auto p-1"
                  >
                    Score Final
                    {sortBy === 'finalScore' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </th>
                <th className="text-left p-2">Scores</th>
                <th className="text-left p-2">Indicadores</th>
                <th className="text-left p-2"></th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => {
                const isExpanded = expandedRows.has(item.rank);
                const medal = getMedal(item.rank);
                
                return (
                  <Fragment key={item.ticker}>
                    <tr className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        {medal && <span>{medal}</span>}
                        <span className="font-semibold">#{item.rank}</span>
                      </div>
                    </td>
                    <td className="p-2 font-mono font-semibold">{item.ticker}</td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{item.companyName || '-'}</div>
                        {item.sector && (
                          <div className="text-xs text-muted-foreground">{item.sector}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={`text-lg font-bold ${getScoreColor(item.finalScore)}`}>
                        {item.finalScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="text-muted-foreground">G:</span>{' '}
                          <span className={getScoreColor(item.greenblattScore)}>
                            {item.greenblattScore.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gr:</span>{' '}
                          <span className={getScoreColor(item.grahamScore)}>
                            {item.grahamScore.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">B:</span>{' '}
                          <span className={getScoreColor(item.bazinScore)}>
                            {item.bazinScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs space-y-1">
                        <div>
                          ROIC: {item.financialData.roic ? `${(item.financialData.roic * 100).toFixed(1)}%` : '-'}
                        </div>
                        <div>
                          DY: {item.financialData.dividendYield12m ? `${(item.financialData.dividendYield12m * 100).toFixed(1)}%` : '-'}
                        </div>
                        <div>
                          P/VP: {item.financialData.pvp ? item.financialData.pvp.toFixed(2) : '-'}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(item.rank)}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                    </tr>
                    {/* Expanded content dentro da tabela */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-4 bg-muted/30 border-b">
                        <GGBScoreBreakdown
                          greenblattScore={item.greenblattScore}
                          grahamScore={item.grahamScore}
                          bazinScore={item.bazinScore}
                          finalScore={item.finalScore}
                          breakdown={item.breakdown}
                          financialData={{
                            roic: item.financialData.roic,
                            roe: item.financialData.roe,
                            earningsYield: item.financialData.earningsYield,
                            evEbit: item.financialData.evEbit,
                            ebit: item.financialData.ebit,
                            enterpriseValue: item.financialData.enterpriseValue,
                            dividaLiquidaEbitda: item.financialData.dividaLiquidaEbitda,
                            dividaLiquidaPl: item.financialData.dividaLiquidaPl,
                            totalDivida: item.financialData.totalDivida,
                            patrimonioLiquido: item.financialData.patrimonioLiquido,
                            liquidezCorrente: item.financialData.liquidezCorrente,
                            totalCaixa: item.financialData.totalCaixa,
                            ativoTotal: item.financialData.ativoTotal,
                            lucroLiquido: item.financialData.lucroLiquido,
                            pvp: item.financialData.pvp,
                            dividendYield12m: item.financialData.dividendYield12m,
                            payout: item.financialData.payout,
                            historicoUltimosDividendos: item.financialData.historicoUltimosDividendos,
                            sector: item.sector,
                            historicalAverages: item.financialData.historicalAverages,
                          }}
                        />
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">ROIC</div>
                            <div className="font-semibold">
                              {item.financialData.roic ? `${(item.financialData.roic * 100).toFixed(2)}%` : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Earnings Yield</div>
                            <div className="font-semibold">
                              {item.financialData.earningsYield ? `${(item.financialData.earningsYield * 100).toFixed(2)}%` : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">DL/EBITDA</div>
                            <div className="font-semibold">
                              {item.financialData.dividaLiquidaEbitda ? item.financialData.dividaLiquidaEbitda.toFixed(2) : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Liquidez Corrente</div>
                            <div className="font-semibold">
                              {item.financialData.liquidezCorrente ? item.financialData.liquidezCorrente.toFixed(2) : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">P/VP</div>
                            <div className="font-semibold">
                              {item.financialData.pvp ? item.financialData.pvp.toFixed(2) : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">P/L</div>
                            <div className="font-semibold">
                              {item.financialData.pl ? item.financialData.pl.toFixed(2) : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Payout</div>
                            <div className="font-semibold">
                              {item.financialData.payout ? `${(item.financialData.payout * 100).toFixed(1)}%` : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">ROE</div>
                            <div className="font-semibold">
                              {item.financialData.roe ? `${(item.financialData.roe * 100).toFixed(2)}%` : '-'}
                            </div>
                          </div>
                        </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

