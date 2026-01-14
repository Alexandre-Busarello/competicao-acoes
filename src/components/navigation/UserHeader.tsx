'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/lib/auth/client';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { formatUserNameWithId, getNameWithoutId } from '@/lib/utils/format-user-name';
import { LogOut, Crown, Loader2, LogIn, Rss, Trophy, Wallet, User, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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

export function UserHeader() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  // Logo combinada (favicon + texto) baseado no tema
  const logoPath = theme === 'dark' 
    ? '/logo-combinada-escuro.svg' 
    : '/logo-combinada-claro.svg';

  const handleSignOut = async () => {
    await signOut();
    router.push('/ranking');
  };

  if (isLoading) {
    return (
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3 max-w-4xl">
          <Link href="/ranking" className="flex items-center hover:opacity-90 transition-opacity">
            <img 
              src={logoPath}
              alt="Hold Arena" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
          </Link>
          {/* Navegação Desktop - Loading */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-1.5 rounded-md text-muted-foreground opacity-50"
                >
                  <Icon className="h-3.5 w-3.5 md:h-3.5 md:w-3.5" />
                  <span className="text-xs md:text-sm font-medium">{item.label}</span>
                </div>
              );
            })}
          </nav>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Mostrar header com botão de entrar quando não autenticado
    return (
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3 max-w-4xl">
          <Link href="/ranking" className="flex items-center hover:opacity-90 transition-opacity">
            <img 
              src={logoPath}
              alt="Hold Arena" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
          </Link>
          {/* Navegação Desktop - Não autenticado */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-1.5 rounded-md transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 md:h-3.5 md:w-3.5" />
                  <span className="text-xs md:text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5 md:gap-2">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="md:px-3 px-2">
                <LogIn className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Entrar</span>
              </Button>
            </Link>
            <Link href="/auth/login?signup=true">
              <Button size="sm" className="flex-1 md:flex-none">
                <UserPlus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                <span className="text-xs md:text-sm">Criar Conta</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nameWithoutId = getNameWithoutId(user.name || '');
  const initials = nameWithoutId
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3 max-w-4xl">
          <Link href="/ranking" className="flex items-center hover:opacity-90 transition-opacity">
            <img 
              src={logoPath}
              alt="Hold Arena" 
              className="h-14 sm:h-16 md:h-16 w-auto object-contain"
            />
          </Link>
        
        {/* Navegação Desktop */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-1.5 rounded-md transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-3.5 w-3.5 md:h-3.5 md:w-3.5" />
                <span className="text-xs md:text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <Link href="/perfil" className="flex items-center gap-1.5 md:gap-2 min-w-0 max-w-[200px] md:max-w-[180px] hover:opacity-80 transition-opacity">
            <Avatar className="h-8 w-8 md:h-7 md:w-7 flex-shrink-0">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="font-semibold text-xs md:text-sm truncate min-w-0">
                  {formatUserNameWithId(user.name || 'Usuário', user.id)}
                </p>
                {user.isPremium && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-warning/20 dark:bg-warning/10 border border-warning/30 dark:border-warning/20 rounded-md flex-shrink-0">
                    <Crown className="h-3 w-3 md:h-3.5 md:w-3.5 text-warning" />
                    <span className="text-[10px] md:text-xs font-semibold text-warning">PRO</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                {user.email || 'Sem email'}
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="flex-shrink-0"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

