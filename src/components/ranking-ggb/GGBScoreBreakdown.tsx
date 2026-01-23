import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GGBScoreBreakdownProps {
  greenblattScore: number;
  grahamScore: number;
  bazinScore: number;
  finalScore: number;
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
  financialData?: {
    roic?: number | null;
    roe?: number | null;
    earningsYield?: number | null;
    evEbit?: number | null;
    ebit?: number | null;
    enterpriseValue?: number | null;
    dividaLiquidaEbitda?: number | null;
    dividaLiquidaPl?: number | null;
    totalDivida?: number | null;
    patrimonioLiquido?: number | null;
    liquidezCorrente?: number | null;
    totalCaixa?: number | null;
    ativoTotal?: number | null;
    lucroLiquido?: number | null;
    pvp?: number | null;
    dividendYield12m?: number | null;
    payout?: number | null;
    historicoUltimosDividendos?: string | null;
    sector?: string | null;
    historicalAverages?: {
      dy?: number | null;
      roe?: number | null;
      roic?: number | null;
      earningsYield?: number | null;
      [key: string]: any;
    } | null;
  };
}

export function GGBScoreBreakdown({
  greenblattScore,
  grahamScore,
  bazinScore,
  finalScore,
  breakdown,
  financialData,
}: GGBScoreBreakdownProps) {
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

  // Função para determinar se um indicador é positivo (verde) ou negativo (vermelho)
  const getIndicatorColor = (isPositive: boolean) => {
    return isPositive 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getIndicatorBorderColor = (isPositive: boolean) => {
    return isPositive 
      ? 'border-green-500/30' 
      : 'border-red-500/30';
  };

  // Função para determinar se um score normalizado é positivo (>= 50)
  const isScorePositive = (score: number) => score >= 50;

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

        {/* Greenblatt (45%) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">
              🟩 Greenblatt <span className="text-muted-foreground">(45%)</span>
            </span>
            <span className={`font-semibold ${getScoreColor(greenblattScore)}`}>
              {greenblattScore.toFixed(1)}
            </span>
          </div>
          <Progress value={greenblattScore} className="h-2" />
          {breakdown && (
            <div className="text-xs mt-2 ml-4 space-y-2">
              {(breakdown.canEvaluateROIC !== false) && (
                <div className={`border-l-2 ${getIndicatorBorderColor(isScorePositive(breakdown.roic))} pl-2`}>
                <div className={`font-medium ${getIndicatorColor(isScorePositive(breakdown.roic))} mb-0.5`}>
                  {breakdown.usingRoeAsProxy ? 'ROE (Return on Equity)' : 'ROIC (Return on Invested Capital)'}
                  {breakdown.usingRoeAsProxy && (
                    <span className="text-xs text-muted-foreground ml-1">(usado como proxy do ROIC para bancos)</span>
                  )}
                </div>
                <div>
                  Score: {breakdown.roic.toFixed(1)}/100
                  <span className="ml-1 text-muted-foreground">
                    (posição relativa: {breakdown.roic >= 80 ? 'Top' : breakdown.roic >= 50 ? 'Média' : 'Baixa'})
                  </span>
                </div>
                {breakdown.roicValue !== null && breakdown.roicValue !== undefined && (
                  <div className="text-muted-foreground">
                    Valor real: {(breakdown.roicValue * 100).toFixed(2)}%
                    {breakdown.usingRoeAsProxy && (
                      <span className="text-xs text-muted-foreground ml-1">(ROE usado como proxy)</span>
                    )}
                    {breakdown.roicValue > 0 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Positivo</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Negativo</span>
                    )}
                  </div>
                )}
                {!breakdown.roicValue && financialData?.roic !== null && financialData?.roic !== undefined && (
                  <div className="text-muted-foreground">
                    Valor real: {(financialData.roic * 100).toFixed(2)}%
                    {financialData.roic > 0 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Positivo</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Negativo</span>
                    )}
                  </div>
                )}
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  Contribuição: {((breakdown.roic / 100) * 25).toFixed(1)}/25 pts
                </div>
                </div>
              )}
              {(breakdown.canEvaluateEarningsYield !== false) && (
                <div className={`border-l-2 ${getIndicatorBorderColor(isScorePositive(breakdown.earningsYield))} pl-2`}>
                  <div className={`font-medium ${getIndicatorColor(isScorePositive(breakdown.earningsYield))} mb-0.5`}>Earnings Yield (EBIT/EV)</div>
                <div>
                  Score: {breakdown.earningsYield.toFixed(1)}/100
                  <span className="ml-1 text-muted-foreground">
                    (posição relativa: {breakdown.earningsYield >= 80 ? 'Top' : breakdown.earningsYield >= 50 ? 'Média' : 'Baixa'})
                  </span>
                </div>
                {financialData?.earningsYield !== null && financialData?.earningsYield !== undefined && (
                  <div className="text-muted-foreground">
                    Valor real: {(financialData.earningsYield * 100).toFixed(2)}%
                    {financialData.earningsYield > 0 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Positivo</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Negativo</span>
                    )}
                  </div>
                )}
                {!financialData?.earningsYield && financialData?.evEbit && financialData.evEbit > 0 && (
                  <div className="text-muted-foreground">
                    EV/EBIT: {financialData.evEbit.toFixed(2)} (quanto menor, melhor)
                  </div>
                )}
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  Contribuição: {((breakdown.earningsYield / 100) * 20).toFixed(1)}/20 pts
                </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Graham (35%) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">
              🟦 Graham <span className="text-muted-foreground">(35%)</span>
            </span>
            <span className={`font-semibold ${getScoreColor(grahamScore)}`}>
              {grahamScore.toFixed(1)}
            </span>
          </div>
          <Progress value={grahamScore} className="h-2" />
          {breakdown && (
            <div className="text-xs mt-2 ml-4 space-y-2">
              {(breakdown.canEvaluateDivida !== false) && (
                <div className={`border-l-2 ${getIndicatorBorderColor(isScorePositive(breakdown.divida))} pl-2`}>
                  <div className={`font-medium ${getIndicatorColor(isScorePositive(breakdown.divida))} mb-0.5`}>
                    Dívida Líquida
                    {breakdown.usingCalculatedDivida && (
                      <span className="text-xs text-muted-foreground ml-1">(calculado: Total Dívida/PL)</span>
                    )}
                  </div>
                <div>
                  Score: {breakdown.divida.toFixed(1)}/100
                  <span className="ml-1 text-muted-foreground">
                    (posição relativa: {breakdown.divida >= 80 ? 'Top' : breakdown.divida >= 50 ? 'Média' : 'Baixa'})
                  </span>
                </div>
                {breakdown.dividaValue !== null && breakdown.dividaValue !== undefined && (
                  <div className="text-muted-foreground">
                    {breakdown.usingCalculatedDivida ? 'DL/PL (calculado)' : financialData?.dividaLiquidaEbitda !== null ? 'DL/EBITDA' : 'DL/PL'}: {breakdown.dividaValue.toFixed(2)}
                    {breakdown.dividaValue < 2 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Baixa (positivo)</span>
                    ) : breakdown.dividaValue < 4 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Moderada</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Alta (negativo)</span>
                    )}
                  </div>
                )}
                {!breakdown.dividaValue && financialData?.dividaLiquidaEbitda !== null && financialData?.dividaLiquidaEbitda !== undefined && (
                  <div className="text-muted-foreground">
                    DL/EBITDA: {financialData.dividaLiquidaEbitda.toFixed(2)}
                    {financialData.dividaLiquidaEbitda < 2 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Baixa (positivo)</span>
                    ) : financialData.dividaLiquidaEbitda < 4 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Moderada</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Alta (negativo)</span>
                    )}
                  </div>
                )}
                {!breakdown.dividaValue && !financialData?.dividaLiquidaEbitda && financialData?.dividaLiquidaPl !== null && financialData?.dividaLiquidaPl !== undefined && (
                  <div className="text-muted-foreground">
                    DL/PL: {financialData.dividaLiquidaPl.toFixed(2)}
                    {financialData.dividaLiquidaPl < 0.5 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Baixa (positivo)</span>
                    ) : financialData.dividaLiquidaPl < 1.0 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Moderada</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Alta (negativo)</span>
                    )}
                  </div>
                )}
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  Contribuição: {((breakdown.divida / 100) * 15).toFixed(1)}/15 pts
                </div>
                </div>
              )}
              {(breakdown.canEvaluateLiquidez !== false) && (
                <div className={`border-l-2 ${getIndicatorBorderColor(isScorePositive(breakdown.liquidez))} pl-2`}>
                <div className={`font-medium ${getIndicatorColor(isScorePositive(breakdown.liquidez))} mb-0.5`}>
                  {breakdown.usingCalculatedLiquidez ? 'Liquidez (Caixa/Ativos)' : 'Liquidez Corrente'}
                  {breakdown.usingCalculatedLiquidez && (
                    <span className="text-xs text-muted-foreground ml-1">(calculado para bancos)</span>
                  )}
                </div>
                <div>
                  Score: {breakdown.liquidez.toFixed(1)}/100
                  <span className="ml-1 text-muted-foreground">
                    (posição relativa: {breakdown.liquidez >= 80 ? 'Top' : breakdown.liquidez >= 50 ? 'Média' : 'Baixa'})
                  </span>
                </div>
                {breakdown.liquidezValue !== null && breakdown.liquidezValue !== undefined && (
                  <div className="text-muted-foreground">
                    Valor real: {breakdown.usingCalculatedLiquidez 
                      ? `${(breakdown.liquidezValue * 100).toFixed(2)}% (Caixa/Ativos)`
                      : breakdown.liquidezValue.toFixed(2)}
                    {breakdown.usingCalculatedLiquidez 
                      ? breakdown.liquidezValue >= 0.02 ? (
                        <span className={`${getIndicatorColor(true)} ml-1`}>✓ Positivo</span>
                      ) : (
                        <span className={`${getIndicatorColor(false)} ml-1`}>✗ Negativo</span>
                      )
                      : breakdown.liquidezValue >= 1.0 ? (
                        <span className={`${getIndicatorColor(true)} ml-1`}>✓ Positivo</span>
                      ) : (
                        <span className={`${getIndicatorColor(false)} ml-1`}>✗ Negativo</span>
                      )}
                  </div>
                )}
                {!breakdown.liquidezValue && financialData?.liquidezCorrente !== null && financialData?.liquidezCorrente !== undefined && (
                  <div className="text-muted-foreground">
                    Valor real: {financialData.liquidezCorrente.toFixed(2)}
                    {financialData.liquidezCorrente >= 1.0 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Positivo</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Negativo</span>
                    )}
                  </div>
                )}
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  Contribuição: {((breakdown.liquidez / 100) * 10).toFixed(1)}/10 pts
                </div>
                </div>
              )}
              {(breakdown.canEvaluateHistoricoLucro !== false) && (
                <div className={`border-l-2 ${getIndicatorBorderColor(breakdown.historicoLucro > 0)} pl-2`}>
                <div className={`font-medium ${getIndicatorColor(breakdown.historicoLucro > 0)} mb-0.5`}>Histórico de Lucro</div>
                <div>
                  Score: {breakdown.historicoLucro.toFixed(1)}/10 pts
                  {breakdown.historicoLucro >= 10 ? (
                    <span className={`${getIndicatorColor(true)} ml-1`}>✓ Lucro positivo</span>
                  ) : (
                    <span className={`${getIndicatorColor(false)} ml-1`}>✗ Prejuízo</span>
                  )}
                </div>
                {financialData?.lucroLiquido !== null && financialData?.lucroLiquido !== undefined && (
                  <div className="text-muted-foreground">
                    Lucro Líquido: {financialData.lucroLiquido > 0 ? 'Positivo' : 'Negativo'}
                    {financialData.lucroLiquido > 0 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗</span>
                    )}
                  </div>
                )}
                {financialData?.pvp !== null && financialData?.pvp !== undefined && (
                  <div className="text-muted-foreground">
                    P/VP: {financialData.pvp.toFixed(2)}
                    {financialData.pvp < 1.0 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Subvalorizada (positivo)</span>
                    ) : financialData.pvp < 1.5 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Justa</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Sobrevalorizada (negativo)</span>
                    )}
                  </div>
                )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bazin (20%) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">
              🟨 Bazin <span className="text-muted-foreground">(20%)</span>
            </span>
            <span className={`font-semibold ${getScoreColor(bazinScore)}`}>
              {bazinScore.toFixed(1)}
            </span>
          </div>
          <Progress value={bazinScore} className="h-2" />
          {breakdown && (
            <div className="text-xs mt-2 ml-4 space-y-2">
              {(breakdown.canEvaluateDY !== false) && (
                <div className={`border-l-2 ${getIndicatorBorderColor(isScorePositive(breakdown.dy))} pl-2`}>
                  <div className={`font-medium ${getIndicatorColor(isScorePositive(breakdown.dy))} mb-0.5`}>
                    DY Médio (Dividend Yield - Média dos últimos 5 anos)
                  </div>
                <div>
                  Score: {breakdown.dy.toFixed(1)}/100
                  <span className="ml-1 text-muted-foreground">
                    (posição relativa: {breakdown.dy >= 80 ? 'Top' : breakdown.dy >= 50 ? 'Média' : 'Baixa'})
                  </span>
                </div>
                {financialData?.historicalAverages?.dy !== null && financialData?.historicalAverages?.dy !== undefined ? (
                  <div className="text-muted-foreground">
                    Média histórica (5 anos): {(financialData.historicalAverages.dy * 100).toFixed(2)}%
                    {financialData.historicalAverages.dy > 0 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Positivo</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Sem dividendos</span>
                    )}
                  </div>
                ) : financialData?.dividendYield12m !== null && financialData?.dividendYield12m !== undefined ? (
                  <div className="text-muted-foreground">
                    Valor atual (fallback - média histórica não disponível): {(financialData.dividendYield12m * 100).toFixed(2)}%
                    {financialData.dividendYield12m > 0 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Positivo</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Sem dividendos</span>
                    )}
                  </div>
                ) : null}
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  Contribuição: {((breakdown.dy / 100) * 10).toFixed(1)}/10 pts
                </div>
                </div>
              )}
              {breakdown.canEvaluatePayout !== false && (
                <div className={`border-l-2 ${getIndicatorBorderColor(breakdown.payout >= 2.5)} pl-2`}>
                  <div className={`font-medium ${getIndicatorColor(breakdown.payout >= 2.5)} mb-0.5`}>Payout Ratio</div>
                  <div>
                    Score: {breakdown.payout.toFixed(1)}/5 pts
                    {breakdown.payout >= 4.5 ? (
                      <span className={`${getIndicatorColor(true)} ml-1`}>✓ Sustentável (positivo)</span>
                    ) : breakdown.payout >= 2.5 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Moderado</span>
                    ) : breakdown.payout > 0 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Alto</span>
                    ) : (
                      <span className={`${getIndicatorColor(false)} ml-1`}>✗ Insustentável (negativo)</span>
                    )}
                  </div>
                  {financialData?.payout !== null && financialData?.payout !== undefined && (
                    <div className="text-muted-foreground">
                      Valor real: {(financialData.payout * 100).toFixed(1)}%
                      {financialData.payout < 0.8 ? (
                        <span className={`${getIndicatorColor(true)} ml-1`}>(Sustentável - positivo)</span>
                      ) : financialData.payout <= 1.0 ? (
                        <span className="text-yellow-600 dark:text-yellow-400 ml-1">(Moderado)</span>
                      ) : (
                        <span className={`${getIndicatorColor(false)} ml-1`}>(Insustentável - negativo)</span>
                      )}
                    </div>
                  )}
                  <div className="text-muted-foreground text-[10px] mt-0.5">
                    Contribuição: {breakdown.payout.toFixed(1)}/5 pts
                  </div>
                </div>
              )}
              {(breakdown.canEvaluateConsistencia !== false) && (
                <div className={`border-l-2 ${getIndicatorBorderColor(breakdown.consistencia >= 2.5)} pl-2`}>
                  <div className={`font-medium ${getIndicatorColor(breakdown.consistencia >= 2.5)} mb-0.5`}>Consistência de Dividendos</div>
                <div>
                  Score: {breakdown.consistencia.toFixed(1)}/5 pts
                  {breakdown.consistencia >= 4 ? (
                    <span className={`${getIndicatorColor(true)} ml-1`}>✓ Consistente (positivo)</span>
                  ) : breakdown.consistencia >= 2.5 ? (
                    <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Parcial</span>
                  ) : breakdown.consistencia > 0 ? (
                    <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Baixa</span>
                  ) : (
                    <span className={`${getIndicatorColor(false)} ml-1`}>✗ Sem histórico (negativo)</span>
                  )}
                </div>
                {financialData?.historicoUltimosDividendos && (
                  <div className="text-muted-foreground">
                    Histórico: {financialData.historicoUltimosDividendos.split(',').length} períodos
                  </div>
                )}
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  Contribuição: {breakdown.consistencia.toFixed(1)}/5 pts
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

