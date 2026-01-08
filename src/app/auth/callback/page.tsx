'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verificar se há erro na query string primeiro
        const urlError = searchParams.get('error');
        if (urlError) {
          setError('Erro ao processar link de acesso. Tente solicitar um novo link.');
          setIsProcessing(false);
          return;
        }

        // Verificar se há tokens no hash da URL (Supabase envia tokens no hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam || 'Erro ao processar link de acesso.');
          setIsProcessing(false);
          return;
        }

        if (accessToken && refreshToken) {
          console.log('Processing tokens from hash...');
          
          // Definir sessão manualmente usando os tokens do hash
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            setError('Erro ao processar link de acesso. Tente solicitar um novo link.');
            setIsProcessing(false);
            return;
          }

          if (!sessionData.session) {
            setError('Erro ao criar sessão. Tente solicitar um novo link.');
            setIsProcessing(false);
            return;
          }

          console.log('Session set successfully:', sessionData.session.user.email);

          // Nota: A sincronização com cookies será feita automaticamente pelo hook useAuth()
          // através do onAuthStateChange que será disparado pelo setSession()

          // Limpar hash da URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          
          // Aguardar um pouco para garantir que a sessão foi salva
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Redirecionar para ranking
          const next = searchParams.get('next') || '/ranking';
          router.push(next);
        } else {
          // Tentar obter sessão atual (pode ter sido processada automaticamente pelo Supabase)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            setError('Erro ao processar link de acesso. Tente solicitar um novo link.');
            setIsProcessing(false);
            return;
          }

          if (!session) {
            setError('Nenhuma sessão encontrada. Tente solicitar um novo link.');
            setIsProcessing(false);
            return;
          }

          console.log('Session found:', session.user.email);

          // Limpar hash da URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          
          // Redirecionar para ranking
          const next = searchParams.get('next') || '/ranking';
          router.push(next);
        }
      } catch (err) {
        console.error('Error in callback:', err);
        setError('Erro ao processar link de acesso. Tente solicitar um novo link.');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Erro ao Acessar</CardTitle>
            <CardDescription className="text-base mt-2">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Solicitar Novo Link
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/ranking')}
                className="w-full"
              >
                Voltar ao Ranking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          </div>
          <CardTitle className="text-2xl">Processando Acesso</CardTitle>
          <CardDescription className="text-base mt-2">
            Aguarde enquanto processamos seu link de acesso...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Processando Acesso</CardTitle>
            <CardDescription className="text-base mt-2">
              Aguarde enquanto processamos seu link de acesso...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
