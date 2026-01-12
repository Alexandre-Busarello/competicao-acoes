'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Crown, Check } from 'lucide-react';
import { SHOW_MIC_METHOD } from '@/lib/config/features';

export function PremiumCard() {
  return (
    <Card className="mx-4 mt-4 border-warning/30 dark:border-warning/50 bg-gradient-to-br from-warning/10 dark:from-warning/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="h-6 w-6 text-warning" />
          <div>
            <h3 className="text-lg font-bold">Conta Premium</h3>
            <p className="text-sm text-muted-foreground">Acesso completo ativado</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-success" />
            <span>Acesso a todas as carteiras</span>
          </div>
          {SHOW_MIC_METHOD && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-success" />
              <span>Carteira oficial do Bruno</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-success" />
            <span>Elegível para prêmios anuais em dinheiro</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

