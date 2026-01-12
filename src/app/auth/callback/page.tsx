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
        console.log('=== Auth Callback Processing ===');
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);
        
        // Verificar se há erro na query string primeiro
        const urlError = searchParams.get('error');
        if (urlError) {
          console.error('Error in URL:', urlError);
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
        
        console.log('Tokens in hash:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          errorParam 
        });

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

          // Criar usuário no banco se não existir
          try {
            await fetch('/api/auth/create-user-if-needed', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                authUserId: sessionData.session.user.id,
                email: sessionData.session.user.email,
                name: sessionData.session.user.user_metadata?.name,
              }),
            });
          } catch (createUserError) {
            console.warn('Error creating user if needed:', createUserError);
            // Continuar mesmo se falhar
          }

          // Sincronização será feita pelo hook useAuth via onAuthStateChange
          // Não precisamos sincronizar manualmente aqui para evitar duplicação

          // Limpar hash da URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          
          // Aguardar um pouco para garantir que a sessão foi salva e sincronizada
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar se a sessão ainda está ativa antes de redirecionar
          const { data: { session: verifySession } } = await supabase.auth.getSession();
          if (!verifySession) {
            setError('Sessão não foi salva corretamente. Tente solicitar um novo link.');
            setIsProcessing(false);
            return;
          }

          console.log('Session verified, redirecting...');
          
          // Redirecionar para returnUrl, redirect ou next (prioridade nesta ordem)
          const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || searchParams.get('next') || '/ranking';
          router.push(returnUrl);
        } else {
          // Tentar obter sessão atual (pode ter sido processada automaticamente pelo Supabase)
          // Isso pode acontecer se o Supabase detectou automaticamente a sessão na URL
          // O Supabase client tem detectSessionInUrl: true, então pode processar automaticamente
          console.log('No tokens in hash, waiting for Supabase auto-detection...');
          
          // Aguardar um pouco para o Supabase processar automaticamente (se detectSessionInUrl estiver ativo)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            setError('Erro ao processar link de acesso. Tente solicitar um novo link.');
            setIsProcessing(false);
            return;
          }

          if (!session) {
            // Tentar processar tokens da query string (caso o Supabase tenha redirecionado diferente)
            const queryToken = searchParams.get('access_token');
            const queryRefresh = searchParams.get('refresh_token');
            
            if (queryToken && queryRefresh) {
              console.log('Found tokens in query string, processing...');
              const { data: sessionData, error: sessionSetError } = await supabase.auth.setSession({
                access_token: queryToken,
                refresh_token: queryRefresh,
              });

              if (sessionSetError || !sessionData.session) {
                setError('Erro ao processar link de acesso. Tente solicitar um novo link.');
                setIsProcessing(false);
                return;
              }

              // Criar usuário no banco se não existir
              try {
                await fetch('/api/auth/create-user-if-needed', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    authUserId: sessionData.session.user.id,
                    email: sessionData.session.user.email,
                    name: sessionData.session.user.user_metadata?.name,
                  }),
                });
              } catch (createUserError) {
                console.warn('Error creating user if needed:', createUserError);
              }

              // Sincronização será feita automaticamente pelo hook useAuth via onAuthStateChange
              // Não precisamos sincronizar manualmente aqui para evitar duplicação

              // Limpar query string e redirecionar
              window.history.replaceState(null, '', window.location.pathname);
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Redirecionar para returnUrl, redirect ou next (prioridade nesta ordem)
              const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || searchParams.get('next') || '/ranking';
              router.push(returnUrl);
              return;
            }

            setError('Nenhuma sessão encontrada. Tente solicitar um novo link.');
            setIsProcessing(false);
            return;
          }

          console.log('Session found:', session.user.email);

          // Criar usuário no banco se não existir
          try {
            await fetch('/api/auth/create-user-if-needed', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                authUserId: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name,
              }),
            });
          } catch (createUserError) {
            console.warn('Error creating user if needed:', createUserError);
          }

          // Sincronização será feita pelo hook useAuth via onAuthStateChange
          // Não precisamos sincronizar manualmente aqui para evitar duplicação

          // Limpar hash da URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          
          // Aguardar sincronização
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Redirecionar para returnUrl, redirect ou next (prioridade nesta ordem)
          const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || searchParams.get('next') || '/ranking';
          router.push(returnUrl);
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
