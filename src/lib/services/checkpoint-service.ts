import { prisma } from '@/lib/prisma/client';
import type { RankingEntryForStorage } from './ranking-service';

export interface CheckpointData {
  id: string;
  status: 'in_progress' | 'completed' | 'failed';
  phase: 'prices' | 'ranking';
  processedUserIds: string[];
  monthlyRankings?: RankingEntryForStorage[];
  annualRankings?: RankingEntryForStorage[];
  pricesLastUpdate?: Date;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class CheckpointService {
  /**
   * Cria ou obtém checkpoint em progresso
   */
  async getOrCreateCheckpoint(): Promise<CheckpointData> {
    // Busca checkpoint em progresso mais recente
    const existing = await prisma.priceUpdateCheckpoint.findFirst({
      where: {
        status: 'in_progress',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (existing) {
      return {
        id: existing.id,
        status: existing.status as 'in_progress' | 'completed' | 'failed',
        phase: existing.phase as 'prices' | 'ranking',
        processedUserIds: existing.processedUserIds,
        monthlyRankings: existing.monthlyRankings ? (existing.monthlyRankings as unknown as RankingEntryForStorage[]) : undefined,
        annualRankings: existing.annualRankings ? (existing.annualRankings as unknown as RankingEntryForStorage[]) : undefined,
        pricesLastUpdate: existing.pricesLastUpdate || undefined,
        startedAt: existing.startedAt,
        updatedAt: existing.updatedAt,
        completedAt: existing.completedAt || undefined,
      };
    }

    // Cria novo checkpoint
    const checkpoint = await prisma.priceUpdateCheckpoint.create({
      data: {
        status: 'in_progress',
        phase: 'prices',
        processedUserIds: [],
      },
    });

    return {
      id: checkpoint.id,
      status: 'in_progress',
      phase: 'prices',
      processedUserIds: [],
      startedAt: checkpoint.startedAt,
      updatedAt: checkpoint.updatedAt,
    };
  }

  /**
   * Atualiza checkpoint com progresso parcial
   */
  async updateCheckpoint(
    checkpointId: string,
    data: {
      phase?: 'prices' | 'ranking';
      processedUserIds?: string[];
      monthlyRankings?: RankingEntryForStorage[];
      annualRankings?: RankingEntryForStorage[];
      pricesLastUpdate?: Date;
    }
  ): Promise<void> {
    await prisma.priceUpdateCheckpoint.update({
      where: { id: checkpointId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Marca checkpoint como completo
   */
  async completeCheckpoint(checkpointId: string): Promise<void> {
    await prisma.priceUpdateCheckpoint.update({
      where: { id: checkpointId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Marca checkpoint como falho
   */
  async failCheckpoint(checkpointId: string): Promise<void> {
    await prisma.priceUpdateCheckpoint.update({
      where: { id: checkpointId },
      data: {
        status: 'failed',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Limpa checkpoints antigos (mantém apenas os últimos 10)
   */
  async cleanupOldCheckpoints(): Promise<void> {
    const oldCheckpoints = await prisma.priceUpdateCheckpoint.findMany({
      orderBy: { updatedAt: 'desc' },
      skip: 10,
    });

    if (oldCheckpoints.length > 0) {
      await prisma.priceUpdateCheckpoint.deleteMany({
        where: {
          id: {
            in: oldCheckpoints.map(c => c.id),
          },
        },
      });
    }
  }
}

export const checkpointService = new CheckpointService();

