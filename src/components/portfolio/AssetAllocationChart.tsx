'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Asset } from '@/types';
import { getCategoryDisplayName } from '@/lib/data/etfs';

interface AssetAllocationChartProps {
  assets: Asset[];
}

const COLORS = {
  acao: '#3b82f6',
  fii: '#10b981',
  // Cores para categorias de ETFs
  'etf-acoes': '#06b6d4',
  'etf-crypto': '#f97316',
  'etf-commodities': '#f59e0b',
  'etf-dividendos': '#10b981',
  'etf-internacional': '#3b82f6',
  'etf-setorial': '#8b5cf6',
  'etf-sustentabilidade': '#10b981',
  'etf-renda-fixa': '#f59e0b',
  // Fallback para ETFs sem categoria
  etf: '#06b6d4',
  'renda-fixa': '#f59e0b',
  cripto: '#f97316',
  outros: '#8b5cf6',
};

export function AssetAllocationChart({ assets }: AssetAllocationChartProps) {
  // Calcular alocação por tipo e categoria (para ETFs)
  const allocation = assets.reduce(
    (acc, asset) => {
      const value = asset.currentPrice * asset.quantity;
      
      // Para ETFs, usar categoria específica se disponível
      let key: string;
      if (asset.type === 'etf' && asset.etfCategory) {
        key = `etf-${asset.etfCategory}`;
      } else {
        key = asset.type;
      }
      
      if (!acc[key]) {
        acc[key] = { name: key, value: 0, originalType: asset.type };
      }
      acc[key].value += value;
      return acc;
    },
    {} as Record<string, { name: string; value: number; originalType: string }>
  );

  const data = Object.values(allocation).map((item) => {
    let displayName: string;
    
    if (item.name.startsWith('etf-')) {
      // Extrair categoria do ETF
      const category = item.name.replace('etf-', '') as 'acoes' | 'crypto' | 'commodities' | 'dividendos' | 'internacional' | 'setorial' | 'sustentabilidade' | 'renda-fixa';
      displayName = getCategoryDisplayName(category);
    } else {
      displayName =
        item.name === 'acao'
          ? 'Ações'
          : item.name === 'fii'
          ? 'FIIs'
          : item.name === 'etf'
          ? 'ETFs'
          : item.name === 'renda-fixa'
          ? 'Renda Fixa'
          : item.name === 'cripto'
          ? 'Criptomoedas'
          : 'Outros';
    }
    
    return {
      name: displayName,
      value: Number(item.value.toFixed(2)),
      originalKey: item.name,
    };
  });

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0',
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-lg font-semibold mb-4">Alocação de Ativos</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithPercentage.map((entry, index) => {
              const colorKey = entry.originalKey as keyof typeof COLORS;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[colorKey] || COLORS.outros}
                />
              );
            })}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              `R$ ${value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

