'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Asset } from '@/types';
import { formatPrice, isUSDCurrency } from '@/lib/utils/currency';
import { getCategoryDisplayName } from '@/lib/data/etfs';

interface AssetListProps {
  assets: Asset[];
  isPremium: boolean;
  isOwner?: boolean;
}

export function AssetList({ assets, isPremium, isOwner = false }: AssetListProps) {
  const canView = isPremium || isOwner;
  
  // Verificar se um ativo é mockado (começa com MOCK)
  const isMockedAsset = (ticker: string) => ticker.startsWith('MOCK');
  
  return (
    <div className="container mx-auto px-4 py-4">
      <h2 className="text-lg font-semibold mb-4">Carteira</h2>
      <div className="space-y-3">
        {assets.map((asset, index) => {
          const isVisible = canView || asset.visible || index === 0;
          const isPositive = asset.return >= 0;
          const isMocked = isMockedAsset(asset.ticker);

          return (
            <Card
              key={asset.id}
              className={`relative overflow-hidden ${
                !isVisible ? 'blur-sm' : ''
              }`}
            >
              <CardContent className="p-4">
                {isMocked && !canView && (
                  <div className="mb-2 p-2 bg-muted/50 rounded-md border border-dashed border-muted-foreground/30">
                    <p className="text-xs text-muted-foreground text-center">
                      <strong>Ativo ofuscado:</strong> Este dado foi mockado para evitar acesso indevido. 
                      Torne-se Membro Pro para visualizar todos os ativos do portfólio.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{asset.ticker}</span>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        {asset.type === 'acao'
                          ? 'Ação'
                          : asset.type === 'fii'
                          ? 'FII'
                          : asset.type === 'etf'
                          ? asset.etfCategory
                            ? getCategoryDisplayName(asset.etfCategory)
                            : 'ETF'
                          : asset.type === 'renda-fixa'
                          ? 'RF'
                          : asset.type === 'cripto'
                          ? 'Cripto'
                          : 'Outros'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Qtd: {isVisible ? asset.quantity.toLocaleString('pt-BR') : '•••'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Preço Médio:</span>{' '}
                        <span className="font-semibold text-primary">
                          {isVisible
                            ? formatPrice(asset.averagePrice, asset.ticker)
                            : '•••'}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Preço Atual:</span>{' '}
                        <span className="font-semibold text-primary/80">
                          {isVisible
                            ? formatPrice(asset.currentPrice, asset.ticker)
                            : '•••'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={`font-bold ${
                          isPositive ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {isVisible
                          ? `${isPositive ? '+' : ''}${asset.return.toFixed(2)}%`
                          : '•••%'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isVisible
                        ? formatPrice(asset.currentPrice * asset.quantity, asset.ticker)
                        : '•••'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

