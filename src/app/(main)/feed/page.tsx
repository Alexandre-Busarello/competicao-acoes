'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlobalFeed } from '@/components/feed/GlobalFeed';
import { PublicFeed } from '@/components/feed/PublicFeed';
import { CreatePostFAB } from '@/components/feed/CreatePostFAB';
import { FeedFilterDropdown } from '@/components/feed/FeedFilterDropdown';
import { PageLoading } from '@/components/ui/page-loading';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';
import { useQueryClient } from '@tanstack/react-query';

export default function FeedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [filterInteractions, setFilterInteractions] = useState(false);
  const [filterMyPosts, setFilterMyPosts] = useState(false);

  // Adicionar overflow-hidden no html apenas na página de feed
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

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
      <PageLoading 
        title="Carregando feed"
        description="Preparando seu feed personalizado..."
      />
    );
  }

  // Se autenticado, mostrar feed completo
  if (isAuthenticated) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-2 py-4 overflow-hidden">
          <GlobalFeed 
            filterInteractions={filterInteractions}
            filterMyPosts={filterMyPosts}
            filterComponent={
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-3">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  {/* Filtro - visível em mobile e desktop, alinhado à esquerda */}
                  <div className="flex-1 min-w-0">
                    <FeedFilterDropdown
                      value={filterMyPosts ? 'myPosts' : filterInteractions ? 'interactions' : 'global'}
                      onValueChange={handleFilterChange}
                      variant="ghost"
                      size="sm"
                      showText={true}
                    />
                  </div>
                  {/* Novo Post - apenas desktop, alinhado à direita */}
                  <div className="hidden lg:block flex-shrink-0">
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

