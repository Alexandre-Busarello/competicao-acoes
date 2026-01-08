'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentPeriod } from '@/lib/utils/period-utils';

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    // Redirecionar para período vigente (mensal)
    const current = getCurrentPeriod();
    router.replace(`/carteira/${id}/mensal/${current.year}/${current.month.toString().padStart(2, '0')}`);
  }, [id, router]);

  return null;
}

