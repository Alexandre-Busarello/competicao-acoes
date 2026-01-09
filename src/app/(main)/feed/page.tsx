'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalFeed } from '@/components/feed/GlobalFeed';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth } from '@/lib/auth/client';

export default function FeedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/feed');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Feed" backHref="/ranking" />
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecionamento em andamento
  }

  return (
    <div className="min-h-screen pb-4">
      <PageHeader title="Feed" backHref="/ranking" />
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <GlobalFeed />
      </div>
    </div>
  );
}

