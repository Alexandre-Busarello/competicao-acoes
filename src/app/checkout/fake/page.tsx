'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/navigation/PageHeader';

export default function FakeKiwifyCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      // Chamar webhook de teste para simular o checkout
      const response = await fetch('/api/webhooks/kiwify/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar checkout');
      }

      // Redirecionar para página de sucesso
      router.push('/checkout/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar checkout');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-4">
      <PageHeader title="Checkout" backHref="/ranking" />
      
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                Modo de Simulação
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Esta é uma página de simulação do checkout Kiwify. A URL do Kiwify não está configurada. 
                Você pode testar o fluxo completo de cadastro e compra aqui.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Checkout</CardTitle>
            </div>
            <CardDescription>
              Complete seu cadastro para acessar todas as funcionalidades premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isProcessing}
                    placeholder="seu@email.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="name">Nome (opcional)</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Seu nome"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plano Premium</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Período</span>
                  <span>30 dias (teste)</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>R$ 0,00</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing || !email.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar Compra
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Pagamento seguro e simulado</span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Esta é uma simulação. Nenhum pagamento real será processado.
          </p>
        </div>
      </div>
    </div>
  );
}

