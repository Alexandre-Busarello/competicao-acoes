'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentPeriod } from '@/lib/utils/period-utils';

export default function RankingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para período vigente (mensal)
    const current = getCurrentPeriod();
    router.replace(`/ranking/mensal/${current.year}/${current.month.toString().padStart(2, '0')}`);
  }, [router]);

  return null;
}

