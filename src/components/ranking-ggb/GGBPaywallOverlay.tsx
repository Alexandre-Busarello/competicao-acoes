'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { useConversionTracking } from '@/lib/hooks/useConversionTracking';

export function GGBPaywallOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const { trackView } = useConversionTracking();

  // Tracking de visualização via IntersectionObserver
  useEffect(() => {
    if (hasTrackedView || !overlayRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Registrar visualização quando 50% do overlay está visível
            trackView('ggb_ranking');
            setHasTrackedView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(overlayRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasTrackedView, trackView]);

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="border-primary/20 shadow-2xl max-w-md w-full mx-4">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">
              Ranking GGB Exclusivo para Membros Pro
            </h3>
            <p className="text-muted-foreground mb-4">
              Desbloqueie acesso completo ao ranking quantitativo baseado na metodologia GGB (Greenblatt-Graham-Bazin) e descubra as melhores oportunidades de investimento.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm font-medium mb-2">O que você terá acesso:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Tickers e empresas completas</li>
                <li>✓ Scores detalhados (Greenblatt, Graham, Bazin)</li>
                <li>✓ Breakdown completo de indicadores</li>
                <li>✓ Dados financeiros atualizados</li>
                <li>✓ Análise quantitativa profissional</li>
              </ul>
            </div>
          </div>
          <div className="space-y-3">
            <CheckoutCTA
              source="ggb_ranking"
              title="Torne-se Membro Pro"
              description="Desbloqueie o Ranking GGB completo e todas as funcionalidades exclusivas"
              buttonText="Desbloquear Ranking GGB"
              size="lg"
              variant="default"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

