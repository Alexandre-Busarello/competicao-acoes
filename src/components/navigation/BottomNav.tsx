'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rss, Trophy, Wallet, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/client';

const navItems = [
  {
    href: '/feed',
    label: 'Feed',
    icon: Rss,
  },
  {
    href: '/ranking',
    label: 'Ranking',
    icon: Trophy,
  },
  {
    href: '/minha-carteira',
    label: 'Carteira',
    icon: Wallet,
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: User,
  },
];

export function BottomNav() {
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
        return 0;
      }
    },
    refetchInterval: 30000,
    staleTime: 10000,
    enabled: isAuthenticated,
  });

  const unreadCount = badgeCount || 0;
  const isNotificationsActive = pathname === '/notificacoes';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        {isAuthenticated && (
          <Link
            href="/notificacoes"
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full transition-colors relative',
              isNotificationsActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Bell className="h-6 w-6 mb-1" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Notificações</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

