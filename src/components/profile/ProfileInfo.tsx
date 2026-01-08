'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/store/userStore';
import { useRankingStore } from '@/lib/store/rankingStore';
import { formatUserNameWithId, getNameWithoutId } from '@/lib/utils/format-user-name';
import { AvatarSelector } from './AvatarSelector';
import { Pencil } from 'lucide-react';

export function ProfileInfo() {
  const { user } = useUserStore();
  const { competitors } = useRankingStore();
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);

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
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsAvatarSelectorOpen(true)}
                aria-label="Alterar avatar"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {formatUserNameWithId(user.name || 'Usuário', user.id)}
              </h2>
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

