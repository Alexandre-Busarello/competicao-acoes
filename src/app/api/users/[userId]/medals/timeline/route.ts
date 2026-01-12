import { NextRequest, NextResponse } from 'next/server';
import { medalService } from '@/lib/services/medal-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[userId]/medals/timeline
 * Retorna timeline completa de medalhas do usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    const timeline = await medalService.getMedalTimeline(userId);

    return NextResponse.json({
      timeline: timeline.map(entry => ({
        ...entry,
        calculatedAt: entry.calculatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching medal timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


