'use client';

import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { PremiumCard } from '@/components/profile/PremiumCard';
import { CheckoutSection } from '@/components/profile/CheckoutSection';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useUserStore } from '@/lib/store/userStore';
import { useAuth } from '@/lib/auth/client';

export default function ProfilePage() {
  const { user } = useUserStore();
  const { isAuthenticated } = useAuth();
  const isPremium = user?.isPremium ?? false;

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

  return (
    <div className="min-h-screen pb-4">
      <PageHeader 
        title="Perfil" 
        backHref="/ranking"
      />
      <ProfileInfo />
      {isPremium ? <PremiumCard /> : <CheckoutSection />}
    </div>
  );
}

