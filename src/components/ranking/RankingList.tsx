'use client';

import { CompetitorCard } from './CompetitorCard';
import type { Competitor } from '@/types';

interface RankingListProps {
  competitors: Competitor[];
}

export function RankingList({ competitors }: RankingListProps) {
  if (competitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-muted-foreground text-center">
          Nenhum competidor encontrado
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {competitors.map((competitor) => (
        <CompetitorCard key={competitor.id} competitor={competitor} />
      ))}
    </div>
  );
}

