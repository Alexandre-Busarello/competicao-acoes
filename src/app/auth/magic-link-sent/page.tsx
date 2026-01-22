'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function MagicLinkSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle2 className="h-16 w-16 text-success" />
              <Mail className="h-8 w-8 text-primary absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
            </div>
          </div>
          <CardTitle className="text-2xl">Link de Acesso Enviado!</CardTitle>
          <CardDescription className="text-base mt-2">
            Enviamos um link de acesso para seu email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">Email:</p>
              <p className="text-sm font-medium">{email}</p>
            </div>
          )}
          
          <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Verifique sua caixa de entrada
                </p>
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de acesso para seu email. Clique no link para acessar a plataforma e começar a competir no ranking.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Próximos passos:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Verifique sua caixa de entrada (e spam)</li>
                <li>Clique no link de acesso no email</li>
                <li>Comece a competir no ranking!</li>
              </ol>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Não recebeu o email? Verifique sua caixa de spam ou{' '}
                <Link href="/auth/login" className="underline hover:text-foreground">
                  solicite um novo link
                </Link>
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para a página inicial
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MagicLinkSentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <MagicLinkSentContent />
    </Suspense>
  );
}

