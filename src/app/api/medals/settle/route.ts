import { NextRequest, NextResponse } from 'next/server';
import { medalService } from '@/lib/services/medal-service';

export const dynamic = 'force-dynamic';

const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || '';

// Rate limiting para cron (máximo 1 execução por hora)
const lastRequestTime = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 60 * 60 * 1000; // 1 hora

function validateToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === CRON_SECRET_TOKEN && CRON_SECRET_TOKEN !== '';
}

async function checkRateLimit(): Promise<boolean> {
  const now = Date.now();
  const lastTime = lastRequestTime.get('medals-settle') || 0;
  
  if (now - lastTime < MIN_REQUEST_INTERVAL) {
    return false;
  }
  
  lastRequestTime.set('medals-settle', now);
  return true;
}

/**
 * POST /api/medals/settle
 * Endpoint CRON para apurar medalhas do mês anterior
 * Executa no primeiro dia de cada mês às 00:01 UTC
 */
export async function POST(request: NextRequest) {
  try {
    // Valida token
    if (!validateToken(request)) {
      return NextResponse.json(
        { error: 'Não autorizado. Token inválido ou ausente.' },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!(await checkRateLimit())) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde 1 hora entre execuções.' },
        { status: 429 }
      );
    }

    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] Iniciando apuração de medalhas via CRON`);

    // Apura medalhas
    const result = await medalService.settleMedals();

    const durationMs = Date.now() - startTime;

    console.log(`[${new Date().toISOString()}] Apuração de medalhas concluída em ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      ...result,
      durationMs,
    });
  } catch (error) {
    console.error('Error settling medals:', error);
    return NextResponse.json(
      {
        error: 'Erro ao apurar medalhas',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

