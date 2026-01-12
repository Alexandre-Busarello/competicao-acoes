'use client';

import Link from 'next/link';
import { GlobalFeed } from '@/components/feed/GlobalFeed';
import { PublicFeed } from '@/components/feed/PublicFeed';
import { PageHeader } from '@/components/navigation/PageHeader';
import { CreatePostFAB } from '@/components/feed/CreatePostFAB';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';

export default function FeedPage() {
  const { isAuthenticated, isLoading } = useAuth();

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
          rightAction={
            <Link href="/feed/create" className="hidden lg:block">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Post
              </Button>
            </Link>
          }
        />
        <div className="flex-1 container mx-auto px-4 py-4 max-w-4xl overflow-hidden">
          <GlobalFeed />
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

