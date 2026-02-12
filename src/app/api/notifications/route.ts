import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { internalNotificationService } from '@/lib/services/internal-notification-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * Listar notificações do usuário (agregadas, paginadas)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const read = searchParams.get('read');
    
    const readFilter = read === 'true' ? true : read === 'false' ? false : undefined;

    const notifications = await internalNotificationService.getNotifications(userId, {
      limit,
      offset,
      read: readFilter,
    });

    return NextResponse.json({
      notifications,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
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




















