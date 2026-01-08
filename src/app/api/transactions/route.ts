import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/lib/services/yahoo-finance-service';
import { requirePremium } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma/client';
import { priceService } from '@/lib/services/price-service';
import { allowsFractionalQuantity } from '@/lib/utils/asset-type';
import { calculatePositions, normalizeTickerForGrouping } from '@/lib/utils/portfolio-calculator';
import { startOfYear, endOfYear } from 'date-fns';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Converte Decimal do Prisma ou número para número JavaScript
 */
function toNumber(value: any): number {
  // Se tem método toNumber, é um Decimal do Prisma
  if (value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  // Caso contrário, converte para número
  return Number(value);
}

/**
 * Converte número para string sem notação científica
 * Preserva precisão para valores muito pequenos (ex: 0.000001)
 */
function numberToString(num: number): string {
  if (num === 0) return '0';
  
  // Usar toFixed com muitas casas decimais para evitar notação científica
  // e depois remover zeros à direita desnecessários
  let str = num.toFixed(18);
  
  // Remover zeros à direita após o ponto decimal
  // Ex: "0.000001000000000000" -> "0.000001"
  if (str.includes('.')) {
    str = str.replace(/0+$/, ''); // Remove zeros à direita
    str = str.replace(/\.$/, ''); // Remove ponto se não há mais dígitos
  }
  
  return str;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e assinatura premium
    const session = await requirePremium();
    const userId = session.user.id;

    const body = await request.json();
    const { ticker, type, quantity, date } = body;
    
    // Validações básicas ANTES de converter quantity
    // Usar verificação explícita para não tratar 0.000001 como falsy
    if (!ticker || !type || quantity === undefined || quantity === null || !date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: ticker, type, quantity, date' },
        { status: 400 }
      );
    }
    
    // Converter quantity para string preservando precisão
    // Isso garante que valores muito pequenos (ex: 0.000001) não percam precisão
    const quantityStr = typeof quantity === 'number' 
      ? numberToString(quantity)
      : String(quantity);

    if (!['compra', 'venda'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo deve ser "compra" ou "venda"' },
        { status: 400 }
      );
    }

    // Validar e normalizar ticker usando o serviço do Yahoo Finance
    const validationResult = await yahooFinanceService.validateTicker(ticker);
    
    if (!validationResult.valid || !validationResult.price) {
      return NextResponse.json(
        { error: validationResult.error || 'Não foi possível obter o preço atual do ativo. Ticker pode ser inválido ou indisponível.' },
        { status: 400 }
      );
    }

    const normalizedTicker = validationResult.ticker;
    const priceResult = validationResult.price;
    
    // Verificar se o ativo permite frações
    const allowsFractions = allowsFractionalQuantity(normalizedTicker);
    
    // Validação de quantidade baseada no tipo de ativo
    // Usar a string preservada para validação precisa
    const numQuantity = Number(quantityStr);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }
    
    // Se não permite frações, quantidade deve ser >= 1
    if (!allowsFractions && numQuantity < 1) {
      return NextResponse.json(
        { error: 'Quantidade deve ser igual ou maior que 1 para este tipo de ativo' },
        { status: 400 }
      );
    }

    // Se for venda, verificar se o usuário tem quantidade suficiente
    if (type === 'venda') {
      // Buscar todas as transações do usuário do ano atual
      const now = new Date();
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      
      const userTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Converter transações para formato esperado pelo calculatePositions
      const transactions = userTransactions.map(tx => ({
        id: tx.id,
        userId: tx.userId,
        ticker: tx.ticker,
        type: tx.type as 'compra' | 'venda',
        quantity: toNumber(tx.quantity),
        price: toNumber(tx.price),
        date: tx.date,
        createdAt: tx.createdAt,
      }));

      // Calcular posições atuais
      const positions = calculatePositions(transactions);
      
      // Normalizar ticker para comparação (mesma lógica do calculatePositions)
      const normalizedTickerForPosition = normalizeTickerForGrouping(normalizedTicker);
      
      // Encontrar posição atual do ticker
      const currentPosition = positions.find(
        pos => normalizeTickerForGrouping(pos.ticker) === normalizedTickerForPosition
      );

      const availableQuantity = currentPosition?.quantity || 0;

      // Verificar se a quantidade a vender não excede a disponível
      if (numQuantity > availableQuantity) {
        return NextResponse.json(
          { 
            error: 'Quantidade insuficiente para venda',
            availableQuantity,
            requestedQuantity: numQuantity,
            ticker: normalizedTicker,
          },
          { status: 400 }
        );
      }
    }

    // Adicionar ticker ao cache de preços para monitoramento futuro
    priceService.addTicker(normalizedTicker);

    // Debug: log para verificar o valor antes de salvar
    console.log('=== DEBUG TRANSACTION ===');
    console.log('quantity (original):', quantity, typeof quantity);
    console.log('quantityStr:', quantityStr, typeof quantityStr);
    const testDecimal = new Prisma.Decimal(quantityStr);
    console.log('testDecimal.toString():', testDecimal.toString());
    console.log('testDecimal.toNumber():', testDecimal.toNumber());
    console.log('=======================');

    // Criar transação no banco de dados
    // Passar quantityStr diretamente como string - Prisma vai converter para Decimal automaticamente
    // Isso evita problemas de precisão ao criar o Decimal manualmente
    console.log('Criando transação com quantityStr:', quantityStr);
    
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        ticker: normalizedTicker, // Usar ticker normalizado do Yahoo Finance
        type,
        quantity: quantityStr, // Passar string diretamente - Prisma converte para Decimal
        price: String(priceResult), // Passar string diretamente também
        date: new Date(date),
      },
    });
    
    // Debug: log para verificar o valor após salvar
    console.log('=== TRANSACTION SAVED ===');
    console.log('transaction.id:', transaction.id);
    console.log('transaction.quantity:', transaction.quantity);
    console.log('transaction.quantity type:', typeof transaction.quantity);
    console.log('transaction.quantity constructor:', transaction.quantity?.constructor?.name);
    if (transaction.quantity && typeof transaction.quantity.toString === 'function') {
      console.log('transaction.quantity.toString():', transaction.quantity.toString());
    }
    if (transaction.quantity && typeof transaction.quantity.toNumber === 'function') {
      console.log('transaction.quantity.toNumber():', transaction.quantity.toNumber());
    } else {
      console.log('transaction.quantity is NOT a Decimal, it is:', typeof transaction.quantity);
    }
    console.log('========================');

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        userId: transaction.userId,
        ticker: transaction.ticker,
        type: transaction.type,
        quantity: toNumber(transaction.quantity),
        price: toNumber(transaction.price),
        date: transaction.date.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
      },
      message: 'Transação criada com sucesso. Preço obtido do Yahoo Finance no momento da execução.',
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado para criar transações' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Premium subscription required') {
      return NextResponse.json(
        { error: 'Assinatura premium necessária para criar transações' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar transação' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requirePremium();
    const userId = session.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        ticker: t.ticker,
        type: t.type,
        quantity: toNumber(t.quantity),
        price: toNumber(t.price),
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    );
  }
}

