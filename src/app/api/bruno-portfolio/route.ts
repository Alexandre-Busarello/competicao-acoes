import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Buscar portfolio do Bruno (deve ter apenas um registro)
    const brunoPortfolio = await prisma.brunoPortfolio.findFirst({
      include: {
        assets: {
          orderBy: {
            ticker: 'asc',
          },
        },
      },
    });

    if (!brunoPortfolio) {
      return NextResponse.json({
        portfolio: null,
        message: 'Portfolio do Bruno não encontrado',
      });
    }

    return NextResponse.json({
      portfolio: {
        id: brunoPortfolio.id,
        name: 'Bruno Chimarelli',
        monthlyReturn: brunoPortfolio.monthlyReturn.toNumber(),
        annualReturn: brunoPortfolio.annualReturn?.toNumber(),
        description: brunoPortfolio.description,
        assets: brunoPortfolio.assets.map((asset) => ({
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          quantity: asset.quantity,
          averagePrice: asset.averagePrice.toNumber(),
          currentPrice: asset.currentPrice.toNumber(),
          return: asset.returnPercentage.toNumber(),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching Bruno portfolio:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar portfolio do Bruno',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

