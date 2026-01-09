import { NextRequest, NextResponse } from 'next/server';
import { perpetualProfitabilityService } from '@/lib/services/perpetual-profitability-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[userId]/perpetual-profitability
 * Retorna rentabilidade perpétua do usuário (calculada on-demand com cache de 1 dia)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    const profitability = await perpetualProfitabilityService.getOrCalculateProfitability(userId);

    return NextResponse.json({
      profitability: profitability.profitability,
      totalInvested: profitability.totalInvested,
      currentValue: profitability.currentValue,
      lastUpdated: profitability.lastUpdated.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching perpetual profitability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

