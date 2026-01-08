'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ExternalLink } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useQueryClient } from '@tanstack/react-query';

// Estilos pré-definidos do DiceBear Avataaars
const DICEBEAR_STYLES = [
  'avataaars',
  'adventurer',
  'adventurer-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
  'shapes',
  'thumbs',
];

// Seeds pré-definidos para gerar avatares únicos
const AVATAR_SEEDS = [
  'alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry',
  'ivy', 'jack', 'kate', 'liam', 'mia', 'noah', 'olivia', 'paul',
  'quinn', 'ruby', 'sam', 'tina', 'uma', 'victor', 'willa', 'xavier',
];

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
}

export function AvatarSelector({ open, onOpenChange, currentEmail }: AvatarSelectorProps) {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [selectedStyle, setSelectedStyle] = useState<string>('avataaars');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectAvatar = async (style: string, seed: string) => {
    if (!user?.email) return;

    setIsUpdating(true);
    try {
      const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

      const response = await fetch('/api/user/avatar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar avatar');
      }

      // Invalidar cache do usuário para buscar dados atualizados
      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      
      // Invalidar cache do ranking para atualizar avatares (agora busca da tabela User)
      await queryClient.invalidateQueries({ queryKey: ['ranking'] });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Erro ao atualizar avatar. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestoreGravatar = async () => {
    if (!user?.email) return;

    setIsUpdating(true);
    try {
      // Buscar URL do Gravatar do servidor
      const gravatarResponse = await fetch(`/api/user/gravatar-url?email=${encodeURIComponent(user.email)}`);
      
      if (!gravatarResponse.ok) {
        throw new Error('Erro ao gerar URL do Gravatar');
      }

      const { gravatarUrl } = await gravatarResponse.json();

      // Atualizar avatar com URL do Gravatar
      const response = await fetch('/api/user/avatar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl: gravatarUrl }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar avatar');
      }

      // Invalidar cache do usuário para buscar dados atualizados
      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      
      // Invalidar cache do ranking para atualizar avatares (agora busca da tabela User)
      await queryClient.invalidateQueries({ queryKey: ['ranking'] });

      onOpenChange(false);
    } catch (error) {
      console.error('Error restoring Gravatar:', error);
      alert('Erro ao restaurar Gravatar. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getGravatarUrl = () => {
    if (!currentEmail) return 'https://www.gravatar.com/';
    return `https://www.gravatar.com/edit?email=${encodeURIComponent(currentEmail)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="break-words">Escolher Avatar</DialogTitle>
          <DialogDescription className="break-words">
            Escolha um avatar do DiceBear ou configure seu Gravatar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-2">
          {/* Link para Gravatar */}
          <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">Usar Gravatar</h3>
                <p className="text-sm text-muted-foreground break-words">
                  Configure sua foto no Gravatar usando seu email
                </p>
              </div>
              <a
                href={getGravatarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline whitespace-nowrap flex-shrink-0"
              >
                Configurar Gravatar
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </a>
            </div>
            {currentEmail && (
              <Button
                onClick={handleRestoreGravatar}
                disabled={isUpdating}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  'Restaurar Gravatar'
                )}
              </Button>
            )}
          </div>

          {/* Seletor de estilo */}
          <div>
            <h3 className="font-semibold mb-3">Estilo do Avatar</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {DICEBEAR_STYLES.map((style) => {
                const displayName = style.replace(/-/g, ' ');
                return (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStyle(style)}
                    className="text-xs capitalize px-1.5 py-1.5 min-w-0 overflow-hidden"
                    title={displayName}
                  >
                    <span className="truncate block w-full text-center">{displayName}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Grid de avatares */}
          <div>
            <h3 className="font-semibold mb-3">Escolha um Avatar</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {AVATAR_SEEDS.map((seed) => {
                const avatarUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(seed)}`;
                return (
                  <button
                    key={seed}
                    onClick={() => handleSelectAvatar(selectedStyle, seed)}
                    disabled={isUpdating}
                    className="relative group aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    title={seed}
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={avatarUrl} alt={seed} />
                    </Avatar>
                    {isUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

