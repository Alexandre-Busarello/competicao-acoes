'use client';

import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import Link from 'next/link';

export function ConversionBanner() {
  return (
    <div className="container mx-auto px-4 py-3 max-w-4xl">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 inline-block mr-1.5 text-yellow-500" />
                Comece a pontuar agora e participe da comunidade e prêmios
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <CheckoutCTA
              source="ranking_banner"
              buttonText="Participar"
              size="sm"
              variant="default"
              className="flex-1 sm:flex-none"
            />
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                Entrar
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




