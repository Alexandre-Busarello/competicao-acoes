'use client';

import { useEffect } from 'react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { useRankingStore } from '@/lib/store/rankingStore';
import { initializeMockData } from '@/lib/mock-data';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setCompetitors, setBrunoPortfolio } = useRankingStore();

  useEffect(() => {
    // Inicializar dados mockados na primeira carga
    const { competitors, brunoPortfolio } = initializeMockData();
    setCompetitors(competitors);
    setBrunoPortfolio(brunoPortfolio);
  }, [setCompetitors, setBrunoPortfolio]);

  return (
    <div className="min-h-screen bg-background">
      <ServiceWorkerRegistration />
      <InstallPrompt />
      <main className="pb-16 md:pb-0 max-w-4xl mx-auto">{children}</main>
      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}

