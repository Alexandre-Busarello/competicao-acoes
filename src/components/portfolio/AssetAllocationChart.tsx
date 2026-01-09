'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Asset } from '@/types';
import { getCategoryDisplayName } from '@/lib/data/etfs';

interface AssetAllocationChartProps {
  assets: Asset[];
}

// Paleta de cores baseada no brandbook HOLDARENA (#00c219 verde primário)
// Usando variações do verde e cores complementares que harmonizam
const COLORS = {
  acao: '#00c219', // Verde primário do brand
  fii: '#00a017', // Verde mais escuro
  // Cores para categorias de ETFs - variações do verde e cores complementares
  'etf-acoes': '#00c219', // Verde primário
  'etf-crypto': '#ff6b35', // Laranja vibrante
  'etf-commodities': '#ffa500', // Laranja/amarelo
  'etf-dividendos': '#00a017', // Verde escuro
  'etf-internacional': '#00d624', // Verde mais claro
  'etf-setorial': '#7c3aed', // Roxo que harmoniza
  'etf-sustentabilidade': '#00a017', // Verde escuro
  'etf-renda-fixa': '#ffa500', // Laranja/amarelo
  // Fallback para ETFs sem categoria
  etf: '#00c219', // Verde primário
  'renda-fixa': '#ffa500', // Laranja/amarelo
  cripto: '#ff6b35', // Laranja vibrante
  outros: '#7c3aed', // Roxo
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

