import type { Asset } from '@/types';

/**
 * Gera um ticker mockado para ofuscar ativos
 */
function generateMockTicker(index: number): string {
  return `MOCK${index}`;
}

/**
 * Gera um nome mockado para o ativo
 */
function generateMockName(index: number): string {
  return `Ativo ${index}`;
}

/**
 * Ofusca os ativos do portfólio para usuários não premium
 * Mostra apenas o primeiro ativo real, os demais são mockados
 * 
 * @param assets Array de ativos do portfólio
 * @param isPremium Se o usuário visualizador tem assinatura premium
 * @param isOwner Se o usuário visualizador é o dono do portfólio
 * @param viewerUserId ID do usuário que está visualizando (opcional)
 * @param portfolioOwnerId ID do dono do portfólio (opcional)
 * @returns Array de ativos com ofuscação aplicada
 */
export function obfuscatePortfolioAssets(
  assets: Asset[],
  isPremium: boolean,
  isOwner: boolean,
  viewerUserId?: string,
  portfolioOwnerId?: string
): Asset[] {
  // Se o usuário é premium ou é o dono, retorna todos os ativos sem ofuscação
  if (isPremium || isOwner) {
    return assets;
  }

  // Se não há ativos, retorna vazio
  if (!assets || assets.length === 0) {
    return [];
  }

  // Se há apenas um ativo, retorna ele sem ofuscação (primeiro ativo sempre visível)
  if (assets.length === 1) {
    return assets;
  }

  // Pegar o primeiro ativo real
  const firstAsset = assets[0];

  // Criar ativos mockados para os demais
  const mockAssets: Asset[] = assets.slice(1).map((asset, index) => {
    // Manter a mesma estrutura de valores para não quebrar cálculos visuais
    // mas com dados mockados
    return {
      id: `mock-${asset.id}-${index}`,
      ticker: generateMockTicker(index + 1),
      name: generateMockName(index + 1),
      type: asset.type, // Manter o tipo para não quebrar a UI
      etfCategory: asset.etfCategory,
      quantity: asset.quantity, // Manter quantidade para cálculos de proporção
      averagePrice: asset.averagePrice, // Manter para cálculos
      currentPrice: asset.currentPrice, // Manter para cálculos
      return: asset.return, // Manter retorno para cálculos
      visible: false, // Marcar como não visível para aplicar blur
    };
  });

  // Retornar primeiro ativo real + ativos mockados
  return [firstAsset, ...mockAssets];
}

/**
 * Adiciona descrição mockada aos ativos ofuscados
 * Isso será usado no componente para mostrar mensagem ao usuário
 */
export function getObfuscationMessage(): string {
  return 'Este ativo foi ofuscado. Assine o plano premium para visualizar todos os ativos do portfólio.';
}

