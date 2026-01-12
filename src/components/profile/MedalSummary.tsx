'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useProfileUrl } from '@/lib/hooks/use-profile-url';

interface MedalSummaryProps {
  userId: string;
}

export function MedalSummary({ userId }: MedalSummaryProps) {
  const profileUrl = useProfileUrl(userId);
  const { data, isLoading } = useQuery({
    queryKey: ['user-medals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/medals`);
      if (!response.ok) throw new Error('Failed to fetch medals');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { monthly, annual, total } = data;

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <CardTitle className="text-lg">Medalhas</CardTitle>
        <Link href={`${profileUrl}/medalhas`}>
          <button className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
            Ver todas
            <ExternalLink className="h-3 w-3" />
          </button>
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-warning mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {total.gold}
            </p>
            <p className="text-xs text-muted-foreground">Ouros</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
            <Medal className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">
              {total.silver}
            </p>
            <p className="text-xs text-muted-foreground">Pratas</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Award className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {total.bronze}
            </p>
            <p className="text-xs text-muted-foreground">Bronzes</p>
          </div>
        </div>
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-muted-foreground mb-0.5 sm:mb-1">Mensais</p>
            <p className="font-semibold">
              {monthly.total} medalhas
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 sm:mb-1">Anuais</p>
            <p className="font-semibold">
              {annual.total} medalhas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

