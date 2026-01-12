'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      router.push('/ranking');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <WifiOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Você está offline</h2>
            <p className="text-muted-foreground mb-6">
              Parece que você perdeu a conexão com a internet. Verifique sua conexão e tente novamente.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Algumas funcionalidades podem continuar funcionando offline usando dados salvos localmente.
            </p>
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/ranking')} 
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir para Ranking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

