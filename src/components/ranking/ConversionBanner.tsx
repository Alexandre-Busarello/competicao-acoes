'use client';

import { Sparkles, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import Link from 'next/link';

export function ConversionBanner() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-3 max-w-4xl">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-start gap-2 flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                <Sparkles className="h-3.5 w-3.5 inline-block mr-1.5 text-yellow-500" />
                Desbloqueie carteiras de todos os usuários e receba premiação dobrada nos prêmios anuais.{' '}
                <span className="text-muted-foreground">Ou entre agora e teste suas habilidades de investimento na prática com outros competidores, ganhando medalhas mensais</span>
              </p>
            </div>
          </div>
          <div className="flex items-stretch gap-2 w-full sm:w-auto sm:flex-shrink-0">
            <CheckoutCTA
              source="ranking_banner"
              buttonText="Tornar-se Membro Pro"
              size="sm"
              variant="default"
              className="flex-1 sm:flex-none min-w-0"
            />
            <Link href="/auth/login?signup=true" className="flex-1 sm:flex-none min-w-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Criar Conta
                <UserPlus className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




