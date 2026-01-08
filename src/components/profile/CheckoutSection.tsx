'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Trophy, Eye, Star } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useAuth } from '@/lib/auth/client';
import { useState } from 'react';
import { SHOW_MIC_METHOD } from '@/lib/config/features';
import { redirectToKiwifyCheckout } from '@/lib/utils/checkout';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';

export function CheckoutSection() {
  const { user } = useUserStore();
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = () => {
    setIsProcessing(true);
    redirectToKiwifyCheckout(user?.email, 'profile');
  };

  return (
    <Card className="mx-4 mt-4 border-primary/20">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Entre para a Elite dos Investidores</h2>
          <p className="text-muted-foreground">
            Desbloqueie acesso completo e participe dos prêmios mensais
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
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Participar do Ranking valendo Prêmios</p>
              <p className="text-sm text-muted-foreground">
                Compita por prêmios mensais e mostre suas habilidades
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold">R$ 29,90</p>
            <p className="text-sm text-muted-foreground">por mês</p>
          </div>
          {!isAuthenticated ? (
            // Se não estiver autenticado, usar CheckoutCTA que abre modal
            <CheckoutCTA
              source="profile_page"
              buttonText="Assinar Agora"
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
              {isProcessing ? 'Processando...' : 'Assinar Agora'}
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground mt-3">
            Cancele a qualquer momento. Sem compromisso.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

