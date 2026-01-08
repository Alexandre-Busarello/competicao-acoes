'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/client';
import { formatUserNameWithId, getNameWithoutId } from '@/lib/utils/format-user-name';
import { LogOut, Crown, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function UserHeader() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/ranking');
  };

  if (isLoading) {
    return (
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3 max-w-4xl">
          <Link href="/ranking" className="flex items-center hover:opacity-90 transition-opacity">
            <Image 
              src="/logo-no-bg.png" 
              alt="Arena do Investidor" 
              width={160} 
              height={53}
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
              priority
            />
          </Link>
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
            <Image 
              src="/logo-no-bg.png" 
              alt="Arena do Investidor" 
              width={160} 
              height={53}
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
              priority
            />
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              <LogIn className="h-4 w-4 mr-2" />
              Entrar
            </Button>
          </Link>
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
          <Image 
            src="/logo-no-bg.png" 
            alt="Arena do Investidor" 
            width={200} 
            height={67}
            className="h-14 sm:h-16 w-auto object-contain"
            priority
          />
        </Link>
        
        <div className="flex items-center gap-3">
          <Link href="/perfil" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm truncate">
                  {formatUserNameWithId(user.name || 'Usuário', user.id)}
                </p>
                {user.isPremium && (
                  <Crown className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
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

