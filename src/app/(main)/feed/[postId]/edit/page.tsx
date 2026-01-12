'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MarkdownEditor } from '@/components/feed/MarkdownEditor';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [content, setContent] = useState('');
  const [editorHeight, setEditorHeight] = useState('calc(100vh - 300px)'); // Mobile por padrão

  // Ajustar altura baseado no tamanho da tela
  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth >= 768) {
        // Desktop
        setEditorHeight('calc(100vh - 327px)');
      } else {
        // Mobile
        setEditorHeight('calc(100vh - 300px)');
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Carregar post
  const { data: post, isLoading: postLoading, error: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await fetch(`/api/feed/${postId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post não encontrado');
        }
        if (response.status === 403) {
          throw new Error('Você não tem permissão para editar este post');
        }
        throw new Error('Erro ao carregar post');
      }
      return response.json();
    },
    enabled: !!postId && isAuthenticated,
  });

  // Preencher conteúdo quando post carregar
  useEffect(() => {
    if (post?.content) {
      setContent(post.content);
    }
  }, [post]);

  // Mutation para atualizar post
  const updatePostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/feed/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update post');
      }

      return response.json();
    },
    onSuccess: () => {
      // Redirecionar para o post
      if (post?.slug) {
        router.push(`/posts/${post.slug}`);
      } else {
        router.push('/feed');
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    updatePostMutation.mutate(content.trim());
  };

  if (authLoading || postLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Editar Post" backHref="/feed" />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push(`/auth/login?redirect=/feed/${postId}/edit`);
    return null;
  }

  if (postError) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Editar Post" backHref="/feed" />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p>
              {postError instanceof Error
                ? postError.message
                : 'Erro ao carregar post'}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/feed')}
              className="mt-4"
            >
              Voltar para o feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <PageHeader title="Editar Post" backHref={post.slug ? `/posts/${post.slug}` : '/feed'} className="flex-shrink-0" />
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Editor - altura calculada descontando header e footer (valores diferentes para mobile/desktop) */}
        <div 
          className="overflow-hidden flex-shrink-0" 
          style={{ 
            height: editorHeight
          }}
        >
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Edite seu post..."
            minHeight="200px"
            className="h-full"
          />
        </div>

        {/* Footer com botão de salvar - sempre visível na parte inferior */}
        <div className="border-t bg-background p-4 md:px-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground hidden md:block">
              {content.length} caracteres
            </p>
            <div className="flex gap-2 w-full md:w-auto md:ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={updatePostMutation.isPending}
                className="flex-1 md:flex-initial"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!content.trim() || updatePostMutation.isPending}
                className="flex-1 md:flex-initial"
              >
                {updatePostMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Mensagem de erro */}
      {updatePostMutation.isError && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg z-50">
          <p className="text-sm">
            {updatePostMutation.error instanceof Error
              ? updatePostMutation.error.message
              : 'Erro ao salvar post. Tente novamente.'}
          </p>
        </div>
      )}
    </div>
  );
}

