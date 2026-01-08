'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Mail } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Compra Confirmada!</CardTitle>
          <CardDescription className="text-base mt-2">
            Sua compra foi processada com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Verifique seu email
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Enviamos um link de acesso para seu email. Clique no link para acessar a
                  plataforma e começar a usar todas as funcionalidades premium.
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            <p>Não recebeu o email? Verifique sua caixa de spam.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

