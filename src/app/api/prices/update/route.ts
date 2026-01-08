import { NextRequest, NextResponse } from 'next/server';
import { priceService } from '@/lib/services/price-service';
import { rankingService } from '@/lib/services/ranking-service';
import { checkpointService } from '@/lib/services/checkpoint-service';

const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || '';

// Rate limiting para cron (máximo 1 request por minuto)
// Mas permite continuação imediata de checkpoints em progresso
const lastRequestTime = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 60000; // 1 minuto

function validateToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === CRON_SECRET_TOKEN && CRON_SECRET_TOKEN !== '';
}

async function checkRateLimit(hasCheckpointInProgress: boolean): Promise<boolean> {
  // Se há checkpoint em progresso, permite continuação imediata
  if (hasCheckpointInProgress) {
    return true;
  }

  const now = Date.now();
  const lastTime = lastRequestTime.get('cron') || 0;
  
  if (now - lastTime < MIN_REQUEST_INTERVAL) {
    return false;
  }
  
  lastRequestTime.set('cron', now);
  return true;
}

const MAX_EXECUTION_TIME_MS = 60000; // 60 segundos

export async function POST(request: NextRequest) {
  try {
    // Valida token
    if (!validateToken(request)) {
      return NextResponse.json(
        { error: 'Não autorizado. Token inválido ou ausente.' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    const deadline = startTime + MAX_EXECUTION_TIME_MS;

    // 1. Obter ou criar checkpoint (antes do rate limit para verificar se há checkpoint em progresso)
    let checkpoint = await checkpointService.getOrCreateCheckpoint();
    const hasCheckpointInProgress = checkpoint.status === 'in_progress' && checkpoint.processedUserIds.length > 0;

    // Rate limiting (permite continuação imediata de checkpoints em progresso)
    if (!(await checkRateLimit(hasCheckpointInProgress))) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde 1 minuto entre atualizações.' },
        { status: 429 }
      );
    }

    // 2. Se checkpoint está na fase de preços ou é novo, atualizar preços
    if (checkpoint.phase === 'prices' || !checkpoint.pricesLastUpdate) {
      const priceUpdateResult = await priceService.updatePrices();
      const pricesLastUpdate = new Date();

      if (!priceUpdateResult.success) {
        await checkpointService.failCheckpoint(checkpoint.id);
        return NextResponse.json(
          {
            success: false,
            error: 'Falha ao atualizar preços',
            errors: priceUpdateResult.errors,
          },
          { status: 500 }
        );
      }

      // Atualizar checkpoint para fase de ranking
      await checkpointService.updateCheckpoint(checkpoint.id, {
        phase: 'ranking',
        pricesLastUpdate,
      });

      // Recarregar checkpoint atualizado
      checkpoint = await checkpointService.getOrCreateCheckpoint();
    }

    // 3. Calcular rankings com checkpoint e timeout
    const rankingResult = await rankingService.calculateBothRankingsWithCheckpoint(
      checkpoint,
      deadline - Date.now()
    );

    const duration = Date.now() - startTime;

    // 4. Limpar checkpoints antigos periodicamente
    await checkpointService.cleanupOldCheckpoints();

    if (rankingResult.completed) {
      return NextResponse.json({
        success: true,
        tickersUpdated: checkpoint.pricesLastUpdate ? 'já atualizado' : 'atualizado',
        pricesLastUpdate: checkpoint.pricesLastUpdate?.toISOString() || new Date().toISOString(),
        rankingCalculated: true,
        rankingLastUpdate: new Date().toISOString(),
        usersRanked: rankingResult.monthly?.ranking.length || 0,
        monthlyRankingCount: rankingResult.monthly?.ranking.length || 0,
        annualRankingCount: rankingResult.annual?.ranking.length || 0,
        durationMs: duration,
        checkpointUsed: checkpoint.processedUserIds.length > 0,
        processedUsers: rankingResult.processedCount,
        totalUsers: rankingResult.totalCount,
      });
    } else {
      // Execução não completou dentro do timeout
      return NextResponse.json({
        success: true,
        partial: true,
        tickersUpdated: checkpoint.pricesLastUpdate ? 'já atualizado' : 'atualizado',
        pricesLastUpdate: checkpoint.pricesLastUpdate?.toISOString() || new Date().toISOString(),
        rankingCalculated: false,
        message: 'Processamento parcial. Próxima execução continuará de onde parou.',
        durationMs: duration,
        checkpointId: checkpoint.id,
        processedUsers: rankingResult.processedCount,
        totalUsers: rankingResult.totalCount,
        progress: Math.round((rankingResult.processedCount / rankingResult.totalCount) * 100),
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar preços e calcular ranking:', error);
    
    // Tentar marcar checkpoint como falho
    try {
      const checkpoint = await checkpointService.getOrCreateCheckpoint();
      await checkpointService.failCheckpoint(checkpoint.id);
    } catch (checkpointError) {
      console.error('Erro ao atualizar checkpoint:', checkpointError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

