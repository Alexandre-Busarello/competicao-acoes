'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/client';

export function NotificationBell() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const { data: badgeCount } = useQuery({
    queryKey: ['notifications-badge'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications/badge');
        if (!response.ok) {
          return 0;
        }
        const data = await response.json();
        return data.count as number;
      } catch (error) {
        console.error('Error fetching notification badge:', error);
        return 0;
      }
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000,
    enabled: isAuthenticated, // Só buscar se estiver autenticado
  });

  const unreadCount = badgeCount || 0;
  const isActive = pathname === '/notificacoes';

  // Não mostrar se não estiver autenticado
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Link href="/notificacoes">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'relative flex-shrink-0',
          isActive && 'text-primary bg-primary/10'
        )}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}

