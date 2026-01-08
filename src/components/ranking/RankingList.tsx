'use client';

import { CompetitorCard } from './CompetitorCard';
import { EmptyRankingState } from './EmptyRankingState';
import type { Competitor } from '@/types';

interface RankingListProps {
  competitors: Competitor[];
}

export function RankingList({ competitors }: RankingListProps) {
  if (competitors.length === 0) {
    return <EmptyRankingState />;
  }

  return (
    <div className="pb-4">
      {competitors.map((competitor) => (
        <CompetitorCard key={competitor.id} competitor={competitor} />
      ))}
    </div>
  );
}

