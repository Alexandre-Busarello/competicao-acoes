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

function ProfileContent() {
  const { user } = useUserStore();
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const isPremium = user?.isPremium ?? false;
  const fromCTA = searchParams.get('from') === 'cta';

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

