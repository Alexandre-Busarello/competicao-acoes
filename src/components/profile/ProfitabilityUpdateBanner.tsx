'use client';

import { useQuery } from '@tanstack/react-query';
import { ProfitabilityUpdateIndicator } from './ProfitabilityUpdateIndicator';
import { Card, CardContent } from '@/components/ui/card';

interface ProfitabilityUpdateBannerProps {
  userId: string;
}

export function ProfitabilityUpdateBanner({ userId }: ProfitabilityUpdateBannerProps) {
  const { data: profitabilityData } = useQuery({
    queryKey: ['perpetual-profitability', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/perpetual-profitability`);
      if (!response.ok) throw new Error('Failed to fetch profitability');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (!profitabilityData?.lastUpdated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-2 sm:py-3 max-w-4xl">
      <Card className="border-muted/50 bg-muted/30">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center justify-center">
            <ProfitabilityUpdateIndicator lastUpdated={profitabilityData.lastUpdated} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



