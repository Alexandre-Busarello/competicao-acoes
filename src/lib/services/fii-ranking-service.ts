/**
 * Serviço para calcular scores do Ranking FII
 * Metodologia: DY (30%) + P/VP (20%) + Vacância (15%) + Cap Rate (15%) + FFO Yield (10%) + Liquidez (5%) + Diversificação (5%)
 * Para FIIs de papel: diversificação não entra (0%); os 95% restantes são escalados proporcionalmente para somar 100%.
 */

import type { FIIData } from './fii-data-service';

/** Pesos tijolo: total 100% */
const WEIGHTS_TIJOLO = { dy: 30, pvp: 20, vacancy: 15, capRate: 15, ffoYield: 10, liquidity: 5, diversification: 5 };
/** Papel: sem diversificação; 95% redistribuído (×100/95) para somar 100% */
const SCALE_PAPEL = 100 / 95;
const WEIGHTS_PAPEL = {
  dy: 30 * SCALE_PAPEL,
  pvp: 20 * SCALE_PAPEL,
  vacancy: 15 * SCALE_PAPEL,
  capRate: 15 * SCALE_PAPEL,
  ffoYield: 10 * SCALE_PAPEL,
  liquidity: 5 * SCALE_PAPEL,
  diversification: 0,
};

interface FIIFinancialData {
  cotacao?: number | null;
  ffoYield?: number | null;
  dividendYield?: number | null;
  pvp?: number | null;
  valorMercado?: number | null;
  liquidez?: number | null;
  qtdImoveis?: number | null;
  precoM2?: number | null;
  aluguelM2?: number | null;
  capRate?: number | null;
  vacanciaMedia?: number | null;
  payout?: number | null;
  isPapel?: boolean;
}

interface FIIRankingScores {
  dyScore: number;
  pvpScore: number;
  vacancyScore: number;
  debtScore: number;
  payoutScore: number;
  liquidityScore: number;
  finalScore: number;
  breakdown: {
    dy: number;
    dyValue?: number | null;
    pvp: number;
    pvpValue?: number | null;
    vacancy: number;
    vacancyValue?: number | null;
    capRate: number;
    capRateValue?: number | null;
    ffoYield: number;
    ffoYieldValue?: number | null;
    liquidity: number;
    liquidityValue?: number | null;
    diversification: number;
    diversificationValue?: number | null;
  };
}

/**
 * Normaliza valor para escala 0-100 baseado em min/max
 */
function normalizeScore(
  value: number,
  min: number,
  max: number,
  invert: boolean = false
): number {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  const clamped = Math.max(0, Math.min(100, normalized));
  return invert ? 100 - clamped : clamped;
}

/** Resultado de um critério: normalizado 0-100 e valor bruto */
function result(normalized100: number, value: number | null): { normalized100: number; value: number | null } {
  return { normalized100, value };
}

/**
 * Calcula score DY - maior é melhor (normalizado 0-100)
 */
function calculateDY(
  dy: number | null,
  allValues: (number | null)[]
): { normalized100: number; value: number | null } {
  if (dy === null || dy === undefined || dy < 0) return result(0, null);
  const validValues = allValues.filter(
    (v): v is number => v !== null && v !== undefined && v >= 0
  );
  if (validValues.length === 0) return result(0, dy);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  return result(normalizeScore(dy, min, max, false), dy);
}

/**
 * Calcula score P/VP - menor é melhor (normalizado 0-100)
 */
function calculatePVP(
  pvp: number | null,
  allValues: (number | null)[]
): { normalized100: number; value: number | null } {
  if (pvp === null || pvp === undefined || pvp <= 0) return result(0, null);
  const validValues = allValues.filter(
    (v): v is number => v !== null && v !== undefined && v > 0
  );
  if (validValues.length === 0) return result(0, pvp);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  return result(normalizeScore(pvp, min, max, true), pvp);
}

/**
 * Calcula score Vacância - menor é melhor (normalizado 0-100)
 */
function calculateVacancy(
  vacancy: number | null,
  allValues: (number | null)[]
): { normalized100: number; value: number | null } {
  if (vacancy === null || vacancy === undefined || vacancy < 0) return result(0, null);
  const validValues = allValues.filter(
    (v): v is number => v !== null && v !== undefined && v >= 0
  );
  if (validValues.length === 0) return result(0, vacancy);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  return result(normalizeScore(vacancy, min, max, true), vacancy);
}

/**
 * Calcula score Cap Rate - maior é melhor (normalizado 0-100)
 */
function calculateCapRate(
  capRate: number | null,
  allValues: (number | null)[]
): { normalized100: number; value: number | null } {
  if (capRate === null || capRate === undefined || capRate < 0) return result(0, null);
  const validValues = allValues.filter(
    (v): v is number => v !== null && v !== undefined && v >= 0
  );
  if (validValues.length === 0) return result(0, capRate);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  return result(normalizeScore(capRate, min, max, false), capRate);
}

/**
 * Calcula score FFO Yield - maior é melhor (normalizado 0-100)
 */
function calculateFFOYield(
  ffoYield: number | null,
  allValues: (number | null)[]
): { normalized100: number; value: number | null } {
  if (ffoYield === null || ffoYield === undefined || ffoYield < 0) return result(0, null);
  const validValues = allValues.filter(
    (v): v is number => v !== null && v !== undefined && v >= 0
  );
  if (validValues.length === 0) return result(0, ffoYield);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  return result(normalizeScore(ffoYield, min, max, false), ffoYield);
}

/**
 * Calcula score Liquidez - maior é melhor (normalizado 0-100)
 */
function calculateLiquidity(
  liquidez: number | null,
  allValues: (number | null)[]
): { normalized100: number; value: number | null } {
  if (liquidez === null || liquidez === undefined || liquidez < 0) return result(0, null);
  const validValues = allValues.filter(
    (v): v is number => v !== null && v !== undefined && v >= 0
  );
  if (validValues.length === 0) return result(0, liquidez);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  return result(normalizeScore(liquidez, min, max, false), liquidez);
}

/**
 * Calcula score Diversificação - mais imóveis = mais diversificado (normalizado 0-100). Papel não usa.
 */
function calculateDiversification(
  qtdImoveis: number | null,
  allValues: (number | null)[]
): { normalized100: number; value: number | null } {
  if (qtdImoveis === null || qtdImoveis === undefined || qtdImoveis < 0) return result(0, null);
  const validValues = allValues.filter(
    (v): v is number => v !== null && v !== undefined && v >= 0
  );
  if (validValues.length === 0) return result(0, qtdImoveis);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  return result(normalizeScore(qtdImoveis, min, max, false), qtdImoveis);
}

/**
 * Calcula score completo para um FII. Papel: diversificação 0%, demais pesos escalados (×100/95).
 */
export function calculateFIIScore(
  fii: FIIData,
  allFIIs: FIIData[]
): FIIRankingScores {
  const fd = fii.financialData as FIIFinancialData;
  const isPapel = fd.isPapel === true;
  const w = isPapel ? WEIGHTS_PAPEL : WEIGHTS_TIJOLO;

  const dyR = calculateDY(
    fd.dividendYield ?? null,
    allFIIs.map((f) => (f.financialData as FIIFinancialData).dividendYield)
  );
  const pvpR = calculatePVP(
    fd.pvp ?? null,
    allFIIs.map((f) => (f.financialData as FIIFinancialData).pvp)
  );
  const vacancyR = calculateVacancy(
    fd.vacanciaMedia ?? null,
    allFIIs.map((f) => (f.financialData as FIIFinancialData).vacanciaMedia)
  );
  const capRateR = calculateCapRate(
    fd.capRate ?? null,
    allFIIs.map((f) => (f.financialData as FIIFinancialData).capRate)
  );
  const ffoR = calculateFFOYield(
    fd.ffoYield ?? null,
    allFIIs.map((f) => (f.financialData as FIIFinancialData).ffoYield)
  );
  const liquidityR = calculateLiquidity(
    fd.liquidez ?? null,
    allFIIs.map((f) => (f.financialData as FIIFinancialData).liquidez)
  );
  const diversificationR = calculateDiversification(
    fd.qtdImoveis ?? null,
    allFIIs.map((f) => (f.financialData as FIIFinancialData).qtdImoveis)
  );

  const dyScore = (dyR.normalized100 / 100) * w.dy;
  const pvpScore = (pvpR.normalized100 / 100) * w.pvp;
  const vacancyScore = (vacancyR.normalized100 / 100) * w.vacancy;
  const capRateScore = (capRateR.normalized100 / 100) * w.capRate;
  const ffoScore = (ffoR.normalized100 / 100) * w.ffoYield;
  const liquidityScore = (liquidityR.normalized100 / 100) * w.liquidity;
  const diversificationScore = (diversificationR.normalized100 / 100) * w.diversification;

  const totalScore =
    dyScore +
    pvpScore +
    vacancyScore +
    capRateScore +
    ffoScore +
    liquidityScore +
    diversificationScore;

  return {
    dyScore,
    pvpScore,
    vacancyScore,
    debtScore: capRateScore,
    payoutScore: ffoScore,
    liquidityScore,
    finalScore: Math.round(totalScore * 100) / 100,
    breakdown: {
      dy: dyScore,
      dyValue: dyR.value,
      pvp: pvpScore,
      pvpValue: pvpR.value,
      vacancy: vacancyScore,
      vacancyValue: vacancyR.value,
      capRate: capRateScore,
      capRateValue: capRateR.value,
      ffoYield: ffoScore,
      ffoYieldValue: ffoR.value,
      liquidity: liquidityScore,
      liquidityValue: liquidityR.value,
      diversification: diversificationScore,
      diversificationValue: diversificationR.value,
    },
  };
}

/**
 * Calcula ranking completo para todos os FIIs
 */
export function calculateFIIRanking(
  fiis: FIIData[]
): Array<{
  ticker: string;
  fundName?: string;
  segment: string | null;
  financialData: FIIFinancialData;
  scores: FIIRankingScores;
  rank: number;
}> {
  const withScores = fiis.map((fii) => ({
    ticker: fii.ticker,
    fundName: fii.fundName,
    segment: fii.segment,
    financialData: fii.financialData as FIIFinancialData,
    scores: calculateFIIScore(fii, fiis),
    rank: 0,
  }));

  withScores.sort((a, b) => b.scores.finalScore - a.scores.finalScore);

  withScores.forEach((item, index) => {
    item.rank = index + 1;
  });

  return withScores;
}
