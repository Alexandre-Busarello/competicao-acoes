import { NextRequest, NextResponse } from 'next/server';
import { medalService } from '@/lib/services/medal-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[userId]/medals
 * Retorna resumo de medalhas do usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    const medals = await medalService.getUserMedals(userId);

    return NextResponse.json(medals);
  } catch (error) {
    console.error('Error fetching medals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


