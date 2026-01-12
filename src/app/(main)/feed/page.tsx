'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlobalFeed } from '@/components/feed/GlobalFeed';
import { PublicFeed } from '@/components/feed/PublicFeed';
import { PageHeader } from '@/components/navigation/PageHeader';
import { CreatePostFAB } from '@/components/feed/CreatePostFAB';
import { FeedFilterDropdown } from '@/components/feed/FeedFilterDropdown';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';
import { useQueryClient } from '@tanstack/react-query';

export default function FeedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [filterInteractions, setFilterInteractions] = useState(false);

  const handleFilterChange = (value: 'global' | 'interactions') => {
    const newFilterInteractions = value === 'interactions';
    setFilterInteractions(newFilterInteractions);
    // Resetar cache quando alternar
    queryClient.invalidateQueries({ queryKey: ['global-feed'] });
  };

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

  // Se autenticado, mostrar feed completo
  if (isAuthenticated) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <PageHeader 
          title="Feed" 
          backHref="/ranking"
          leftAction={
            <FeedFilterDropdown
              value={filterInteractions ? 'interactions' : 'global'}
              onValueChange={handleFilterChange}
              variant="ghost"
              size="sm"
            />
          }
          rightAction={
            <div className="flex items-center gap-2">
              <FeedFilterDropdown
                value={filterInteractions ? 'interactions' : 'global'}
                onValueChange={handleFilterChange}
                variant="ghost"
                size="sm"
              />
              <Link href="/feed/create">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Post
                </Button>
              </Link>
            </div>
          }
        />
        <div className="flex-1 container mx-auto px-4 py-4 max-w-4xl overflow-hidden">
          <GlobalFeed filterInteractions={filterInteractions} />
        </div>
        <CreatePostFAB />
      </div>
    );
  }

  // Se não autenticado, mostrar feed público limitado
  return (
    <div className="min-h-screen">
      <PageHeader title="Feed" backHref="/ranking" />
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <PublicFeed />
      </div>
    </div>
  );
}

