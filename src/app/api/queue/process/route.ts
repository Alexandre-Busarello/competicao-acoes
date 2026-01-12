import { NextRequest, NextResponse } from 'next/server';
import { queueService } from '@/lib/queue/queue-service';
import { executeActionHandler } from '@/lib/queue/action-handlers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/queue/process
 * Processa ações pendentes da fila (cron job)
 * Protegido por CRON_SECRET_TOKEN
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica token de autenticação do cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET_TOKEN;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { limit = 100 } = await request.json().catch(() => ({}));

    // Busca ações pendentes
    const actions = await queueService.dequeue(limit);

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Processa cada ação
    for (const action of actions) {
      try {
        await executeActionHandler(action.actionType, action.payload);
        await queueService.markCompleted(action.id);
        processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await queueService.markFailed(action.id, errorMessage);
        failed++;
        errors.push(`${action.id}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: actions.length,
      errors: errors.slice(0, 10), // Limita erros retornados
    });
  } catch (error) {
    console.error('Error processing queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/queue/stats
 * Retorna estatísticas da fila
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await queueService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



