'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function TestCreateUserPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
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
        throw new Error(data.error || 'Erro ao criar usuário de teste');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar se está em desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Acesso Restrito
            </CardTitle>
            <CardDescription>
              Esta página só está disponível em modo de desenvolvimento.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Teste de Criação de Usuário</CardTitle>
            <CardDescription>
              Simula o webhook do Kiwify para testar a criação de usuário localmente.
              Esta página só funciona em modo de desenvolvimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teste@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome (opcional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nome do Teste"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </p>
                </div>
              )}

              {result && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md space-y-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Usuário criado com sucesso!
                  </p>
                  <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                    <p><strong>ID:</strong> {result.user.id}</p>
                    <p><strong>Email:</strong> {result.user.email}</p>
                    <p><strong>Nome:</strong> {result.user.name}</p>
                    <p><strong>Premium:</strong> {result.user.isPremium ? 'Sim' : 'Não'}</p>
                    <p><strong>Status Assinatura:</strong> {result.subscription.status}</p>
                    {result.magicLinkSent && (
                      <p className="mt-2 text-green-600 dark:text-green-400">
                        ✅ Magic link enviado para o email
                      </p>
                    )}
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-200">
                    <p><strong>Próximos passos:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Verifique seu email para o magic link</li>
                      <li>Ou faça login diretamente com o email informado</li>
                      <li>O usuário já está marcado como premium</li>
                    </ul>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando usuário...
                  </>
                ) : (
                  'Criar Usuário de Teste'
                )}
              </Button>
            </form>

            <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Nota:</strong> Esta é uma ferramenta de desenvolvimento. 
                Ela cria um usuário real no banco de dados com assinatura ativa.
                Use apenas para testes locais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

