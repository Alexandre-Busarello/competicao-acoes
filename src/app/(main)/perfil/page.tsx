'use client';

import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { PremiumCard } from '@/components/profile/PremiumCard';
import { CheckoutSection } from '@/components/profile/CheckoutSection';
import { useUserStore } from '@/lib/store/userStore';

export default function ProfilePage() {
  const { user } = useUserStore();
  const isPremium = user?.isPremium ?? false;

  return (
    <div className="min-h-screen pb-4">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Perfil</h1>
        </div>
      </div>
      <ProfileInfo />
      {isPremium ? <PremiumCard /> : <CheckoutSection />}
    </div>
  );
}

