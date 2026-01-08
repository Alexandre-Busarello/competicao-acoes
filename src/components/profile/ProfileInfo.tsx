'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/lib/store/userStore';
import { useRankingStore } from '@/lib/store/rankingStore';
import { formatUserNameWithId, getNameWithoutId } from '@/lib/utils/format-user-name';
import { AvatarSelector } from './AvatarSelector';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function ProfileInfo() {
  const { user } = useUserStore();
  const { competitors } = useRankingStore();
  const queryClient = useQueryClient();
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  if (!user) return null;

  // Encontrar o usuário atual na lista de competidores para obter o rank
  const userInRanking = competitors.find(c => c.id === user.id);
  const displayRank = userInRanking?.rank ?? 0;

  // Remover ID do nome para gerar iniciais corretamente
  const nameWithoutId = getNameWithoutId(user.name || '');
  const initials = nameWithoutId
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleStartEditName = () => {
    setEditedName(nameWithoutId);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === nameWithoutId) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingName(true);
    try {
      const response = await fetch('/api/user/name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar nome');
      }

      // Invalidar cache do usuário para buscar dados atualizados
      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      
      // Invalidar cache do ranking para atualizar nomes
      await queryClient.invalidateQueries({ queryKey: ['ranking'] });

      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar nome. Tente novamente.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEditName();
    }
  };

  return (
    <>
      <Card className="mx-4 mt-4">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full shadow-md"
                onClick={() => setIsAvatarSelectorOpen(true)}
                aria-label="Alterar avatar"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 group/name">
                {isEditingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isUpdatingName}
                      className="text-xl font-bold h-9 flex-1"
                      autoFocus
                      maxLength={100}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveName}
                      disabled={isUpdatingName}
                      className="h-8 w-8"
                      aria-label="Salvar nome"
                    >
                      {isUpdatingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelEditName}
                      disabled={isUpdatingName}
                      className="h-8 w-8"
                      aria-label="Cancelar edição"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">
                      {formatUserNameWithId(user.name || 'Usuário', user.id)}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartEditName}
                      className="h-6 w-6"
                      aria-label="Editar nome"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email || 'Sem email'}</p>
              {displayRank > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Posição no Ranking: #{displayRank}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <AvatarSelector
        open={isAvatarSelectorOpen}
        onOpenChange={setIsAvatarSelectorOpen}
        currentEmail={user.email}
      />
    </>
  );
}

