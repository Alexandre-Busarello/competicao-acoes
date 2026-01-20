'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, MessageCircle, Reply, CheckCheck, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AggregatedNotification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'ranking';
  postId: string;
  commentId?: string;
  content?: string; // Para ranking, contém JSON com dados da mudança
  post?: {
    slug: string;
    content: string;
  };
  count: number;
  actors: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
  }>;
  latestActor: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InternalNotificationsProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function InternalNotifications({
  limit = 50,
  showHeader = true,
  compact = false,
}: InternalNotificationsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{
    notifications: AggregatedNotification[];
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>({
    queryKey: ['notifications', limit],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?limit=${limit}&offset=0`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 fill-destructive text-destructive" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-primary" />;
      case 'reply':
        return <Reply className="h-4 w-4 text-primary" />;
      case 'ranking':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatNotificationMessage = (notification: AggregatedNotification): string => {
    if (notification.type === 'ranking') {
      try {
        const rankingData = notification.content ? JSON.parse(notification.content) : null;
        if (rankingData) {
          const { previousPosition, currentPosition, changeType, period } = rankingData;
          const periodText = period === 'mensal' ? 'mensal' : 'anual';
          
          if (changeType === 'top3') {
            const medal = currentPosition === 1 ? '🥇' : currentPosition === 2 ? '🥈' : '🥉';
            return `${medal} Parabéns! Você entrou no top 3 do ranking ${periodText}!`;
          } else if (changeType === 'up') {
            const positions = previousPosition - currentPosition;
            return `📈 Você subiu ${positions} posição${positions > 1 ? 'ões' : ''} no ranking ${periodText} e agora está na ${currentPosition}ª posição`;
          } else {
            const positions = currentPosition - previousPosition;
            return `📉 Você desceu ${positions} posição${positions > 1 ? 'ões' : ''} no ranking ${periodText} e agora está na ${currentPosition}ª posição`;
          }
        }
      } catch (error) {
        console.error('Erro ao parsear dados de ranking:', error);
      }
      return 'Mudança no ranking';
    }

    const postPreview = notification.post?.content.substring(0, 50) || 'seu post';
    const postTitle = postPreview.length > 50 ? postPreview + '...' : postPreview;

    switch (notification.type) {
      case 'like':
        if (notification.count === 1) {
          return `${notification.latestActor.name} curtiu seu post "${postTitle}"`;
        }
        return `Seu post "${postTitle}" recebeu ${notification.count} curtidas`;
      case 'comment':
        if (notification.count === 1) {
          return `${notification.latestActor.name} comentou no seu post "${postTitle}"`;
        }
        return `Seu post "${postTitle}" recebeu ${notification.count} comentários`;
      case 'reply':
        return `${notification.latestActor.name} respondeu seu comentário no post "${postTitle}"`;
      default:
        return 'Nova notificação';
    }
  };

  const handleNotificationClick = async (notification: AggregatedNotification) => {
    // Marcar como lida
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navegar baseado no tipo de notificação
    if (notification.type === 'ranking') {
      try {
        const rankingData = notification.content ? JSON.parse(notification.content) : null;
        if (rankingData) {
          const { period } = rankingData;
          const currentDate = new Date();
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          
          if (period === 'mensal') {
            router.push(`/ranking/mensal/${year}/${month}`);
          } else {
            router.push(`/ranking/anual/${year}`);
          }
          return;
        }
      } catch (error) {
        console.error('Erro ao parsear dados de ranking:', error);
      }
      // Fallback para ranking geral
      router.push('/ranking');
    } else if (notification.post?.slug) {
      router.push(`/posts/${notification.post.slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Erro ao carregar notificações</p>
      </div>
    );
  }

  const notifications = data?.notifications || [];

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma notificação ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notificações</h2>
          {notifications.some((n) => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Marcando...
                </>
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              !notification.read ? 'bg-primary/5 border-primary/20' : ''
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {notification.latestActor.avatarUrl ? (
                    <AvatarImage
                      src={notification.latestActor.avatarUrl}
                      alt={notification.latestActor.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(notification.latestActor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm font-medium break-words">
                          {formatNotificationMessage(notification)}
                        </p>
                      </div>
                      {notification.count > 1 && notification.type !== 'reply' && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex -space-x-2">
                            {notification.actors.slice(0, 3).map((actor, idx) => (
                              <Avatar key={actor.id} className="h-5 w-5 border-2 border-background">
                                {actor.avatarUrl ? (
                                  <AvatarImage src={actor.avatarUrl} alt={actor.name} />
                                ) : null}
                                <AvatarFallback className="bg-muted text-xs">
                                  {getInitials(actor.name).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {notification.count} {notification.type === 'like' ? 'curtidas' : 'comentários'}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.updatedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

