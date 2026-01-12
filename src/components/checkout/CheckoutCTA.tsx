'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LeadCaptureModal } from './LeadCaptureModal';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';
import { redirectToKiwifyCheckout } from '@/lib/utils/checkout';

interface CheckoutCTAProps {
  source?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  useModal?: boolean; // Se true, usa modal quando não autenticado. Se false ou undefined, redireciona para signup
}

export function CheckoutCTA({
  source = 'checkout_cta',
  title = 'Torne-se Membro Pro',
  description = 'Desbloqueie funcionalidades exclusivas, acesse todas as carteiras e receba premiação dobrada nos prêmios anuais',
  buttonText = 'Tornar-se Membro Pro',
  variant = 'default',
  size = 'default',
  className,
  useModal = false,
}: CheckoutCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const handleClick = () => {
    // Se usuário estiver logado, usar email da conta e pular modal
    if (isAuthenticated && user?.email) {
      // Criar lead se necessário e redirecionar direto para checkout
      fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email.trim(),
          name: user.name || undefined,
          source,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Se lead já existe e é premium, não fazer nada (ou mostrar mensagem)
          if (data.action === 'send_magic_link') {
            // Usuário já é premium, não precisa fazer checkout
            return;
          }
          // Redirecionar para checkout com email do usuário logado
          redirectToKiwifyCheckout(user.email, source);
        })
        .catch((error) => {
          console.error('Error creating lead:', error);
          // Mesmo com erro, redirecionar para checkout
          redirectToKiwifyCheckout(user.email, source);
        });
    } else {
      // Usuário não logado
      if (useModal) {
        // Usar modal para capturar email
        setIsModalOpen(true);
      } else {
        // Redirecionar para página de criação de conta
        window.location.href = '/auth/login?signup=true';
      }
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
      >
        <Lock className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>
      {useModal && (
        <LeadCaptureModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          source={source}
          title={title}
          description={description}
        />
      )}
    </>
  );
}

