'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
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
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
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
      </div>
    </nav>
  );
}

