'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/client';
import { redirectToKiwifyCheckout } from '@/lib/utils/checkout';
import { Sparkles, TrendingUp, Lock, Award, Zap } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';

interface FeedBannerProps {
  banner: {
    id: string;
    variation: string;
    title: string;
    description: string;
    benefit: string;
    ctaText: string;
  };
}

const BANNER_VARIANTS = {
  A: {
    icon: Lock,
    gradient: 'from-blue-500 to-purple-600',
    bgGradient: 'from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30',
  },
  B: {
    icon: Award,
    gradient: 'from-yellow-500 to-orange-600',
    bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30',
  },
  C: {
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  },
  D: {
    icon: Sparkles,
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
  },
  E: {
    icon: Zap,
    gradient: 'from-indigo-500 to-violet-600',
    bgGradient: 'from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30',
  },
};

export function FeedBanner({ banner }: FeedBannerProps) {
  const { user, isAuthenticated } = useAuth();
  const { user: userStore } = useUserStore();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Não mostrar banner para usuários PRO (verificar tanto no auth quanto no store)
  const isPremium = userStore?.isPremium || user?.isPremium || false;

  // Tracking de impressão via IntersectionObserver
  // IMPORTANTE: Hooks devem ser chamados antes de qualquer early return
  useEffect(() => {
    // Não fazer tracking se for premium ou já foi rastreado
    if (isPremium || hasTrackedImpression || !bannerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Registrar impressão quando 50% do banner está visível
            fetch(`/api/feed/banners/${banner.id}/track`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'impression',
                userId: user?.id || null,
              }),
            }).catch((error) => {
              console.error('Error tracking impression:', error);
            });

            setHasTrackedImpression(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(bannerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [banner.id, user?.id, hasTrackedImpression, isPremium]);

  // Early return após todos os hooks
  if (isPremium) {
    return null;
  }

  const handleClick = async () => {
    if (isClicking) return;
    setIsClicking(true);

    try {
      // Registrar clique primeiro
      const clickResponse = await fetch(`/api/feed/banners/${banner.id}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'click',
          userId: user?.id || null,
        }),
      });

      const clickData = await clickResponse.json();
      const bannerClickId = clickData.bannerClickId || null;

      // Se usuário estiver logado, criar/atualizar lead com bannerClickId
      if (isAuthenticated && user?.email) {
        try {
          const leadResponse = await fetch('/api/leads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email.trim(),
              name: user.name || undefined,
              source: `feed_banner_${banner.variation}`,
              bannerClickId,
            }),
          });

          const leadData = await leadResponse.json();
          if (leadData.action === 'send_magic_link') {
            // Usuário já é premium
            setIsClicking(false);
            return;
          }
        } catch (leadError) {
          console.error('Error creating lead:', leadError);
          // Continuar mesmo com erro no lead
        }
      }

      // Redirecionar para checkout
      redirectToKiwifyCheckout(
        user?.email,
        `feed_banner_${banner.variation}`
      );
    } catch (error) {
      console.error('Error handling banner click:', error);
      setIsClicking(false);
      // Mesmo com erro, redirecionar para checkout
      redirectToKiwifyCheckout(
        user?.email,
        `feed_banner_${banner.variation}`
      );
    }
  };

  const variant = BANNER_VARIANTS[banner.variation as keyof typeof BANNER_VARIANTS] || BANNER_VARIANTS.A;
  const Icon = variant.icon;

  return (
    <div ref={bannerRef} className="w-full px-1 py-2">
      <Card
        className={`
          relative overflow-hidden border-2
          bg-gradient-to-br ${variant.bgGradient}
          border-primary/20 hover:border-primary/40
          transition-all duration-300
          hover:shadow-lg hover:scale-[1.02]
          cursor-pointer
          group
        `}
        onClick={handleClick}
      >
        <div className="relative p-4 md:p-6">
          {/* Decorative gradient overlay */}
          <div
            className={`
              absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48
              bg-gradient-to-br ${variant.gradient}
              opacity-10 rounded-full blur-3xl
              group-hover:opacity-20 transition-opacity
            `}
          />

          {/* Content */}
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon */}
            <div
              className={`
                flex-shrink-0 w-12 h-12 md:w-16 md:h-16
                rounded-full bg-gradient-to-br ${variant.gradient}
                flex items-center justify-center
                shadow-lg group-hover:scale-110 transition-transform
              `}
            >
              <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-foreground mb-1">
                {banner.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-2">
                {banner.description}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`
                    inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold
                    bg-gradient-to-r ${variant.gradient} text-white
                  `}
                >
                  {banner.benefit}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              className={`
                flex-shrink-0
                bg-gradient-to-r ${variant.gradient}
                hover:opacity-90
                text-white border-0
                shadow-lg group-hover:shadow-xl
                transition-all
                ${isClicking ? 'opacity-70 cursor-wait' : ''}
              `}
              size="lg"
              disabled={isClicking}
            >
              {isClicking ? 'Redirecionando...' : banner.ctaText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

