'use client';

import { useQuery } from '@tanstack/react-query';
import { FeedPost } from './FeedPost';
import { PageLoading } from '@/components/ui/page-loading';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';

export function PublicFeed() {
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['public-feed'],
    queryFn: async () => {
      const response = await fetch('/api/feed/public?limit=5');
      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }
      return response.json();
    },
  });

  const posts = data?.posts || [];

  if (isLoading || (isFetching && !data)) {
    return (
      <PageLoading 
        title="Carregando feed público"
        description="Buscando os últimos posts da comunidade..."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Container de posts */}
      <div className="space-y-4">
        {posts.map((post: any) => (
          <div key={post.id} data-post-id={post.id}>
            <FeedPost post={post} isOwner={false} truncateContent={true} />
          </div>
        ))}
      </div>

      {/* CTA para criação de conta */}
      {posts.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Continue explorando o feed</CardTitle>
            </div>
            <CardDescription>
              Crie sua conta gratuita para ver mais posts, interagir com outros investidores e compartilhar suas estratégias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login?returnUrl=/feed">
              <Button className="w-full gap-2">
                Criar conta gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {/* <p className="text-xs text-muted-foreground text-center mt-3">
              Já tem uma conta?{' '}
              <Link href="/auth/login?returnUrl=/feed" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </p> */}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há posts */}
      {posts.length === 0 && !isFetching && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum post ainda.</p>
          <Link href="/auth/login?returnUrl=/feed">
            <Button className="mt-4 gap-2">
              Criar conta e ser o primeiro a postar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

