import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

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
 * GET /api/transactions/[userId]
 * Busca transações de um usuário específico (público para visualização de carteira)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

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
    console.error('Erro ao buscar transações do usuário:', error);
    
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    );
  }
}


