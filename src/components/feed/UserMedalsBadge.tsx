'use client';

import { Trophy, Medal, Award } from 'lucide-react';

interface UserMedalsBadgeProps {
  medals?: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
}

export function UserMedalsBadge({ medals }: UserMedalsBadgeProps) {
  // Se não há medalhas, usar valores padrão de 0
  const gold = medals?.gold ?? 0;
  const silver = medals?.silver ?? 0;
  const bronze = medals?.bronze ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" title={`${gold} medalha${gold !== 1 ? 's' : ''} de ouro`}>
        <Trophy className="h-3.5 w-3.5 text-warning flex-shrink-0" />
        <span className="text-xs font-semibold text-warning">{gold}</span>
      </div>
      <div className="flex items-center gap-0.5" title={`${silver} medalha${silver !== 1 ? 's' : ''} de prata`}>
        <Medal className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-400">{silver}</span>
      </div>
      <div className="flex items-center gap-0.5" title={`${bronze} medalha${bronze !== 1 ? 's' : ''} de bronze`}>
        <Award className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-amber-600">{bronze}</span>
      </div>
    </div>
  );
}

