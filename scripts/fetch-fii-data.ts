#!/usr/bin/env npx tsx
/**
 * Script para buscar dados de FIIs e popular o banco
 * Pode ser executado manualmente ou via cron
 *
 * Uso: npx tsx scripts/fetch-fii-data.ts
 * Ou: yarn fetch-fii-data
 *
 * Usa DIRECT_DATABASE_URL (mesma variável do prisma schema) para evitar
 * falha de autenticação quando DATABASE_URL for diferente (ex.: pooler).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { fetchAllFIIs } from '../src/lib/services/fii-data-service';
import { calculateFIIRanking } from '../src/lib/services/fii-ranking-service';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_DATABASE_URL },
  },
});

async function main() {
  console.log('[Fetch FII] Iniciando coleta de dados...');

  try {
    const apiData = await fetchAllFIIs();
    console.log(`[Fetch FII] ${apiData.length} FIIs obtidos do Fundamentus`);

    if (apiData.length === 0) {
      console.warn('[Fetch FII] Nenhum dado retornado. Abortando.');
      process.exit(1);
    }

    const rankingResults = calculateFIIRanking(apiData);

    const dataToInsert = rankingResults.map((result) => ({
      ticker: result.ticker,
      fundName: result.fundName ?? null,
      segment: result.segment,
      financialData: {
        ...result.financialData,
        breakdown: result.scores.breakdown,
      } as object,
      dyScore: result.scores.dyScore,
      pvpScore: result.scores.pvpScore,
      vacancyScore: result.scores.vacancyScore,
      debtScore: result.scores.debtScore,
      payoutScore: result.scores.payoutScore,
      liquidityScore: result.scores.liquidityScore,
      finalScore: result.scores.finalScore,
      rank: result.rank,
      dataSource: 'fundamentus',
    }));

    if (!('fIIRanking' in prisma)) {
      throw new Error(
        'Prisma client sem modelo FIIRanking. Rode: npx prisma generate'
      );
    }

    await prisma.fIIRanking.deleteMany({});
    await prisma.fIIRanking.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    console.log(`[Fetch FII] ${dataToInsert.length} FIIs salvos no banco com sucesso`);
    console.log('[Fetch FII] Top 5:', rankingResults.slice(0, 5).map((r) => `${r.rank}. ${r.ticker} (${r.scores.finalScore.toFixed(1)})`).join(', '));
  } catch (error) {
    console.error('[Fetch FII] Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
