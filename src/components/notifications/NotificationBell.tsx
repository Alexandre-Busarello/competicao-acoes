'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/client';

export function NotificationBell() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries para atualizar badge e lista de notificações
      queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleClick = async () => {
    // Se houver notificações não lidas, marcar todas como lidas
    if (unreadCount > 0) {
      await markAllAsReadMutation.mutateAsync();
    }
    // Navegar para a página de notificações
    router.push('/notificacoes');
  };

  const unreadCount = badgeCount || 0;
  const isActive = pathname === '/notificacoes';

  // Não mostrar se não estiver autenticado
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        'relative flex-shrink-0',
        isActive && 'text-primary bg-primary/10'
      )}
      aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      disabled={markAllAsReadMutation.isPending}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}

