'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlobalFeed } from '@/components/feed/GlobalFeed';
import { PublicFeed } from '@/components/feed/PublicFeed';
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
  const [filterMyPosts, setFilterMyPosts] = useState(false);

  const handleFilterChange = (value: 'global' | 'interactions' | 'myPosts') => {
    const newFilterInteractions = value === 'interactions';
    const newFilterMyPosts = value === 'myPosts';
    setFilterInteractions(newFilterInteractions);
    setFilterMyPosts(newFilterMyPosts);
    // Resetar cache quando alternar
    queryClient.invalidateQueries({ queryKey: ['global-feed'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
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
        <div className="flex-1 container mx-auto px-4 py-4 max-w-4xl overflow-hidden">
          <GlobalFeed 
            filterInteractions={filterInteractions}
            filterMyPosts={filterMyPosts}
            filterComponent={
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 mb-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Filtro - visível em mobile e desktop, alinhado à esquerda */}
                  <FeedFilterDropdown
                    value={filterMyPosts ? 'myPosts' : filterInteractions ? 'interactions' : 'global'}
                    onValueChange={handleFilterChange}
                    variant="ghost"
                    size="sm"
                    showText={true}
                  />
                  {/* Novo Post - apenas desktop, alinhado à direita */}
                  <div className="hidden lg:block">
                    <Link href="/feed/create">
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Post
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            }
          />
        </div>
        <CreatePostFAB />
      </div>
    );
  }

  // Se não autenticado, mostrar feed público limitado
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <PublicFeed />
      </div>
    </div>
  );
}

