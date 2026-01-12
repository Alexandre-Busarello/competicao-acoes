import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getServerSession } from '@/lib/auth/server';
import { obfuscatePortfolioTransactions } from '@/lib/utils/portfolio-obfuscation';
import type { Transaction } from '@/types';

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
 * Aplica ofuscação de transações para usuários não premium
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

    // Buscar sessão do usuário (pode ser null se não autenticado)
    const session = await getServerSession();
    const viewerUserId = session?.user.id;
    const isPremium = session?.user.isPremium ?? false;
    const isOwner = viewerUserId === userId;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    // Converter transações para formato Transaction
    const transactionsData: Transaction[] = transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      ticker: t.ticker,
      type: t.type as 'compra' | 'venda',
      quantity: toNumber(t.quantity),
      price: toNumber(t.price),
      currency: (t as any).currency || null,
      date: t.date,
      createdAt: t.createdAt,
    }));

    // Aplicar ofuscação de transações
    const obfuscatedTransactions = obfuscatePortfolioTransactions(
      transactionsData,
      isPremium,
      isOwner,
      viewerUserId,
      userId
    );

    // Converter datas para ISO string para serialização JSON
    return NextResponse.json({
      transactions: obfuscatedTransactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        ticker: t.ticker,
        type: t.type,
        quantity: t.quantity,
        price: t.price,
        currency: t.currency,
        date: t.date instanceof Date ? t.date.toISOString() : t.date,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
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






