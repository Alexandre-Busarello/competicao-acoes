'use client';

import { Suspense } from 'react';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function NotificationSettingsContent() {
  return (
    <div className="min-h-screen pb-4">
      <div className="container mx-auto px-4 py-4">
        <Link href="/perfil">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Perfil
          </Button>
        </Link>
        <div className="max-w-2xl mx-auto">
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
}

export default function NotificationSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pb-4">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    }>
      <NotificationSettingsContent />
    </Suspense>
  );
}

