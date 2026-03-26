'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { redirectToCheckout } from '@/lib/utils/checkout';

interface EmailCaptureFormProps {
  source?: string;
  buttonText?: string;
  placeholder?: string;
  className?: string;
}

export function EmailCaptureForm({
  source = 'homepage',
  buttonText = 'Participar Agora',
  placeholder = 'Seu melhor email',
  className = '',
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Email inválido');
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar lead primeiro
      const leadResponse = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source,
        }),
      });

      const leadData = await leadResponse.json();

      if (!leadResponse.ok) {
        throw new Error(leadData.error || 'Erro ao processar solicitação');
      }

      // Se lead já existe e é premium, enviar magic link direto
      if (leadData.action === 'send_magic_link') {
        // Enviar magic link
        const magicLinkResponse = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            returnUrl: '/ranking',
          }),
        });

        const magicLinkData = await magicLinkResponse.json();

        if (!magicLinkResponse.ok) {
          throw new Error(magicLinkData.error || 'Erro ao enviar link de acesso');
        }

        // Redirecionar para página de confirmação
        window.location.href = `/auth/magic-link-sent?email=${encodeURIComponent(email.trim())}`;
        return;
      }

      // Para novos leads, enviar magic link também e redirecionar para confirmação
      // Isso permite que o usuário acesse a plataforma mesmo sem fazer checkout imediatamente
      const magicLinkResponse = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          returnUrl: '/ranking',
        }),
      });

      const magicLinkData = await magicLinkResponse.json();

      if (!magicLinkResponse.ok) {
        // Se falhar ao enviar magic link, ainda redirecionar para checkout
        redirectToCheckout(email.trim(), source);
        return;
      }

      // Redirecionar para página de confirmação
      window.location.href = `/auth/magic-link-sent?email=${encodeURIComponent(email.trim())}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={`flex items-center gap-2 text-success ${className}`}>
        <CheckCircle2 className="h-5 w-5" />
        <span>Redirecionando...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <Input
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isSubmitting}
        className="flex-1 min-w-0"
        required
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          buttonText
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-2 col-span-full">{error}</p>
      )}
    </form>
  );
}

