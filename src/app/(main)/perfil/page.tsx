'use client';

import { Suspense } from 'react';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { PremiumCard } from '@/components/profile/PremiumCard';
import { CheckoutSection } from '@/components/profile/CheckoutSection';
import { PasswordManager } from '@/components/profile/PasswordManager';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useUserStore } from '@/lib/store/userStore';
import { useAuth } from '@/lib/auth/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useProfileUrl } from '@/lib/hooks/use-profile-url';

function ProfileContent() {
  const { user } = useUserStore();
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const isPremium = user?.isPremium ?? false;
  const fromCTA = searchParams.get('from') === 'cta';
  // Hook deve ser chamado sempre, não condicionalmente
  const profileUrl = useProfileUrl(user?.id || '');

  // Se não estiver autenticado, mostrar CheckoutSection que usa modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-4">
        <PageHeader 
          title="Perfil" 
          backHref="/ranking"
        />
        <CheckoutSection />
      </div>
    );
  }

  // Se veio de CTA de conversão, mostrar CheckoutSection primeiro
  if (fromCTA && !isPremium) {
    return (
      <div className="min-h-screen pb-4">
        <PageHeader 
          title="Perfil" 
          backHref="/ranking"
        />
        {user && profileUrl && (
          <div className="container mx-auto px-4 py-4">
            <Link href={profileUrl}>
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Perfil Público
              </Button>
            </Link>
          </div>
        )}
        <CheckoutSection />
        <ProfileInfo />
        <PasswordManager />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      <PageHeader 
        title="Perfil" 
        backHref="/ranking"
      />
      {user && (
        <div className="container mx-auto px-4 py-4">
          <Link href={`/perfil/${user.id}`}>
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Perfil Público
            </Button>
          </Link>
        </div>
      )}
      <ProfileInfo />
      <PasswordManager />
      {isPremium ? <PremiumCard /> : <CheckoutSection />}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pb-4">
        <PageHeader 
          title="Perfil" 
          backHref="/ranking"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

