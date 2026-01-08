'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LeadCaptureModal } from './LeadCaptureModal';
import { Sparkles, Lock } from 'lucide-react';

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
  title = 'Acesso Premium',
  description = 'Para acessar esta funcionalidade, você precisa fazer checkout.',
  buttonText = 'Fazer Checkout',
  variant = 'default',
  size = 'default',
  className,
}: CheckoutCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
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

