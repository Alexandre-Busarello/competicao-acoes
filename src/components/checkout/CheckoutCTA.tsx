'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LeadCaptureModal } from './LeadCaptureModal';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';
import { redirectToCheckout } from '@/lib/utils/checkout';
import { useConversionTracking } from '@/lib/hooks/useConversionTracking';

interface CheckoutCTAProps {
  source?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CheckoutCTA({
  source = 'checkout_cta',
  title = 'Torne-se Membro Pro',
  description = 'Desbloqueie funcionalidades exclusivas, acesse todas as carteiras e receba premiação dobrada nos prêmios anuais',
  buttonText = 'Tornar-se Membro Pro',
  variant = 'default',
  size = 'default',
  className,
}: CheckoutCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { trackClick } = useConversionTracking();

  const handleClick = async () => {
    // Tracking de clique para eventos de conversão específicos
    let eventId: string | null = null;
    if (source === 'blur_overlay' || source === 'profile_page' || source === 'signup_banner' || source === 'ggb_ranking' || source === 'fii_ranking') {
      const eventType = source === 'blur_overlay' 
        ? 'blur_overlay' 
        : source === 'profile_page'
        ? 'profile_checkout'
        : source === 'signup_banner'
        ? 'signup_banner'
        : source === 'fii_ranking'
        ? 'fii_ranking'
        : 'ggb_ranking';
      eventId = await trackClick(eventType);
    }

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
          redirectToCheckout(user.email, source);
        })
        .catch((error) => {
          console.error('Error creating lead:', error);
          // Mesmo com erro, redirecionar para checkout
          redirectToCheckout(user.email, source);
        });
    } else {
      // Usuário não logado - sempre usar modal para capturar email
      setIsModalOpen(true);
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
      <LeadCaptureModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        source={source}
        title={title}
        description={description}
      />
    </>
  );
}

