'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, CheckCircle2, AlertCircle, Trophy, Sparkles, Lock, LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, syncSessionManager } from '@/lib/auth/client';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/lib/providers/ThemeProvider';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'magic-link' | 'password'>('magic-link');
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  
  // Logo combinada baseada no tema
  const logoPath = theme === 'dark' 
    ? '/logo-combinada-escuro.svg' 
    : '/logo-combinada-claro.svg';

  // Usar o singleton global de sincronização ao invés de refs locais
  // Isso garante que apenas uma sincronização ocorra por vez em toda a aplicação

  // Verificar se há erro na URL (ex: link expirado)
  useEffect(() => {
    const urlError = searchParams.get('error');
    const urlEmail = searchParams.get('email');
    const urlSignup = searchParams.get('signup');
    
    if (urlError === 'expired') {
      setError('O link de acesso expirou. Solicite um novo link abaixo.');
    } else if (urlError) {
      setError('Erro ao processar link de acesso. Tente solicitar um novo link.');
    }
    
    if (urlEmail) {
      setEmail(urlEmail);
    }
    
    // Se houver parâmetro signup na URL, abrir em modo criação de conta
    if (urlSignup === 'true') {
      setIsSignup(true);
      setLoginMethod('password'); // Criar conta requer senha
    }
  }, [searchParams]);

  // Se já estiver autenticado, redirecionar
  useEffect(() => {
    if (isAuthenticated) {
      const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/ranking';
      router.push(returnUrl);
    }
  }, [isAuthenticated, searchParams, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/ranking';
      window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar login com Google');
      setIsSubmitting(false);
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (loginMethod === 'password') {
        // Fazer login diretamente no cliente Supabase
        // Isso garante que a sessão seja salva no cliente
        // Se está em modo signup, tentar criar conta primeiro
        if (isSignup) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (signUpError) {
            // Se erro for que email já existe, tentar fazer login
            if (signUpError.message.includes('already registered') || 
                signUpError.message.includes('already exists') ||
                signUpError.message.includes('User already registered')) {
              // Tentar fazer login
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
              });

              if (signInError || !signInData.session) {
                throw new Error('Este email já está cadastrado. Faça login ou use acesso por email.');
              }

              console.log('Login successful, syncing session...');
              await syncSessionManager.sync(signInData.session, 'login-password');
              
              console.log('Updating session in React Query...');
              // Atualizar sessão no React Query
              queryClient.setQueryData(['auth', 'session'], signInData.session);
              
              // Aguardar um pouco para garantir que cookies foram salvos
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Invalidar query do usuário para que React Query busque automaticamente
              queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
              
              console.log('Login complete, redirecting...');
              const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/ranking';
              router.push(returnUrl);
              return;
            }
            
            throw new Error(signUpError.message || 'Erro ao criar conta');
          }

          if (!signUpData.user) {
            throw new Error('Erro ao criar conta. Tente novamente.');
          }

          // Se conta foi criada, fazer login automaticamente
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });

          if (signInError || !signInData.session) {
            // Se não conseguir fazer login imediatamente, pode precisar confirmar email
            throw new Error('Conta criada! Verifique seu email para confirmar antes de fazer login.');
          }

          console.log('Signup successful, syncing session...');
          await syncSessionManager.sync(signInData.session, 'signup-password');
          
          console.log('Updating session in React Query...');
          // Atualizar sessão no React Query
          queryClient.setQueryData(['auth', 'session'], signInData.session);
          
          // Aguardar um pouco para garantir que cookies foram salvos
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Invalidar query do usuário para que React Query busque automaticamente
          queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
          
          console.log('Signup complete, redirecting...');
          const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/ranking';
          router.push(returnUrl);
          return;
        }

        // Modo login normal
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (signInError) {
          // Se erro for que usuário não existe ou não tem senha, tentar criar conta
          if (signInError.message.includes('Invalid login credentials') || 
              signInError.message.includes('Email not confirmed')) {
            // Tentar criar conta via API
            const response = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                email: email.trim(),
                password: password,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Erro ao fazer login');
            }

            // Se conta foi criada, tentar login novamente
            if (data.success) {
              const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
              });

              if (retryError || !retrySignIn.session) {
                throw new Error('Conta criada, mas não foi possível fazer login. Tente novamente.');
              }

              console.log('Retry login successful, syncing session...');
              // Sincronizar sessão com servidor
              await syncSessionManager.sync(retrySignIn.session, 'login-retry');
              
              console.log('Updating session in React Query...');
              // Atualizar sessão no React Query
              queryClient.setQueryData(['auth', 'session'], retrySignIn.session);
              
              // Aguardar um pouco para garantir que cookies foram salvos
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Invalidar query do usuário para que React Query busque automaticamente
              queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
              
              console.log('Retry login complete, redirecting...');
              const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/ranking';
              router.push(returnUrl);
              return;
            }
          } else {
            throw new Error(signInError.message || 'Erro ao fazer login');
          }
        }

        if (!signInData.session) {
          throw new Error('Erro ao fazer login. Tente novamente.');
        }

        // Sincronizar sessão com servidor
        await syncSessionManager.sync(signInData.session, 'login-password');

        // Redirecionar após login bem-sucedido
        const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/ranking';
        router.push(returnUrl);
      } else {
        // Magic link
        const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/ranking';
        const response = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: email.trim(),
            returnUrl: returnUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao enviar magic link');
        }

        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src={logoPath}
              alt="Hold Arena" 
              width={200} 
              height={67}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl">
            {isSignup ? 'Criar Conta' : 'Acessar Plataforma'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isSignup 
              ? 'Crie sua conta gratuita e comece a competir agora mesmo'
              : 'Escolha uma forma de acesso ou crie sua conta gratuita'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                      Link de acesso enviado!
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Enviamos um link de acesso para <strong>{email}</strong>. 
                      Verifique sua caixa de entrada e clique no link para acessar a plataforma.
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground text-center space-y-2">
                <p>Não recebeu o email? Verifique sua caixa de spam.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full"
                >
                  Solicitar novo link
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}

              {/* Botão Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              {/* Tabs para escolher método */}
              <div className="flex gap-2 border-b">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('magic-link');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    loginMethod === 'magic-link'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Acesso por Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    loginMethod === 'password'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Email e Senha
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">           
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                {loginMethod === 'password' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full"
                      minLength={6}
                    />
                    {/* <p className="text-xs text-muted-foreground">
                      Se não tiver senha, use Magic Link ou{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignup(true);
                          setLoginMethod('password');
                          setError(null);
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        crie uma conta
                      </button>
                    </p> */}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !email.trim() || (loginMethod === 'password' && !password.trim())}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {loginMethod === 'password' 
                        ? (isSignup ? 'Criando conta...' : 'Entrando...') 
                        : 'Enviando link de acesso...'}
                    </>
                  ) : (
                    <>
                      {loginMethod === 'password' ? (
                        <>
                          {isSignup ? (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Logar ou Criar Conta
                            </>
                          ) : (
                            <>
                              <LogIn className="h-4 w-4 mr-2" />
                              Entrar
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Link de Acesso
                        </>
                      )}
                    </>
                  )}
                </Button>
                
                {loginMethod === 'password' && !isSignup && (
                  <p className="text-xs text-center text-muted-foreground">
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignup(true);
                        setError(null);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Criar conta gratuita
                    </button>
                  </p>
                )}
                
                {isSignup && (
                  <p className="text-xs text-center text-muted-foreground">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignup(false);
                        setError(null);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Fazer login
                    </button>
                  </p>
                )}

                {loginMethod === 'magic-link' && (
                  <div className="text-xs text-muted-foreground text-center">
                    <p>
                      Você receberá um email com um link de acesso seguro. 
                      Clique no link para entrar na plataforma sem precisar de senha.
                      O link expira em 1 hora.
                    </p>
                  </div>
                )}
              </form>
            </div>
          )}
          
          {/* CTA opcional de Upgrade para Premium */}
          {!success && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <h3 className="text-sm font-semibold">Torne-se Membro Pro</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Desbloqueie acesso completo às carteiras de outros competidores e funcionalidades exclusivas.
                    </p>
                    <CheckoutCTA
                      source="login_page"
                      buttonText="Tornar-se Membro Pro"
                      size="sm"
                      variant="outline"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Carregando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

