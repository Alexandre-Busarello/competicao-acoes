'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Asset } from '@/types';

interface AssetAllocationChartProps {
  assets: Asset[];
}

const COLORS = {
  acao: '#3b82f6',
  fii: '#10b981',
  'renda-fixa': '#f59e0b',
  outros: '#8b5cf6',
};

export function AssetAllocationChart({ assets }: AssetAllocationChartProps) {
  // Calcular alocação por tipo
  const allocation = assets.reduce(
    (acc, asset) => {
      const value = asset.currentPrice * asset.quantity;
      const type = asset.type;
      if (!acc[type]) {
        acc[type] = { name: type, value: 0 };
      }
      acc[type].value += value;
      return acc;
    },
    {} as Record<string, { name: string; value: number }>
  );

  const data = Object.values(allocation).map((item) => ({
    name:
      item.name === 'acao'
        ? 'Ações'
        : item.name === 'fii'
        ? 'FIIs'
        : item.name === 'renda-fixa'
        ? 'Renda Fixa'
        : 'Outros',
    value: Number(item.value.toFixed(2)),
  }));

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
              const colorKey = Object.keys(allocation)[index] as keyof typeof COLORS;
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

