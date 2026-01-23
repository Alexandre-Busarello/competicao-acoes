/**
 * Serviço para calcular scores do Ranking GGB
 * Metodologia: Greenblatt (45%) + Graham (35%) + Bazin (20%)
 */

interface HistoricalAverages {
  dy?: number | null;
  roe?: number | null;
  roic?: number | null;
  earningsYield?: number | null;
  // ... outras médias dos últimos 5 anos
}

interface FinancialData {
  // Greenblatt
  roic?: number | null;
  earningsYield?: number | null;
  evEbit?: number | null;
  ebit?: number | null;
  enterpriseValue?: number | null;
  
  // Graham
  dividaLiquidaEbitda?: number | null;
  dividaLiquidaPl?: number | null;
  liquidezCorrente?: number | null;
  lucroLiquido?: number | null;
  pvp?: number | null;
  
  // Bazin
  dividendYield12m?: number | null;
  payout?: number | null;
  historicoUltimosDividendos?: string | null;
  
  // Métricas alternativas (especialmente para bancos)
  roe?: number | null; // Return on Equity - alternativa ao ROIC para bancos
  roa?: number | null; // Return on Assets - útil para bancos
  totalDivida?: number | null; // Para calcular DL/PL quando dividaLiquidaPl não está disponível
  patrimonioLiquido?: number | null; // Para calcular DL/PL
  totalCaixa?: number | null; // Para avaliar liquidez alternativa
  debtToEquity?: number | null; // Dívida/Patrimônio - alternativa para avaliar dívida
  ativoTotal?: number | null; // Total de ativos - útil para bancos
  
  // Outros
  sector?: string | null;
  industry?: string | null;
  
  // Médias históricas (5 anos)
  historicalAverages?: HistoricalAverages | null;
}

interface GGBScores {
  greenblattScore: number;
  grahamScore: number;
  bazinScore: number;
  finalScore: number;
  breakdown: {
    roic: number;
    roicValue?: number | null; // Valor real usado (ROIC ou ROE para bancos)
    usingRoeAsProxy?: boolean; // Flag indicando se está usando ROE como proxy
    canEvaluateROIC?: boolean; // Flag indicando se ROIC pode ser avaliado
    earningsYield: number;
    canEvaluateEarningsYield?: boolean; // Flag indicando se Earnings Yield pode ser avaliado
    divida: number;
    dividaValue?: number | null; // Valor real usado (DL/PL calculado ou original)
    usingCalculatedDivida?: boolean; // Flag indicando se DL/PL foi calculado
    canEvaluateDivida?: boolean; // Flag indicando se Dívida pode ser avaliada
    liquidez: number;
    liquidezValue?: number | null; // Valor real usado (liquidez corrente ou caixa/ativos)
    usingCalculatedLiquidez?: boolean; // Flag indicando se liquidez foi calculada
    canEvaluateLiquidez?: boolean; // Flag indicando se Liquidez pode ser avaliada
    historicoLucro: number;
    canEvaluateHistoricoLucro?: boolean; // Flag indicando se Histórico de Lucro pode ser avaliado
    pvp?: number; // P/VP normalizado (0-100) para exibição - usado como validação no Graham
    dy: number;
    canEvaluateDY?: boolean; // Flag indicando se DY pode ser avaliado
    payout: number;
    canEvaluatePayout?: boolean; // Flag indicando se Payout pode ser avaliado
    consistencia: number;
    canEvaluateConsistencia?: boolean; // Flag indicando se Consistência pode ser avaliada
  };
}

interface StockData {
  ticker: string;
  financialData: FinancialData;
  historicalAverages?: HistoricalAverages | null;
}

/**
 * Normaliza um valor para escala 0-100 baseado em min/max
 */
function normalizeScore(
  value: number,
  min: number,
  max: number,
  invert: boolean = false
): number {
  if (max === min) return 50; // Se todos os valores são iguais, retorna médio
  
  const normalized = ((value - min) / (max - min)) * 100;
  const clamped = Math.max(0, Math.min(100, normalized));
  
  return invert ? 100 - clamped : clamped;
}

/**
 * Calcula percentis para normalização
 */
function calculatePercentiles(values: number[]): { p25: number; p50: number; p75: number; p90: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    p25: sorted[Math.floor(len * 0.25)] || 0,
    p50: sorted[Math.floor(len * 0.50)] || 0,
    p75: sorted[Math.floor(len * 0.75)] || 0,
    p90: sorted[Math.floor(len * 0.90)] || 0,
  };
}

/**
 * Verifica se uma ação deve ser excluída do ranking
 */
export function shouldExcludeStock(financialData: FinancialData): boolean {
  const sector = financialData.sector;
  const isBank = isBankSector(sector);
  
  // ROIC ≤ 0 → fora do ranking
  // EXCEÇÃO: Bancos podem não ter ROIC (usam ROE), então não excluir se for banco e não tiver ROIC
  if (!isBank) {
    if (financialData.roic !== null && financialData.roic !== undefined && financialData.roic <= 0) {
      return true;
    }
  } else {
    // Para bancos, só excluir se ROIC for explicitamente negativo (não apenas ausente)
    if (financialData.roic !== null && financialData.roic !== undefined && financialData.roic < 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verifica se há prejuízo recorrente
 */
function hasRecurringLoss(financialData: FinancialData): boolean {
  // Se lucro líquido é negativo, considera prejuízo
  if (financialData.lucroLiquido !== null && financialData.lucroLiquido !== undefined && financialData.lucroLiquido < 0) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se Graham está muito fraco
 */
function isGrahamWeak(financialData: FinancialData): boolean {
  const sector = financialData.sector;
  const isBank = isBankSector(sector);
  
  // Para bancos, usar métricas alternativas
  if (isBank) {
    // Calcular DL/PL usando totalDivida e patrimonioLiquido se disponível
    let dividaPl: number | null = null;
    
    const totalDivida = financialData.totalDivida;
    const patrimonioLiquido = financialData.patrimonioLiquido;
    
    if (totalDivida !== null && totalDivida !== undefined && 
        patrimonioLiquido !== null && patrimonioLiquido !== undefined && 
        patrimonioLiquido > 0) {
      dividaPl = totalDivida / patrimonioLiquido;
    } else {
      dividaPl = financialData.dividaLiquidaPl ?? null;
      if (dividaPl === null && financialData.debtToEquity !== null && financialData.debtToEquity !== undefined) {
        dividaPl = financialData.debtToEquity;
      }
    }
    
    // Calcular liquidez alternativa para bancos
    let liquidez: number | null = null;
    const totalCaixa = financialData.totalCaixa;
    const ativoTotal = financialData.ativoTotal;
    
    if (totalCaixa !== null && totalCaixa !== undefined && 
        ativoTotal !== null && ativoTotal !== undefined && 
        ativoTotal > 0) {
      liquidez = totalCaixa / ativoTotal;
    } else {
      liquidez = financialData.liquidezCorrente ?? null;
    }
    
    // Só considerar fraco se tiver dados E forem ruins
    // Para bancos, usar limites mais flexíveis
    if (dividaPl !== null && dividaPl !== undefined && dividaPl > 3) {
      // DL/PL > 3 para bancos (mais flexível que 2 para empresas normais)
      return true;
    }
    if (liquidez !== null && liquidez !== undefined && liquidez < 0.02) {
      // Caixa/Ativos < 2% para bancos (muito baixo)
      return true;
    }
    // Se não tem dados, não considerar fraco (não penalizar)
    return false;
  }
  
  // Para empresas não-bancos, aplicar regra normal
  const dividaEbitda = financialData.dividaLiquidaEbitda ?? Infinity;
  const dividaPl = financialData.dividaLiquidaPl ?? Infinity;
  const liquidez = financialData.liquidezCorrente ?? 0;
  
  // Dívida muito alta (DL/EBITDA > 5 ou DL/PL > 2) OU liquidez < 1
  // Só considerar se tiver dados (não usar Infinity se não tiver dados)
  const hasDividaData = financialData.dividaLiquidaEbitda !== null || financialData.dividaLiquidaPl !== null;
  const hasLiquidezData = financialData.liquidezCorrente !== null && financialData.liquidezCorrente !== undefined;
  
  if (hasDividaData && (dividaEbitda > 5 || dividaPl > 2)) {
    return true;
  }
  if (hasLiquidezData && liquidez < 1) {
    return true;
  }
  
  return false;
}

/**
 * Normaliza usando percentis para evitar distorção por outliers
 */
function normalizeWithPercentiles(
  value: number,
  values: number[],
  invert: boolean = false
): number {
  if (values.length === 0) return 50;
  
  const sorted = [...values].sort((a, b) => a - b);
  const p10Index = Math.floor(sorted.length * 0.10);
  const p90Index = Math.floor(sorted.length * 0.90);
  const p10 = sorted[p10Index] || sorted[0];
  const p90 = sorted[p90Index] || sorted[sorted.length - 1];
  
  // Usar p10-p90 como range para normalização (mais robusto que min-max)
  const normalized = p90 === p10 
    ? 50 
    : Math.max(0, Math.min(100, ((value - p10) / (p90 - p10)) * 100));
  
  return invert ? 100 - normalized : normalized;
}

/**
 * Verifica se é setor de Bancos
 */
function isBankSector(sector: string | null | undefined): boolean {
  if (!sector) return false;
  const sectorLower = sector.toLowerCase();
  return sectorLower.includes('banco') || sectorLower.includes('financeiro') || sectorLower.includes('bancário');
}

/**
 * Verifica se é setor Utilities
 */
function isUtilitiesSector(sector: string | null | undefined): boolean {
  if (!sector) return false;
  const sectorLower = sector.toLowerCase();
  return sectorLower.includes('utilidade') || sectorLower.includes('energia') || sectorLower.includes('elétrica');
}

/**
 * Verifica se é setor Commodities
 */
function isCommoditiesSector(sector: string | null | undefined): boolean {
  if (!sector) return false;
  const sectorLower = sector.toLowerCase();
  return sectorLower.includes('commodity') || sectorLower.includes('mineração') || sectorLower.includes('petróleo') || sectorLower.includes('siderurgia');
}

/**
 * Verifica se é setor Growth
 */
function isGrowthSector(sector: string | null | undefined, industry: string | null | undefined): boolean {
  if (!sector && !industry) return false;
  const sectorLower = (sector || '').toLowerCase();
  const industryLower = (industry || '').toLowerCase();
  return sectorLower.includes('tecnologia') || sectorLower.includes('tech') || 
         industryLower.includes('software') || industryLower.includes('internet') || industryLower.includes('e-commerce');
}

/**
 * Calcula score Greenblatt (45% do total)
 */
function calculateGreenblattScore(
  financialData: FinancialData,
  allStocks: StockData[],
  historicalAverages?: HistoricalAverages | null
): { score: number; breakdown: { roic: number; roicValue?: number | null; usingRoeAsProxy?: boolean; canEvaluateROIC?: boolean; earningsYield: number; canEvaluateEarningsYield?: boolean } } {
  const sector = financialData.sector;
  const isBank = isBankSector(sector);
  const isCommodities = isCommoditiesSector(sector);
  
  // AJUSTE POR SETOR: Commodities → Usar média de ciclo (médias históricas de 5 anos)
  // Para Commodities, usar médias históricas em vez de valores TTM para suavizar ciclos econômicos
  
  // ROIC (25 pts) - normalizar de 0-100, depois converter para 0-25 pontos
  // Para Commodities, priorizar média histórica de ROIC
  // Para Bancos, se não tiver ROIC, usar ROE como alternativa (ROE é equivalente para bancos)
  let roicValue: number | null = null;
  
  let usingRoeAsProxy = false; // Definir flag no início
  
  if (isCommodities && historicalAverages?.roic !== null && historicalAverages?.roic !== undefined && historicalAverages.roic > 0) {
    roicValue = historicalAverages.roic;
  } else {
    roicValue = financialData.roic ?? null;
    
    // Para bancos sem ROIC, usar ROE como alternativa (ROE é equivalente ao ROIC para bancos)
    if (isBank && (roicValue === null || roicValue === undefined || roicValue <= 0)) {
      const roeValue = financialData.roe ?? null;
      
      if (roeValue !== null && roeValue !== undefined && roeValue > 0) {
        roicValue = roeValue; // Usar ROE como proxy do ROIC para bancos
        usingRoeAsProxy = true; // Marcar que estamos usando ROE como proxy
      }
    }
  }
  
  // Coletar ROICs de todas as ações (priorizando médias históricas para Commodities)
  // Para bancos, usar ROE quando ROIC não estiver disponível
  const roicValues = allStocks
    .map(s => {
      const isStockCommodities = isCommoditiesSector(s.financialData.sector);
      const isStockBank = isBankSector(s.financialData.sector);
      
      // Para Commodities, priorizar média histórica
      if (isStockCommodities && s.historicalAverages?.roic !== null && s.historicalAverages?.roic !== undefined && s.historicalAverages.roic > 0) {
        return s.historicalAverages.roic;
      }
      
      // Para bancos, usar ROE se não tiver ROIC
      if (isStockBank) {
        const stockRoic = s.financialData.roic;
        if (stockRoic !== null && stockRoic !== undefined && stockRoic > 0) {
          return stockRoic;
        }
        // Se banco não tem ROIC, usar ROE como proxy
        const stockRoe = s.financialData.roe;
        if (stockRoe !== null && stockRoe !== undefined && stockRoe > 0) {
          return stockRoe;
        }
        return null;
      }
      
      // Senão, usar valor TTM
      return s.financialData.roic;
    })
    .filter((v): v is number => v !== null && v !== undefined && v > 0);
  
  // Calcular score de ROIC
  let roicNormalized = 0;
  let roicScore = 0;
  const canEvaluateROIC = roicValue !== null && roicValue !== undefined && roicValue > 0 && roicValues.length > 0;
  
  // O flag usingRoeAsProxy já foi definido acima quando atribuímos roicValue = roeValue
  
  if (canEvaluateROIC && roicValue !== null) {
    roicNormalized = normalizeWithPercentiles(roicValue, roicValues);
    roicScore = (roicNormalized / 100) * 25;
  } else if (isBank) {
    // Para bancos sem ROIC e sem ROE, dar score neutro (não penalizar)
    roicNormalized = 50; // Score neutro normalizado
    roicScore = (roicNormalized / 100) * 25; // 12.5 pontos (metade dos 25)
  }
  // Se não é banco e não tem ROIC, score permanece 0 (já está excluído pela regra de exclusão)
  
  // Earnings Yield (20 pts) - EBIT/EV
  // AJUSTE POR SETOR: Bancos → Remove EV/EBITDA (não usar Earnings Yield)
  // AJUSTE POR SETOR: Commodities → Usar média de ciclo (médias históricas de 5 anos)
  let earningsYieldScore = 0;
  let earningsYieldNormalized = 0;
  let canEvaluateEarningsYield = false;
  
  if (!isBank) {
    // Para Commodities, priorizar média histórica de Earnings Yield
    let earningsYieldValue: number | null = null;
    
    if (isCommodities && historicalAverages?.earningsYield !== null && historicalAverages?.earningsYield !== undefined && historicalAverages.earningsYield > 0) {
      earningsYieldValue = historicalAverages.earningsYield;
    } else {
      // Se não é Commodities ou não tem média histórica, calcular normalmente
      earningsYieldValue = financialData.earningsYield ?? null;
      
      if (!earningsYieldValue && financialData.evEbit && financialData.evEbit > 0) {
        earningsYieldValue = 1 / financialData.evEbit;
      } else if (!earningsYieldValue && financialData.ebit && financialData.enterpriseValue && financialData.enterpriseValue > 0) {
        earningsYieldValue = financialData.ebit / financialData.enterpriseValue;
      }
    }
    
    canEvaluateEarningsYield = earningsYieldValue !== null && earningsYieldValue !== undefined && earningsYieldValue > 0;
    
    // Coletar Earnings Yields de todas as ações (priorizando médias históricas para Commodities)
    const earningsYieldValues = allStocks
      .filter(s => !isBankSector(s.financialData.sector)) // Excluir bancos do cálculo de normalização
      .map(s => {
        const isStockCommodities = isCommoditiesSector(s.financialData.sector);
        // Para Commodities, priorizar média histórica
        if (isStockCommodities && s.historicalAverages?.earningsYield !== null && s.historicalAverages?.earningsYield !== undefined && s.historicalAverages.earningsYield > 0) {
          return s.historicalAverages.earningsYield;
        }
        // Senão, calcular normalmente
        const ey = s.financialData.earningsYield;
        if (ey !== null && ey !== undefined) return ey;
        if (s.financialData.evEbit && s.financialData.evEbit > 0) return 1 / s.financialData.evEbit;
        if (s.financialData.ebit && s.financialData.enterpriseValue && s.financialData.enterpriseValue > 0) {
          return s.financialData.ebit / s.financialData.enterpriseValue;
        }
        return null;
      })
      .filter((v): v is number => v !== null && v !== undefined && v > 0);
    
    earningsYieldNormalized = canEvaluateEarningsYield && earningsYieldValues.length > 0
      ? normalizeWithPercentiles(earningsYieldValue!, earningsYieldValues)
      : 0;
    
    // Converter para pontos (0-20)
    earningsYieldScore = canEvaluateEarningsYield ? (earningsYieldNormalized / 100) * 20 : 0;
  }
  // Se for banco, earningsYieldScore permanece 0 e canEvaluateEarningsYield = false
  
  // Redistribuir pontos se algum indicador não puder ser avaliado
  const roicMaxPoints = 25;
  const earningsYieldMaxPoints = isBank ? 0 : 20; // Bancos não têm Earnings Yield
  
  const greenblattScores = redistributePoints([
    { score: roicScore, maxPoints: roicMaxPoints, canEvaluate: canEvaluateROIC || (isBank && roicScore > 0) },
    { score: earningsYieldScore, maxPoints: earningsYieldMaxPoints, canEvaluate: canEvaluateEarningsYield },
  ]);
  
  const finalRoicScore = greenblattScores[0].score;
  const finalEarningsYieldScore = greenblattScores[1].score;
  
  // Score total Greenblatt (máximo 45 pontos)
  // Para bancos, máximo é 25 (só ROIC), para outros é 45
  const totalScore = finalRoicScore + finalEarningsYieldScore;
  
  return {
    score: totalScore,
    breakdown: {
      roic: roicNormalized, // Retornar valor normalizado 0-100 para exibição
      roicValue: roicValue, // Valor real usado (ROIC ou ROE)
      usingRoeAsProxy: usingRoeAsProxy, // Flag indicando se está usando ROE
      canEvaluateROIC: canEvaluateROIC || (isBank && roicScore > 0), // Flag indicando se ROIC pode ser avaliado
      earningsYield: earningsYieldNormalized, // Retornar valor normalizado 0-100 para exibição
      canEvaluateEarningsYield: canEvaluateEarningsYield, // Flag indicando se Earnings Yield pode ser avaliado
    },
  };
}

/**
 * Calcula score Graham (35% do total)
 * Indicadores:
 * - Dívida (DL/EBITDA ou DL/PL) → 15 pts
 * - Liquidez corrente → 10 pts
 * - Histórico de lucro → 10 pts
 * - P/VP controlado → usado como validação adicional (não pontuado separadamente)
 */
function calculateGrahamScore(
  financialData: FinancialData,
  allStocks: StockData[]
): { score: number; breakdown: { divida: number; dividaValue?: number | null; usingCalculatedDivida?: boolean; canEvaluateDivida?: boolean; liquidez: number; liquidezValue?: number | null; usingCalculatedLiquidez?: boolean; canEvaluateLiquidez?: boolean; historicoLucro: number; canEvaluateHistoricoLucro?: boolean; pvp?: number } } {
  // Dívida (15 pts) - DL/EBITDA ou DL/PL, quanto menor melhor
  // Para bancos, calcular DL/PL usando totalDivida e patrimonioLiquido se disponível
  // Para outras empresas que não têm esse indicador, usar alternativas ou dar score neutro
  const sector = financialData.sector;
  const isBank = isBankSector(sector);
  
  // Calcular valor de dívida (com alternativas para bancos)
  let dividaValue: number | null = null;
  let usingCalculatedDivida = false;
  
  if (isBank) {
    // Para bancos, tentar calcular DL/PL usando totalDivida e patrimonioLiquido
    const totalDivida = financialData.totalDivida;
    const patrimonioLiquido = financialData.patrimonioLiquido;
    
    if (totalDivida !== null && totalDivida !== undefined && 
        patrimonioLiquido !== null && patrimonioLiquido !== undefined && 
        patrimonioLiquido > 0) {
      // Calcular DL/PL = Total Dívida / Patrimônio Líquido
      dividaValue = totalDivida / patrimonioLiquido;
      usingCalculatedDivida = true; // Flag indicando que foi calculado
    } else {
      // Tentar usar dividaLiquidaPl se disponível
      dividaValue = financialData.dividaLiquidaPl ?? null;
      
      // Se ainda não tiver, tentar usar debtToEquity como alternativa
      if (dividaValue === null && financialData.debtToEquity !== null && financialData.debtToEquity !== undefined) {
        dividaValue = financialData.debtToEquity;
      }
    }
  } else {
    // Para não-bancos, usar DL/EBITDA ou DL/PL normalmente
    dividaValue = financialData.dividaLiquidaEbitda ?? financialData.dividaLiquidaPl ?? null;
  }
  
  // Coletar valores de dívida de todas as ações (com alternativas para bancos)
  const dividaValues = allStocks
    .map(s => {
      const isStockBank = isBankSector(s.financialData.sector);
      
      if (isStockBank) {
        // Para bancos, calcular DL/PL usando totalDivida e patrimonioLiquido
        const stockTotalDivida = s.financialData.totalDivida;
        const stockPatrimonioLiquido = s.financialData.patrimonioLiquido;
        
        if (stockTotalDivida !== null && stockTotalDivida !== undefined && 
            stockPatrimonioLiquido !== null && stockPatrimonioLiquido !== undefined && 
            stockPatrimonioLiquido > 0) {
          return stockTotalDivida / stockPatrimonioLiquido;
        }
        
        // Tentar usar dividaLiquidaPl se disponível
        if (s.financialData.dividaLiquidaPl !== null && s.financialData.dividaLiquidaPl !== undefined) {
          return s.financialData.dividaLiquidaPl;
        }
        
        // Tentar usar debtToEquity como alternativa
        if (s.financialData.debtToEquity !== null && s.financialData.debtToEquity !== undefined) {
          return s.financialData.debtToEquity;
        }
        
        return null;
      } else {
        // Para não-bancos, usar DL/EBITDA ou DL/PL normalmente
        return s.financialData.dividaLiquidaEbitda ?? s.financialData.dividaLiquidaPl ?? null;
      }
    })
    .filter((v): v is number => v !== null && v !== undefined && v >= 0);
  
  let dividaNormalized = 0;
  let dividaScore = 0;
  const canEvaluateDivida = dividaValue !== null && dividaValue !== undefined && dividaValues.length > 0;
  
  // O flag usingCalculatedDivida já foi definido acima quando calculamos dividaValue
  
  if (canEvaluateDivida && dividaValue !== null) {
    dividaNormalized = normalizeWithPercentiles(dividaValue, dividaValues, true); // Inverter: menor é melhor
    dividaScore = (dividaNormalized / 100) * 15;
  } else if (isBank || dividaValues.length === 0) {
    // Para bancos sem dados de dívida ou quando não há dados disponíveis, dar score neutro (não penalizar)
    dividaNormalized = 50; // Score neutro normalizado
    dividaScore = (dividaNormalized / 100) * 15; // 7.5 pontos (metade dos 15)
  } else {
    // Se não é banco e não tem dívida (dividaValue === null), significa empresa sem dívida = excelente
    dividaNormalized = 100; // Score máximo normalizado (sem dívida é excelente)
    dividaScore = (dividaNormalized / 100) * 15; // 15 pontos (máximo)
  }
  
  const canEvaluateDividaFinal = canEvaluateDivida || dividaScore > 0;
  
  // Liquidez Corrente (10 pts) - quanto maior melhor
  // Para bancos, usar métricas alternativas (totalCaixa/ativoTotal ou similar)
  // Para outras empresas que não têm esse indicador, dar score neutro (não penalizar)
  let liquidezValue: number | null = null;
  
  let usingCalculatedLiquidez = false;
  
  if (isBank) {
    // Para bancos, tentar calcular métrica alternativa de liquidez
    // Usar totalCaixa/ativoTotal como proxy de liquidez (quanto maior, melhor)
    const totalCaixa = financialData.totalCaixa;
    const ativoTotal = financialData.ativoTotal;
    
    if (totalCaixa !== null && totalCaixa !== undefined && 
        ativoTotal !== null && ativoTotal !== undefined && 
        ativoTotal > 0) {
      liquidezValue = totalCaixa / ativoTotal; // Caixa/Ativos como proxy de liquidez
      usingCalculatedLiquidez = true; // Flag indicando que foi calculado
    } else {
      // Se não tiver dados alternativos, usar liquidezCorrente se disponível
      liquidezValue = financialData.liquidezCorrente ?? null;
    }
  } else {
    // Para não-bancos, usar liquidezCorrente normalmente
    liquidezValue = financialData.liquidezCorrente ?? null;
  }
  
  // Coletar valores de liquidez de todas as ações (com alternativas para bancos)
  const liquidezValues = allStocks
    .map(s => {
      const isStockBank = isBankSector(s.financialData.sector);
      
      if (isStockBank) {
        // Para bancos, usar totalCaixa/ativoTotal como proxy
        const stockTotalCaixa = s.financialData.totalCaixa;
        const stockAtivoTotal = s.financialData.ativoTotal;
        
        if (stockTotalCaixa !== null && stockTotalCaixa !== undefined && 
            stockAtivoTotal !== null && stockAtivoTotal !== undefined && 
            stockAtivoTotal > 0) {
          return stockTotalCaixa / stockAtivoTotal;
        }
        
        // Se não tiver, usar liquidezCorrente se disponível
        return s.financialData.liquidezCorrente ?? null;
      } else {
        return s.financialData.liquidezCorrente ?? null;
      }
    })
    .filter((v): v is number => v !== null && v !== undefined && v > 0);
  
  let liquidezNormalized = 0;
  let liquidezScore = 0;
  const canEvaluateLiquidez = liquidezValue !== null && liquidezValue !== undefined && liquidezValue > 0 && liquidezValues.length > 0;
  
  if (canEvaluateLiquidez && liquidezValue !== null) {
    liquidezNormalized = normalizeWithPercentiles(liquidezValue, liquidezValues);
    liquidezScore = (liquidezNormalized / 100) * 10;
  } else if (isBank || liquidezValues.length === 0) {
    // Para bancos sem dados de liquidez ou quando não há dados disponíveis, dar score neutro (não penalizar)
    liquidezNormalized = 50; // Score neutro normalizado
    liquidezScore = (liquidezNormalized / 100) * 10; // 5 pontos (metade dos 10)
  }
  // Se não é banco e não tem liquidez, score permanece 0
  
  const canEvaluateLiquidezFinal = canEvaluateLiquidez || liquidezScore > 0;
  
  // Histórico de Lucro (10 pts) - lucro positivo = 10, negativo = 0
  // Sempre pode ser avaliado (é binário: positivo ou negativo)
  const historicoLucroScore = financialData.lucroLiquido !== null && financialData.lucroLiquido !== undefined && financialData.lucroLiquido > 0 ? 10 : 0;
  const canEvaluateHistoricoLucro = financialData.lucroLiquido !== null && financialData.lucroLiquido !== undefined;
  
  // P/VP controlado - usado como validação adicional (não pontuado separadamente)
  // P/VP < 1.0 é considerado bom (subvalorizada)
  // P/VP muito alto (> 2.0) pode indicar sobrevalorização
  // Este indicador é usado para validação mas não entra no cálculo de pontos
  const pvpValue = financialData.pvp ?? null;
  const pvpNormalized = pvpValue !== null && pvpValue > 0
    ? (() => {
        // Normalizar P/VP: quanto menor melhor
        // P/VP < 1.0 = excelente (100), P/VP > 2.0 = ruim (0)
        if (pvpValue < 1.0) return 100;
        if (pvpValue >= 2.0) return 0;
        // Linear entre 1.0 e 2.0
        return Math.max(0, Math.min(100, ((2.0 - pvpValue) / 1.0) * 100));
      })()
    : null;
  
  // Redistribuir pontos se algum indicador não puder ser avaliado
  const grahamScores = redistributePoints([
    { score: dividaScore, maxPoints: 15, canEvaluate: canEvaluateDividaFinal },
    { score: liquidezScore, maxPoints: 10, canEvaluate: canEvaluateLiquidezFinal },
    { score: historicoLucroScore, maxPoints: 10, canEvaluate: canEvaluateHistoricoLucro },
  ]);
  
  const finalDividaScore = grahamScores[0].score;
  const finalLiquidezScore = grahamScores[1].score;
  const finalHistoricoLucroScore = grahamScores[2].score;
  
  // Score total Graham (máximo 35 pontos)
  // Distribuição: Dívida (15) + Liquidez (10) + Histórico (10) = 35 pts
  const totalScore = finalDividaScore + finalLiquidezScore + finalHistoricoLucroScore;
  
  return {
    score: totalScore,
    breakdown: {
      divida: dividaNormalized, // Retornar valor normalizado 0-100 para exibição
      dividaValue: dividaValue, // Valor real usado (DL/PL original ou calculado)
      usingCalculatedDivida: usingCalculatedDivida, // Flag indicando se foi calculado
      canEvaluateDivida: canEvaluateDividaFinal, // Flag indicando se Dívida pode ser avaliada
      liquidez: liquidezNormalized, // Retornar valor normalizado 0-100 para exibição
      liquidezValue: liquidezValue, // Valor real usado (liquidez corrente ou caixa/ativos)
      usingCalculatedLiquidez: usingCalculatedLiquidez, // Flag indicando se foi calculada
      canEvaluateLiquidez: canEvaluateLiquidezFinal, // Flag indicando se Liquidez pode ser avaliada
      historicoLucro: finalHistoricoLucroScore, // Já está em pontos (0-10)
      canEvaluateHistoricoLucro: canEvaluateHistoricoLucro, // Flag indicando se Histórico de Lucro pode ser avaliado
      pvp: pvpNormalized ?? undefined, // Valor normalizado 0-100 para exibição (opcional)
    },
  };
}

/**
 * Redistribui pontos proporcionalmente quando alguns indicadores não podem ser avaliados
 * @param scores Array de objetos com { score, maxPoints, canEvaluate }
 * @returns Array de scores ajustados com redistribuição
 */
function redistributePoints<T extends { score: number; maxPoints: number; canEvaluate: boolean }>(
  scores: T[]
): T[] {
  const evaluableScores = scores.filter(s => s.canEvaluate);
  const nonEvaluableMaxPoints = scores
    .filter(s => !s.canEvaluate)
    .reduce((sum, s) => sum + s.maxPoints, 0);
  
  // Se não há pontos não avaliáveis ou não há scores avaliáveis, retornar como está
  if (nonEvaluableMaxPoints === 0 || evaluableScores.length === 0) {
    return scores;
  }
  
  // Calcular proporção de cada score avaliável em relação ao total avaliável
  const evaluableMaxPoints = evaluableScores.reduce((sum, s) => sum + s.maxPoints, 0);
  
  // Redistribuir pontos proporcionalmente baseado nos pontos máximos de cada indicador avaliável
  return scores.map(s => {
    if (!s.canEvaluate) {
      // Manter score como 0 para não avaliáveis
      return { ...s, score: 0 };
    }
    // Calcular proporção deste indicador em relação ao total avaliável
    const proportion = s.maxPoints / evaluableMaxPoints;
    // Redistribuir pontos não avaliáveis proporcionalmente
    const redistributedPoints = nonEvaluableMaxPoints * proportion;
    // Ajustar score proporcionalmente: se tinha X pontos de Y máximos, agora tem X pontos de (Y + redistribuídos) máximos
    // Mas mantendo a mesma proporção de desempenho
    const performanceRatio = s.maxPoints > 0 ? s.score / s.maxPoints : 0;
    const newMaxPoints = s.maxPoints + redistributedPoints;
    const newScore = performanceRatio * newMaxPoints;
    return { ...s, score: Math.min(newScore, newMaxPoints) };
  });
}

/**
 * Calcula score Bazin (20% do total)
 */
function calculateBazinScore(
  financialData: FinancialData,
  allStocks: StockData[],
  historicalAverages?: HistoricalAverages | null
): { score: number; breakdown: { dy: number; canEvaluateDY?: boolean; payout: number; canEvaluatePayout?: boolean; consistencia: number; canEvaluateConsistencia?: boolean } } {
  const sector = financialData.sector;
  const industry = financialData.industry;
  const isUtilities = isUtilitiesSector(sector);
  const isGrowth = isGrowthSector(sector, industry);
  
  // AJUSTE POR SETOR: Utilities → Mantém Bazin (sem ajuste)
  // AJUSTE POR SETOR: Growth → Penaliza DY irrelevante (DY muito baixo recebe score menor)
  
  // DY médio (10 pts) - USAR MÉDIA DE 5 ANOS (historicalAverages.dy)
  // Comparar médias históricas com médias históricas para definir posição relativa
  // Se não tiver média histórica, usar DY atual como fallback
  const dyValue = historicalAverages?.dy ?? financialData.dividendYield12m ?? null;
  const canEvaluateDY = dyValue !== null && dyValue !== undefined && dyValue >= 0;
  
  // Coletar DYs médios de 5 anos de todas as ações (ou DY atual como fallback)
  // IMPORTANTE: Comparar médias históricas com médias históricas para consistência
  const dyValues = allStocks
    .map(s => {
      // Priorizar média histórica de 5 anos, senão usar DY atual como fallback
      return s.historicalAverages?.dy ?? s.financialData.dividendYield12m ?? null;
    })
    .filter((v): v is number => v !== null && v !== undefined && v >= 0);
  
  // Normalizar usando média histórica (ou valor atual se não tiver média histórica)
  const dyNormalized = canEvaluateDY && dyValues.length > 0 && dyValue !== null
    ? normalizeWithPercentiles(dyValue, dyValues)
    : 0;
  
  // AJUSTE POR SETOR: Growth → Penaliza DY irrelevante
  // Se DY médio < 2%, reduzir score em 50%
  let dyScore = canEvaluateDY ? (dyNormalized / 100) * 10 : 0;
  if (canEvaluateDY && isGrowth && dyValue! < 0.02) {
    dyScore = dyScore * 0.5; // Penaliza 50% se DY < 2% em setor Growth
  }
  
  // Payout <80% (5 pts)
  const payoutValue = financialData.payout;
  const canEvaluatePayout = payoutValue !== null && payoutValue !== undefined;
  let payoutScore = 0;
  if (canEvaluatePayout) {
    if (payoutValue < 0.8) {
      payoutScore = 5; // Payout sustentável = score completo
    } else if (payoutValue <= 1.0) {
      // Penaliza progressivamente de 80% a 100%
      payoutScore = Math.max(0, 5 * (1 - (payoutValue - 0.8) / 0.2));
    }
    // Se payout > 100%, score = 0
  }
  
  // Consistência (5 pts) - baseado em historicoUltimosDividendos
  let consistenciaScore = 0;
  const canEvaluateConsistencia = !!(financialData.historicoUltimosDividendos || (canEvaluateDY && dyValue !== null && dyValue! > 0));
  if (financialData.historicoUltimosDividendos) {
    const dividendos = financialData.historicoUltimosDividendos
      .split(',')
      .map(d => parseFloat(d.trim()))
      .filter(d => !isNaN(d) && d > 0);
    
    if (dividendos.length >= 4) {
      consistenciaScore = 5;
    } else if (dividendos.length >= 2) {
      consistenciaScore = (dividendos.length / 4) * 5;
    }
  } else if (canEvaluateDY && dyValue! > 0) {
    // Se tem DY positivo mas não tem histórico, dá score parcial
    consistenciaScore = 2.5;
  }
  
  // Redistribuir pontos se algum indicador não puder ser avaliado
  const scoresWithRedistribution = redistributePoints([
    { score: dyScore, maxPoints: 10, canEvaluate: canEvaluateDY },
    { score: payoutScore, maxPoints: 5, canEvaluate: canEvaluatePayout },
    { score: consistenciaScore, maxPoints: 5, canEvaluate: canEvaluateConsistencia },
  ]);
  
  const finalDyScore = scoresWithRedistribution[0].score;
  const finalPayoutScore = scoresWithRedistribution[1].score;
  const finalConsistenciaScore = scoresWithRedistribution[2].score;
  
  // Score total Bazin (máximo 20 pontos)
  // REGRA: Bazin ruim → apenas perde bônus (não zera)
  // Se score total < 5 pontos, considerar como "ruim" mas não zerar completamente
  const totalScore = finalDyScore + finalPayoutScore + finalConsistenciaScore;
  const finalBazinScore = totalScore < 5 ? Math.max(0, totalScore * 0.5) : totalScore; // Reduz 50% se muito ruim, mas não zera
  
  return {
    score: finalBazinScore,
    breakdown: {
      dy: dyNormalized, // Retornar valor normalizado 0-100 para exibição
      canEvaluateDY: canEvaluateDY, // Flag indicando se DY pode ser avaliado
      payout: finalPayoutScore, // Já está em pontos (0-5)
      canEvaluatePayout: canEvaluatePayout, // Flag indicando se Payout pode ser avaliado
      consistencia: finalConsistenciaScore, // Já está em pontos (0-5)
      canEvaluateConsistencia: canEvaluateConsistencia, // Flag indicando se Consistência pode ser avaliada
    },
  };
}

/**
 * Calcula score GGB completo para uma ação
 */
export function calculateGGBScore(
  financialData: FinancialData,
  allStocks: StockData[]
): GGBScores {
  // Verificar exclusão
  if (shouldExcludeStock(financialData)) {
    return {
      greenblattScore: 0,
      grahamScore: 0,
      bazinScore: 0,
      finalScore: 0,
      breakdown: {
        roic: 0,
        earningsYield: 0,
        divida: 0,
        liquidez: 0,
        historicoLucro: 0,
        dy: 0,
        payout: 0,
        consistencia: 0,
      },
    };
  }
  
  // Calcular scores individuais
  const greenblatt = calculateGreenblattScore(financialData, allStocks, financialData.historicalAverages);
  const graham = calculateGrahamScore(financialData, allStocks);
  const bazin = calculateBazinScore(financialData, allStocks, financialData.historicalAverages);
  
  // AJUSTE POR SETOR: Bancos têm Greenblatt máximo de 25 pontos (sem Earnings Yield)
  const isBank = isBankSector(financialData.sector);
  const greenblattMax = isBank ? 25 : 45;
  
  // Normalizar cada componente para escala 0-100 ANTES de aplicar regras de controle
  let greenblattNormalized = greenblattMax > 0 ? (greenblatt.score / greenblattMax) * 100 : 0;
  let grahamNormalized = (graham.score / 35) * 100;
  let bazinNormalized = (bazin.score / 20) * 100;
  
  // Aplicar regras de controle nos scores normalizados (0-100)
  
  // REGRA DE CONTROLE 1: Prejuízo recorrente → score máximo = 40 pontos
  // Limitar score final a 40, o que significa limitar cada componente proporcionalmente
  if (hasRecurringLoss(financialData)) {
    const maxFinalScoreNormalized = 40; // Score máximo normalizado
    // Calcular score atual para verificar se precisa limitar
    const currentScore = (0.45 * greenblattNormalized) + (0.35 * grahamNormalized) + (0.20 * bazinNormalized);
    if (currentScore > maxFinalScoreNormalized) {
      // Reduzir proporcionalmente cada componente
      const reductionFactor = maxFinalScoreNormalized / currentScore;
      greenblattNormalized = greenblattNormalized * reductionFactor;
      grahamNormalized = grahamNormalized * reductionFactor;
      bazinNormalized = bazinNormalized * reductionFactor;
    }
  }
  
  // REGRA DE CONTROLE 2: Graham muito fraco → score máximo = 60 pontos
  if (isGrahamWeak(financialData)) {
    const maxFinalScoreNormalized = 60; // Score máximo normalizado
    // Calcular score atual para verificar se precisa limitar
    const currentScore = (0.45 * greenblattNormalized) + (0.35 * grahamNormalized) + (0.20 * bazinNormalized);
    if (currentScore > maxFinalScoreNormalized) {
      // Reduzir proporcionalmente cada componente
      const reductionFactor = maxFinalScoreNormalized / currentScore;
      greenblattNormalized = greenblattNormalized * reductionFactor;
      grahamNormalized = grahamNormalized * reductionFactor;
      bazinNormalized = bazinNormalized * reductionFactor;
    }
  }
  
  // REGRA DE CONTROLE 3: Bazin ruim → apenas perde bônus (não zera)
  // Esta regra já está implementada dentro de calculateBazinScore
  // Se Bazin < 5 pontos, reduz 50% mas não zera completamente
  
  // FÓRMULA DO SCORE UNIFICADO:
  // Score Final = 0.45 × Greenblatt + 0.35 × Graham + 0.20 × Bazin
  // Cada componente está normalizado de 0-100
  const finalScore = (0.45 * greenblattNormalized) + (0.35 * grahamNormalized) + (0.20 * bazinNormalized);
  
  // Converter scores de pontos para escala 0-100 para exibição
  const greenblattDisplay = greenblattNormalized;
  const grahamDisplay = grahamNormalized;
  const bazinDisplay = bazinNormalized;
  
  return {
    greenblattScore: greenblattDisplay, // Escala 0-100 para exibição
    grahamScore: grahamDisplay, // Escala 0-100 para exibição
    bazinScore: bazinDisplay, // Escala 0-100 para exibição
    finalScore: finalScore, // Score final em pontos (0-100)
    breakdown: {
      roic: greenblatt.breakdown.roic,
      roicValue: greenblatt.breakdown.roicValue,
      usingRoeAsProxy: greenblatt.breakdown.usingRoeAsProxy,
      canEvaluateROIC: greenblatt.breakdown.canEvaluateROIC,
      earningsYield: greenblatt.breakdown.earningsYield,
      canEvaluateEarningsYield: greenblatt.breakdown.canEvaluateEarningsYield,
      divida: graham.breakdown.divida,
      dividaValue: graham.breakdown.dividaValue,
      usingCalculatedDivida: graham.breakdown.usingCalculatedDivida,
      canEvaluateDivida: graham.breakdown.canEvaluateDivida,
      liquidez: graham.breakdown.liquidez,
      liquidezValue: graham.breakdown.liquidezValue,
      usingCalculatedLiquidez: graham.breakdown.usingCalculatedLiquidez,
      canEvaluateLiquidez: graham.breakdown.canEvaluateLiquidez,
      historicoLucro: graham.breakdown.historicoLucro,
      canEvaluateHistoricoLucro: graham.breakdown.canEvaluateHistoricoLucro,
      pvp: graham.breakdown.pvp, // P/VP normalizado (0-100) para exibição
      dy: bazin.breakdown.dy,
      canEvaluateDY: bazin.breakdown.canEvaluateDY,
      payout: bazin.breakdown.payout,
      canEvaluatePayout: bazin.breakdown.canEvaluatePayout,
      consistencia: bazin.breakdown.consistencia,
      canEvaluateConsistencia: bazin.breakdown.canEvaluateConsistencia,
    },
  };
}

/**
 * Calcula ranking completo para todas as ações
 */
export function calculateGGBRanking(stocks: StockData[]): Array<{
  ticker: string;
  financialData: FinancialData;
  scores: GGBScores;
  rank: number;
}> {
  // Filtrar ações excluídas (ROIC ≤ 0)
  const validStocks = stocks.filter(s => !shouldExcludeStock(s.financialData));
  
  // Preparar stocks com historicalAverages disponível
  const stocksWithHistory = validStocks.map(stock => ({
    ...stock,
    financialData: {
      ...stock.financialData,
      historicalAverages: stock.historicalAverages ?? stock.financialData.historicalAverages ?? null,
    },
  }));
  
  // Calcular scores para todas
  const stocksWithScores = stocksWithHistory.map(stock => {
    // Adicionar ticker ao financialData para rastreamento nos logs
    const financialDataWithTicker = {
      ...stock.financialData,
      ticker: stock.ticker,
    };
    
    return {
      ticker: stock.ticker,
      financialData: financialDataWithTicker,
      scores: calculateGGBScore(financialDataWithTicker, stocksWithHistory.map(s => ({
        ...s,
        financialData: {
          ...s.financialData,
          ticker: s.ticker,
        },
      }))),
      rank: 0, // Será preenchido depois
    };
  });
  
  // Ordenar por score final (maior primeiro)
  stocksWithScores.sort((a, b) => b.scores.finalScore - a.scores.finalScore);
  
  // Atribuir ranks
  stocksWithScores.forEach((stock, index) => {
    stock.rank = index + 1;
  });
  
  return stocksWithScores;
}

