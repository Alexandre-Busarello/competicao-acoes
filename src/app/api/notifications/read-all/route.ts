import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { internalNotificationService } from '@/lib/services/internal-notification-service';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/notifications/read-all
 * Marcar todas as notificações como lidas
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await internalNotificationService.markAllAsRead(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

