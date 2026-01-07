import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/lib/services/yahoo-finance-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ticker, type, quantity, date } = body;

    // Validações básicas
    if (!userId || !ticker || !type || !quantity || !date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, ticker, type, quantity, date' },
        { status: 400 }
      );
    }

    if (!['compra', 'venda'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo deve ser "compra" ou "venda"' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Buscar preço atual do Yahoo Finance no momento da execução
    const priceResult = await yahooFinanceService.getCurrentPrice(ticker);

    if (!priceResult) {
      return NextResponse.json(
        { error: 'Não foi possível obter o preço atual do ativo. Ticker pode ser inválido ou indisponível.' },
        { status: 400 }
      );
    }

    // Criar transação com preço obtido do Yahoo Finance
    const transaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ticker,
      type,
      quantity: Number(quantity),
      price: priceResult, // Preço obtido do Yahoo Finance no momento da execução
      date: new Date(date),
      createdAt: new Date(),
    };

    // TODO: Salvar no banco de dados (Supabase) quando integrar
    // Por enquanto, retorna a transação criada
    // O frontend salvará no localStorage via store

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transação criada com sucesso. Preço obtido do Yahoo Finance no momento da execução.',
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar transação' },
      { status: 500 }
    );
  }
}

