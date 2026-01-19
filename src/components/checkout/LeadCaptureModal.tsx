'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, AlertTriangle } from 'lucide-react';
import { redirectToKiwifyCheckout } from '@/lib/utils/checkout';
import { useAuth } from '@/lib/auth/client';
import { useConversionTracking } from '@/lib/hooks/useConversionTracking';

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
  title?: string;
  description?: string;
}

export function LeadCaptureModal({
  open,
  onOpenChange,
  source = 'checkout_cta',
  title = 'Torne-se Membro Pro',
  description = 'Torne-se Membro Pro e desbloqueie funcionalidades exclusivas',
}: LeadCaptureModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { trackClick } = useConversionTracking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMagicLinkSent(false);

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
      // Verificar status do lead
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          source,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação');
      }

      // Se lead já existe e é premium, enviar magic link
      if (data.action === 'send_magic_link') {
        try {
          const magicLinkResponse = await fetch('/api/auth/magic-link', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email.trim() }),
          });

          const magicLinkData = await magicLinkResponse.json();

          if (!magicLinkResponse.ok) {
            throw new Error(magicLinkData.error || 'Erro ao enviar magic link');
          }

          setMagicLinkSent(true);
          setIsSubmitting(false);
        } catch (magicLinkErr) {
          throw new Error(
            magicLinkErr instanceof Error
              ? magicLinkErr.message
              : 'Erro ao enviar link de acesso'
          );
        }
      } else {
        // Tracking de clique para eventos de conversão específicos
        if (source === 'blur_overlay' || source === 'profile_page' || source === 'signup_banner') {
          const eventType = source === 'blur_overlay' 
            ? 'blur_overlay' 
            : source === 'profile_page'
            ? 'profile_checkout'
            : 'signup_banner';
          await trackClick(eventType);
        }
        
        // Redirecionar para checkout Kiwify
        redirectToKiwifyCheckout(email.trim(), source);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setError(null);
    setMagicLinkSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {magicLinkSent ? (
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center justify-center p-6 gap-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Link de acesso enviado!</h3>
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de acesso para <strong>{email}</strong>. Verifique sua caixa de entrada e clique no link para acessar sua conta Pro.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Entendi
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nome (opcional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Aviso sobre email do Kiwify */}
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                      ⚠️ IMPORTANTE
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Use o mesmo email informado aqui (<strong>{email || 'seu email'}</strong>) no checkout do Kiwify para garantir que sua assinatura seja vinculada corretamente à sua conta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Continuar para Upgrade'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

