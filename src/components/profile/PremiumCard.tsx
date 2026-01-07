'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Crown, Check } from 'lucide-react';

export function PremiumCard() {
  return (
    <Card className="mx-4 mt-4 border-yellow-300 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 dark:from-yellow-950/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="h-6 w-6 text-yellow-500" />
          <div>
            <h3 className="text-lg font-bold">Conta Premium</h3>
            <p className="text-sm text-muted-foreground">Acesso completo ativado</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Acesso a todas as carteiras</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Carteira oficial do Bruno</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Participação nos prêmios</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

