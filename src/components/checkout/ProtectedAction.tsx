'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/client';
import { CheckoutCTA } from './CheckoutCTA';
import { Loader2 } from 'lucide-react';

interface ProtectedActionProps {
  children: ReactNode;
  source?: string;
  fallback?: ReactNode;
  showCTA?: boolean;
  ctaText?: string;
}

export function ProtectedAction({
  children,
  source = 'protected_action',
  fallback,
  showCTA = true,
  ctaText,
}: ProtectedActionProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !user.isPremium) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showCTA) {
      return (
        <div className="flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-muted-foreground text-center">
            Esta funcionalidade requer assinatura premium.
          </p>
          <CheckoutCTA source={source} buttonText={ctaText} />
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

