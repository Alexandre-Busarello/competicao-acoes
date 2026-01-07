import { NextRequest, NextResponse } from 'next/server';
import { priceService } from '@/lib/services/price-service';

// Rate limiting simples (em memória)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // 10 requests
const RATE_LIMIT_WINDOW = 60000; // 1 minuto

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          valid: false,
          ticker: '',
          error: 'Muitas requisições. Tente novamente em alguns instantes.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { ticker } = body;

    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json(
        {
          valid: false,
          ticker: '',
          error: 'Ticker é obrigatório e deve ser uma string',
        },
        { status: 400 }
      );
    }

    // Valida formato básico
    const tickerPattern = /^[A-Z0-9.]{1,20}$/i;
    if (!tickerPattern.test(ticker.trim())) {
      return NextResponse.json(
        {
          valid: false,
          ticker: ticker.trim(),
          error: 'Formato de ticker inválido',
        },
        { status: 400 }
      );
    }

    // Valida ticker via Yahoo Finance
    const result = await priceService.validateAndAddTicker(ticker.trim());

    if (!result.valid) {
      // Tratar erros específicos do Yahoo Finance
      let errorMessage = result.error || 'Ticker não encontrado';
      
      if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
        errorMessage = 'Muitas requisições ao Yahoo Finance. Aguarde alguns instantes.';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit')) {
        errorMessage = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
      }

      return NextResponse.json(
        {
          valid: false,
          ticker: result.ticker,
          error: errorMessage,
        },
        { status: 200 } // 200 porque é uma resposta válida (ticker inválido)
      );
    }

    return NextResponse.json({
      valid: true,
      ticker: result.ticker,
      name: result.name,
      price: result.price,
    });
  } catch (error) {
    console.error('Erro ao validar ticker:', error);
    
    let errorMessage = 'Erro interno do servidor';
    if (error instanceof Error) {
      if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
        errorMessage = 'Muitas requisições. Aguarde alguns instantes.';
      }
    }

    return NextResponse.json(
      {
        valid: false,
        ticker: '',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

