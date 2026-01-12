import { prisma } from '@/lib/prisma/client';
import type { RankingEntryForStorage } from './ranking-service';
import { getUTCPreviousPeriod, isUTCJanuary, getUTCPreviousYear } from '@/lib/utils/utc-utils';

export interface MedalSummary {
  monthly: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  annual: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  total: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
}

export interface MedalTimelineEntry {
  id: string;
  period: 'mensal' | 'anual';
  year: number;
  month: number | null;
  position: number;
  medalType: 'gold' | 'silver' | 'bronze';
  calculatedAt: Date;
}

/**
 * Serviço para gerenciar medalhas dos usuários
 * Medalhas são baseadas em posições nos rankings mensais e anuais
 */
export class MedalService {
  /**
   * Calcula medalhas para um usuário baseado em rankings históricos
   * Verifica todos os RankingCalculation e cria/atualiza UserMedal
   */
  async calculateMedalsForUser(userId: string): Promise<void> {
    // Busca todos os rankings históricos
    const rankings = await prisma.rankingCalculation.findMany({
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
        { calculatedAt: 'asc' },
      ],
    });

    for (const ranking of rankings) {
      const rankingData = ranking.rankingData as unknown as RankingEntryForStorage[];
      
      // Encontra posição do usuário no ranking
      const userEntry = rankingData.find(entry => entry.userId === userId);
      
      if (!userEntry || userEntry.rank > 3) {
        // Usuário não está no top 3, não recebe medalha
        continue;
      }

      const medalType = userEntry.rank === 1 ? 'gold' : userEntry.rank === 2 ? 'silver' : 'bronze';
      
      // Verifica se medalha já existe
      const existingMedal = await prisma.userMedal.findFirst({
        where: {
          userId,
          period: ranking.period as 'mensal' | 'anual',
          year: ranking.year,
          month: ranking.month || null,
        },
      });

      if (existingMedal) {
        // Atualiza medalha existente se posição mudou
        if (existingMedal.position !== userEntry.rank) {
          await prisma.userMedal.update({
            where: { id: existingMedal.id },
            data: {
              position: userEntry.rank,
              medalType,
              calculatedAt: ranking.calculatedAt,
            },
          });
        }
      } else {
        // Cria nova medalha
        await prisma.userMedal.create({
          data: {
            userId,
            period: ranking.period as 'mensal' | 'anual',
            year: ranking.year,
            month: ranking.month || null,
            position: userEntry.rank,
            medalType,
            calculatedAt: ranking.calculatedAt,
          },
        });
        
        // Atualizar slug do usuário após criar medalha
        try {
          const { updateUserSlug } = await import('@/lib/utils/user-slug-generator');
          await updateUserSlug(userId);
        } catch (error) {
          console.error('Error updating user slug after medal creation:', error);
        }
      }
    }
  }

  /**
   * Obtém resumo de medalhas do usuário agrupadas por tipo e período
   */
  async getUserMedals(userId: string): Promise<MedalSummary> {
    const medals = await prisma.userMedal.findMany({
      where: { userId },
    });

    const summary: MedalSummary = {
      monthly: { gold: 0, silver: 0, bronze: 0, total: 0 },
      annual: { gold: 0, silver: 0, bronze: 0, total: 0 },
      total: { gold: 0, silver: 0, bronze: 0, total: 0 },
    };

    for (const medal of medals) {
      const periodKey = medal.period === 'mensal' ? 'monthly' : 'annual';
      
      if (medal.medalType === 'gold') {
        summary[periodKey].gold++;
        summary.total.gold++;
      } else if (medal.medalType === 'silver') {
        summary[periodKey].silver++;
        summary.total.silver++;
      } else if (medal.medalType === 'bronze') {
        summary[periodKey].bronze++;
        summary.total.bronze++;
      }
      
      summary[periodKey].total++;
      summary.total.total++;
    }

    return summary;
  }

  /**
   * Obtém timeline completa de medalhas do usuário
   */
  async getMedalTimeline(userId: string): Promise<MedalTimelineEntry[]> {
    const medals = await prisma.userMedal.findMany({
      where: { userId },
      orderBy: [
        { calculatedAt: 'desc' },
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    return medals.map(medal => ({
      id: medal.id,
      period: medal.period as 'mensal' | 'anual',
      year: medal.year,
      month: medal.month,
      position: medal.position,
      medalType: medal.medalType as 'gold' | 'silver' | 'bronze',
      calculatedAt: medal.calculatedAt,
    }));
  }

  /**
   * Calcula medalhas para todos os rankings históricos
   * Útil para popular medalhas de rankings já calculados
   */
  async calculateAllHistoricalMedals(): Promise<{
    usersProcessed: number;
    medalsCreated: number;
  }> {
    // Busca todos os usuários únicos que aparecem em rankings
    const rankings = await prisma.rankingCalculation.findMany({
      select: { rankingData: true },
    });

    const userIds = new Set<string>();
    
    for (const ranking of rankings) {
      const rankingData = ranking.rankingData as unknown as RankingEntryForStorage[];
      rankingData.forEach(entry => {
        if (entry.rank <= 3) {
          userIds.add(entry.userId);
        }
      });
    }

    let medalsCreated = 0;

    for (const userId of userIds) {
      await this.calculateMedalsForUser(userId);
      const userMedals = await prisma.userMedal.count({
        where: { userId },
      });
      medalsCreated += userMedals;
    }

    return {
      usersProcessed: userIds.size,
      medalsCreated,
    };
  }

  /**
   * Apura medalhas para um período específico
   * Verifica se já foi apurado, busca último ranking e cria medalhas para top 3
   */
  async settleMedalsForPeriod(
    period: 'mensal' | 'anual',
    year: number,
    month: number | null
  ): Promise<{
    settled: boolean;
    medalsCreated: number;
  }> {
    // Verifica se já foi apurado
    const existingSettlement = month !== null
      ? await prisma.medalSettlement.findUnique({
          where: {
            period_year_month: {
              period,
              year,
              month,
            },
          },
        })
      : await prisma.medalSettlement.findFirst({
          where: {
            period,
            year,
            month: null,
          },
        });

    if (existingSettlement) {
      console.log(`Período ${period} ${year}${month ? `/${month}` : ''} já foi apurado anteriormente`);
      return { settled: false, medalsCreated: 0 };
    }

    // Busca último ranking do período
    const lastRanking = await prisma.rankingCalculation.findFirst({
      where: {
        period,
        year,
        month: period === 'mensal' ? month : null,
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    if (!lastRanking) {
      console.log(`Nenhum ranking encontrado para período ${period} ${year}${month ? `/${month}` : ''}`);
      return { settled: false, medalsCreated: 0 };
    }

    const rankingData = lastRanking.rankingData as unknown as RankingEntryForStorage[];
    
    // Processa top 3
    let medalsCreated = 0;
    const top3 = rankingData.filter(entry => entry.rank <= 3).sort((a, b) => a.rank - b.rank);

    for (const userEntry of top3) {
      const medalType = userEntry.rank === 1 ? 'gold' : userEntry.rank === 2 ? 'silver' : 'bronze';
      
      // Verifica se medalha já existe
      const existingMedal = await prisma.userMedal.findFirst({
        where: {
          userId: userEntry.userId,
          period,
          year,
          month,
        },
      });

      if (existingMedal) {
        // Atualiza medalha existente se posição mudou
        if (existingMedal.position !== userEntry.rank) {
          await prisma.userMedal.update({
            where: { id: existingMedal.id },
            data: {
              position: userEntry.rank,
              medalType,
              calculatedAt: lastRanking.calculatedAt,
            },
          });
          medalsCreated++;
        }
      } else {
        // Cria nova medalha
        await prisma.userMedal.create({
          data: {
            userId: userEntry.userId,
            period,
            year,
            month,
            position: userEntry.rank,
            medalType,
            calculatedAt: lastRanking.calculatedAt,
          },
        });
        medalsCreated++;
        
        // Atualizar slug do usuário após criar medalha
        try {
          const { updateUserSlug } = await import('@/lib/utils/user-slug-generator');
          await updateUserSlug(userEntry.userId);
        } catch (error) {
          console.error('Error updating user slug after medal settlement:', error);
        }
      }
    }

    // Marca como apurado
    await prisma.medalSettlement.create({
      data: {
        period,
        year,
        month,
      },
    });

    console.log(`Período ${period} ${year}${month ? `/${month}` : ''} apurado com sucesso. ${medalsCreated} medalhas criadas/atualizadas.`);

    return { settled: true, medalsCreated };
  }

  /**
   * Encontra períodos que ainda não foram apurados
   * Retorna lista de períodos únicos que têm rankings mas não têm MedalSettlement
   */
  async findUnsettledPeriods(): Promise<Array<{ period: 'mensal' | 'anual'; year: number; month: number | null }>> {
    // Busca todos os rankings únicos
    const rankings = await prisma.rankingCalculation.findMany({
      select: {
        period: true,
        year: true,
        month: true,
      },
      distinct: ['period', 'year', 'month'],
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
      ],
    });

    // Busca todos os settlements
    const settlements = await prisma.medalSettlement.findMany({
      select: {
        period: true,
        year: true,
        month: true,
      },
    });

    // Cria Set de settlements para busca rápida
    const settlementSet = new Set(
      settlements.map(s => `${s.period}-${s.year}-${s.month ?? 'null'}`)
    );

    // Filtra períodos que não têm settlement
    const unsettled = rankings
      .filter(r => {
        const key = `${r.period}-${r.year}-${r.month ?? 'null'}`;
        return !settlementSet.has(key);
      })
      .map(r => ({
        period: r.period as 'mensal' | 'anual',
        year: r.year,
        month: r.month,
      }));

    return unsettled;
  }

  /**
   * Método principal chamado pelo CRON
   * Apura medalhas do mês anterior e processa períodos pendentes
   */
  async settleMedals(): Promise<{
    periodsSettled: number;
    medalsCreated: number;
    monthlySettled: { year: number; month: number } | null;
    annualSettled: { year: number } | null;
    catchUpProcessed: number;
  }> {
    const startTime = Date.now();
    let periodsSettled = 0;
    let totalMedalsCreated = 0;
    let monthlySettled: { year: number; month: number } | null = null;
    let annualSettled: { year: number } | null = null;

    // Determina período anterior em UTC
    const previousPeriod = getUTCPreviousPeriod();
    const isJanuary = isUTCJanuary();

    console.log(`[UTC] Iniciando apuração de medalhas. Período anterior: ${previousPeriod.year}/${previousPeriod.month}`);

    // Apura ranking mensal do mês anterior
    const monthlyResult = await this.settleMedalsForPeriod(
      'mensal',
      previousPeriod.year,
      previousPeriod.month
    );

    if (monthlyResult.settled) {
      periodsSettled++;
      totalMedalsCreated += monthlyResult.medalsCreated;
      monthlySettled = {
        year: previousPeriod.year,
        month: previousPeriod.month,
      };
    }

    // Se é Janeiro em UTC, também apura ranking anual do ano anterior
    if (isJanuary) {
      const previousYear = getUTCPreviousYear();
      console.log(`[UTC] Janeiro detectado. Apurando ranking anual de ${previousYear}`);
      
      const annualResult = await this.settleMedalsForPeriod(
        'anual',
        previousYear,
        null
      );

      if (annualResult.settled) {
        periodsSettled++;
        totalMedalsCreated += annualResult.medalsCreated;
        annualSettled = { year: previousYear };
      }
    }

    // Processa períodos pendentes (catch-up)
    const unsettledPeriods = await this.findUnsettledPeriods();
    let catchUpProcessed = 0;

    console.log(`Encontrados ${unsettledPeriods.length} períodos pendentes para processar`);

    for (const period of unsettledPeriods) {
      const result = await this.settleMedalsForPeriod(
        period.period,
        period.year,
        period.month
      );

      if (result.settled) {
        catchUpProcessed++;
        periodsSettled++;
        totalMedalsCreated += result.medalsCreated;
      }
    }

    const durationMs = Date.now() - startTime;

    console.log(`Apuração concluída em ${durationMs}ms. ${periodsSettled} períodos apurados, ${totalMedalsCreated} medalhas criadas/atualizadas.`);

    return {
      periodsSettled,
      medalsCreated: totalMedalsCreated,
      monthlySettled,
      annualSettled,
      catchUpProcessed,
    };
  }
}

export const medalService = new MedalService();

