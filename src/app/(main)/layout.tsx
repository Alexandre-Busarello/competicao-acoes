'use client';

import { BottomNav } from '@/components/navigation/BottomNav';
import { UserHeader } from '@/components/navigation/UserHeader';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ServiceWorkerRegistration />
      <InstallPrompt />
      <UserHeader />
      <main className="pb-16 md:pb-0 max-w-4xl mx-auto">{children}</main>
      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}

