/**
 * Serviço para buscar dados de FIIs de fontes gratuitas
 * Fonte principal: Fundamentus (fii_resultado.php)
 *
 * Critérios de inclusão no ranking:
 * - Liquidez diária >= 1.000.000
 * - Tijolo: pelo menos 5 imóveis; Papel: sem exigência de imóveis
 */

import { load } from 'cheerio';

const FUNDAMENTUS_URL = 'https://www.fundamentus.com.br/fii_resultado.php';

/** Liquidez mínima em reais (1 milhão) para FIIs de tijolo */
export const MIN_LIQUIDITY = 1_000_000;

/** Liquidez mínima para fundos de papel (menor que tijolo; muitos têm liquidez baixa no Fundamentus) */
export const MIN_LIQUIDITY_PAPEL = 100_000;

/** Mínimo de imóveis para FIIs de tijolo (diversificação). Fundos de papel não têm essa exigência. */
export const MIN_IMOVEIS_TIJOLO = 5;

/** Tickers de FIIs indisponíveis para investimento (deslistados/indisponibilizados pelas corretoras). */
export const FII_UNAVAILABLE_TICKERS = ['MALL11'];

export interface FIIData {
  ticker: string;
  fundName?: string;
  segment: string | null;
  financialData: {
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
    /** Indica se é fundo de papel (títulos/val. mob.) – critérios de diversificação são diferentes */
    isPapel?: boolean;
  };
}

/** Segmentos considerados "fundo de papel" (sem exigência de 5+ imóveis) */
const PAPEL_SEGMENT_PATTERNS = [
  'títulos e val. mob.',
  'titulos e val. mob.',
  'papéis',
  'papeis',
  'papel',
  'crédito imobiliário',
  'credito imobiliario',
];

function isPapelSegment(segment: string | null): boolean {
  if (!segment || !segment.trim()) return false;
  const normalized = segment.trim().toLowerCase();
  return PAPEL_SEGMENT_PATTERNS.some((p) => normalized.includes(p));
}

import { formatSegmentDisplay } from '@/lib/utils/fii-segment-display';

export { formatSegmentDisplay };

/**
 * Converte número brasileiro para float (8,08 -> 8.08, 12,97% -> 12.97)
 */
function parseBrNumber(value: string): number | null {
  if (!value || value.trim() === '-') return null;
  const cleaned = value
    .trim()
    .replace(/\./g, '')
    .replace(',', '.')
    .replace('%', '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Busca dados de FIIs do Fundamentus
 */
export async function fetchFIIsFromFundamentus(): Promise<FIIData[]> {
  const response = await fetch(FUNDAMENTUS_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Fundamentus retornou status ${response.status}`);
  }

  // Fundamentus pode enviar em ISO-8859-1; usar latin1 para evitar "?" no lugar de acentos
  const buffer = await response.arrayBuffer();
  const html = new TextDecoder('iso-8859-1').decode(buffer);
  const $ = load(html);

  const results: FIIData[] = [];
  const rows = $('table tbody tr');

  rows.each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 13) return;

    const tickerCell = $(cells[0]).find('a').first();
    const ticker = tickerCell.text().trim();
    if (!ticker || ticker.length < 4) return;

    const segment = $(cells[1]).text().trim() || null;
    const cotacao = parseBrNumber($(cells[2]).text());
    const ffoYield = parseBrNumber($(cells[3]).text());
    const dividendYield = parseBrNumber($(cells[4]).text());
    const pvp = parseBrNumber($(cells[5]).text());
    const valorMercado = parseBrNumber($(cells[6]).text());
    const liquidez = parseBrNumber($(cells[7]).text());
    const qtdImoveis = parseBrNumber($(cells[8]).text());
    const precoM2 = parseBrNumber($(cells[9]).text());
    const aluguelM2 = parseBrNumber($(cells[10]).text());
    const capRate = parseBrNumber($(cells[11]).text());
    const vacanciaMedia = parseBrNumber($(cells[12]).text());

    const isPapel = isPapelSegment(segment);
    const segmentDisplay = formatSegmentDisplay(segment);

    results.push({
      ticker,
      segment: segmentDisplay,
      financialData: {
        cotacao,
        ffoYield: ffoYield != null ? ffoYield / 100 : null,
        dividendYield: dividendYield != null ? dividendYield / 100 : null,
        pvp,
        valorMercado,
        liquidez,
        qtdImoveis,
        precoM2,
        aluguelM2,
        capRate: capRate != null ? capRate / 100 : null,
        vacanciaMedia: vacanciaMedia != null ? vacanciaMedia / 100 : null,
        payout: null,
        isPapel,
      },
    });
  });

  return results;
}

/**
 * Filtra FIIs pelos critérios do ranking:
 * - Exclui tickers indisponíveis (blocklist) e cotação zero (ativo deslistado/indisponível)
 * - Tijolo: liquidez >= 1M e pelo menos 5 imóveis
 * - Papel: liquidez >= 100k (sem exigência de imóveis)
 */
export function filterFIIsForRanking(fiis: FIIData[]): FIIData[] {
  return fiis.filter((fii) => {
    const ticker = fii.ticker?.toUpperCase?.() ?? fii.ticker;
    if (FII_UNAVAILABLE_TICKERS.includes(ticker)) return false;
    const cotacao = fii.financialData.cotacao;
    if (cotacao !== null && cotacao !== undefined && cotacao <= 0) return false;

    const liq = fii.financialData.liquidez ?? 0;
    const isPapel = fii.financialData.isPapel === true;

    if (isPapel) {
      return liq >= MIN_LIQUIDITY_PAPEL;
    }
    if (liq < MIN_LIQUIDITY) return false;
    const imoveis = fii.financialData.qtdImoveis ?? 0;
    return imoveis >= MIN_IMOVEIS_TIJOLO;
  });
}

/**
 * Busca dados de FIIs - usa Fundamentus como fonte principal.
 * Já aplica filtro: liquidez >= 1M e (papel ou >= 5 imóveis).
 */
export async function fetchAllFIIs(): Promise<FIIData[]> {
  try {
    const data = await fetchFIIsFromFundamentus();
    console.log(`[FII Data Service] Fundamentus: ${data.length} FIIs obtidos`);
    const filtered = filterFIIsForRanking(data);
    console.log(`[FII Data Service] Após filtro (liquidez >= 1M, diversificação): ${filtered.length} FIIs`);
    return filtered;
  } catch (error) {
    console.error('[FII Data Service] Erro ao buscar do Fundamentus:', error);
    throw error;
  }
}
