'use client';

import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { PremiumCard } from '@/components/profile/PremiumCard';
import { CheckoutSection } from '@/components/profile/CheckoutSection';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useUserStore } from '@/lib/store/userStore';

export default function ProfilePage() {
  const { user } = useUserStore();
  const isPremium = user?.isPremium ?? false;

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

