'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { MarkdownEditor } from '@/components/feed/MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';
import { updateFeedSeed } from '@/lib/utils/feed-seed';

export default function CreatePostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [content, setContent] = useState('');
  const [editorHeight, setEditorHeight] = useState('calc(100vh - 237px)'); // Mobile por padrão (sem header)

  // Ajustar altura baseado no tamanho da tela
  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth >= 768) {
        // Desktop
        setEditorHeight('calc(100vh - 289px)');
      } else {
        // Mobile
        setEditorHeight('calc(100vh - 237px)');
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }

      return response.json();
    },
    onSuccess: () => {
      // Atualizar seed do feed para reorganizar após criar post
      updateFeedSeed();
      router.push('/feed');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createPostMutation.mutate(content.trim());
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/feed/create');
    return null;
  }

  return (
    <div className="flex flex-col overflow-hidden">
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
            placeholder="Escreva seu post... Você pode usar markdown para formatação."
            minHeight="200px"
            className="h-full"
          />
        </div>

        {/* Footer com botão de publicar - sempre visível na parte inferior */}
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
                disabled={createPostMutation.isPending}
                className="flex-1 md:flex-initial"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!content.trim() || createPostMutation.isPending}
                className="flex-1 md:flex-initial"
              >
                {createPostMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  'Publicar'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Mensagem de erro */}
      {createPostMutation.isError && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg z-50">
          <p className="text-sm">
            {createPostMutation.error instanceof Error
              ? createPostMutation.error.message
              : 'Erro ao criar post. Tente novamente.'}
          </p>
        </div>
      )}
    </div>
  );
}

