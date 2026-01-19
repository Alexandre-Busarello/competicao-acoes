'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { useAuth } from '@/lib/auth/client';
import { useConversionTracking } from '@/lib/hooks/useConversionTracking';

interface BlurOverlayProps {
  competitorName: string;
}

export function BlurOverlay({ competitorName }: BlurOverlayProps) {
  const { user } = useAuth();
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
            trackView('blur_overlay');
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
    <div ref={overlayRef} className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent pb-20 pt-8 px-4">
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <Eye className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">
              Quer saber a estratégia completa do {competitorName}?
            </h3>
            <p className="text-sm text-muted-foreground">
              Torne-se Membro Pro e desbloqueie acesso completo a todas as carteiras, além de receber recompensa dobrada nos prêmios anuais
            </p>
          </div>
          <div className="space-y-3">
            <CheckoutCTA
              source="blur_overlay"
              buttonText="Tornar-se Membro Pro"
              size="lg"
              variant="default"
              className="w-full"
            />
            <Link href="/como-funciona">
              <Button variant="outline" className="w-full" size="sm">
                Entenda como funciona
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

