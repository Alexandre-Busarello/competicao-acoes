'use client';

import { PublicProfileHeader } from '@/components/profile/PublicProfileHeader';
import { ProfitabilityUpdateBanner } from '@/components/profile/ProfitabilityUpdateBanner';
import { MedalSummary } from '@/components/profile/MedalSummary';
import { UserFeed } from '@/components/feed/UserFeed';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useUserStore } from '@/lib/store/userStore';

interface PublicProfilePageClientProps {
  userId: string;
}

export function PublicProfilePageClient({ userId }: PublicProfilePageClientProps) {
  const { user } = useUserStore();
  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen">
      <PageHeader title="Perfil" backHref="/ranking" />
      <ProfitabilityUpdateBanner userId={userId} />
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
        <PublicProfileHeader userId={userId} />
        <MedalSummary userId={userId} />
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Feed</h2>
          <UserFeed userId={userId} includePrivate={isOwnProfile} />
        </div>
      </div>
    </div>
  );
}

