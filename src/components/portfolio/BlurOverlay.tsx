'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Trophy } from 'lucide-react';
import Link from 'next/link';

interface BlurOverlayProps {
  competitorName: string;
}

export function BlurOverlay({ competitorName }: BlurOverlayProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent pb-20 pt-8 px-4">
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <Eye className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">
              Quer saber a estratégia completa do {competitorName}?
            </h3>
            <p className="text-sm text-muted-foreground">
              Faça upgrade para premium e desbloqueie acesso completo a todas as carteiras
            </p>
          </div>
          <div className="space-y-3">
            <Link href="/perfil?from=cta" className="block">
              <Button className="w-full" size="lg">
                <Trophy className="h-5 w-5 mr-2" />
                Fazer Upgrade para Premium
              </Button>
            </Link>
            <Link href="/perfil?from=cta">
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

