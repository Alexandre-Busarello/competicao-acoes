'use client';

import { Suspense } from 'react';
import { InternalNotifications } from '@/components/notifications/InternalNotifications';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';

function NotificationsContent() {
  return (
    <div className="min-h-screen pb-4">
      <div className="container mx-auto px-4 py-4">
        <Link href="/perfil">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Notificações</h1>
          <InternalNotifications limit={100} showHeader={false} />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}


















