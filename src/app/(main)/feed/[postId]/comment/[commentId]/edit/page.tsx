'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';

export default function EditCommentPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const commentId = params.commentId as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [content, setContent] = useState('');

  // Carregar comentário
  const { data: comment, isLoading: commentLoading, error: commentError } = useQuery({
    queryKey: ['comment', commentId],
    queryFn: async () => {
      const response = await fetch(`/api/feed/${postId}/comment/${commentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Comentário não encontrado');
        }
        if (response.status === 403) {
          throw new Error('Você não tem permissão para editar este comentário');
        }
        throw new Error('Erro ao carregar comentário');
      }
      return response.json();
    },
    enabled: !!commentId && !!postId && isAuthenticated,
  });

  // Preencher conteúdo quando comentário carregar
  useEffect(() => {
    if (comment?.content) {
      setContent(comment.content);
    }
  }, [comment]);

  // Mutation para atualizar comentário
  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/feed/${postId}/comment/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }

      return response.json();
    },
    onSuccess: () => {
      // Voltar para o post (usar query param para scroll se necessário)
      router.push(`/feed`);
      // Tentar voltar para o post específico se tiver slug
      setTimeout(() => {
        router.push(`/feed`);
      }, 100);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    updateCommentMutation.mutate(content.trim());
  };

  if (authLoading || commentLoading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push(`/auth/login?redirect=/feed/${postId}/comment/${commentId}/edit`);
    return null;
  }

  if (commentError) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p>
              {commentError instanceof Error
                ? commentError.message
                : 'Erro ao carregar comentário'}
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

  if (!comment) {
    return null;
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Edite seu comentário..."
              className="min-h-[300px] resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Você pode usar markdown básico para formatação.
            </p>
          </div>
        </div>

        {/* Footer com botão de salvar - sempre visível na parte inferior */}
        <div className="border-t bg-background p-4 md:px-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={updateCommentMutation.isPending}
              className="flex-1 md:flex-initial"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || updateCommentMutation.isPending}
              className="flex-1 md:flex-initial"
            >
              {updateCommentMutation.isPending ? (
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
      </form>

      {/* Mensagem de erro */}
      {updateCommentMutation.isError && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg z-50">
          <p className="text-sm">
            {updateCommentMutation.error instanceof Error
              ? updateCommentMutation.error.message
              : 'Erro ao salvar comentário. Tente novamente.'}
          </p>
        </div>
      )}
    </div>
  );
}

