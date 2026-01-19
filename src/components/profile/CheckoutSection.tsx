'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Trophy, Eye, Star, AlertTriangle, Gift } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useAuth } from '@/lib/auth/client';
import { SHOW_MIC_METHOD } from '@/lib/config/features';
import { redirectToKiwifyCheckout } from '@/lib/utils/checkout';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { useConversionTracking } from '@/lib/hooks/useConversionTracking';

export function CheckoutSection() {
  const { user } = useUserStore();
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const { trackView, trackClick } = useConversionTracking();

  // Tracking de visualização via IntersectionObserver
  useEffect(() => {
    if (hasTrackedView || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Registrar visualização quando 50% da seção está visível
            trackView('profile_checkout');
            setHasTrackedView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasTrackedView, trackView]);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    
    // Tracking de clique
    await trackClick('profile_checkout');
    
    redirectToKiwifyCheckout(user?.email, 'profile');
  };

  return (
    <Card ref={sectionRef} className="mx-4 mt-4 border-primary/20">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Torne-se Membro Pro</h2>
          <p className="text-muted-foreground">
            Desbloqueie funcionalidades exclusivas e acesse carteiras completas
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Ver carteira completa de todos os competidores</p>
              <p className="text-sm text-muted-foreground">
                Acesse todos os ativos e estratégias dos melhores investidores
              </p>
            </div>
          </div>

          {SHOW_MIC_METHOD && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-semibold">Ver carteira oficial do Bruno Chimarelli</p>
                <p className="text-sm text-muted-foreground">
                  Acesse a estratégia completa e atualizada do especialista
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Gift className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-semibold">Premiação dobrada no ranking anual</p>
              <p className="text-sm text-muted-foreground">
                Membros Pro recebem o dobro do prêmio em dinheiro nas premiações anuais (Top 3)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-semibold">Elegível para prêmios anuais em dinheiro</p>
              <p className="text-sm text-muted-foreground">
                Participe do ranking anual e concorra a prêmios em dinheiro + medalhas exclusivas
              </p>
            </div>
          </div>

        </div>

        <div className="border-t border-border pt-6">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold">R$ 9,99</p>
            <p className="text-sm text-muted-foreground">por mês</p>
          </div>

          {/* Aviso sobre email do Kiwify quando autenticado */}
          {isAuthenticated && user?.email && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    ⚠️ IMPORTANTE
                  </p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    No checkout do Kiwify, use o mesmo email da sua conta (<strong>{user.email}</strong>) para garantir que sua assinatura seja vinculada corretamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated ? (
            // Se não estiver autenticado, usar CheckoutCTA que abre modal
            <CheckoutCTA
              source="profile_page"
              buttonText="Tornar-se Membro Pro"
              size="lg"
              variant="default"
              className="w-full"
            />
          ) : (
            // Se estiver autenticado, usar redirecionamento direto
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubscribe}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Tornar-se Membro Pro'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

