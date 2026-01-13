import { prisma } from '@/lib/prisma/client';

/**
 * Normaliza texto para slug
 * Remove acentos, caracteres especiais, converte para lowercase
 */
function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
    .substring(0, 100); // Limita tamanho
}

/**
 * Gera slug baseado em texto e data
 * @param text Texto base para o slug
 * @param date Data para incluir no slug
 * @param attempt Número da tentativa (para tratar colisões)
 */
export function generateSlug(text: string, date: Date, attempt: number = 0): string {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const normalizedText = normalizeSlug(text);
  
  let slug = `${normalizedText}-${dateStr}`;
  
  if (attempt > 0) {
    slug = `${slug}-${attempt}`;
  }
  
  return slug;
}

/**
 * Gera slug específico para post baseado em transação
 * @param transaction Transação para gerar slug
 * @param attempt Número da tentativa (para tratar colisões)
 */
export async function generatePostSlug(
  transaction: {
    type: string;
    ticker: string;
    quantity: number | string;
    date: Date;
  },
  attempt: number = 0
): Promise<string> {
  const typeMap: Record<string, string> = {
    buy: 'compra',
    purchase: 'compra',
    sell: 'venda',
    sale: 'venda',
  };
  
  const type = typeMap[transaction.type.toLowerCase()] || transaction.type.toLowerCase();
  const ticker = transaction.ticker.toLowerCase();
  const quantity = typeof transaction.quantity === 'string' 
    ? transaction.quantity 
    : transaction.quantity.toString();
  
  const baseText = `${type}-${quantity}-${ticker}`;
  const slug = generateSlug(baseText, transaction.date, attempt);
  
  return slug;
}

/**
 * Garante que o slug é único verificando no banco
 * Se já existir, adiciona sufixo numérico
 * @param baseSlug Slug base
 * @param checkExists Função para verificar se slug existe
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;
  
  while (await checkExists(slug)) {
    attempt++;
    // Remove sufixo anterior se existir
    const baseWithoutSuffix = baseSlug.replace(/-\d+$/, '');
    slug = attempt > 0 ? `${baseWithoutSuffix}-${attempt}` : baseSlug;
    
    // Limite de segurança para evitar loop infinito
    if (attempt > 1000) {
      throw new Error('Unable to generate unique slug after 1000 attempts');
    }
  }
  
  return slug;
}

/**
 * Verifica se um slug já existe no banco de dados
 */
export async function slugExists(slug: string): Promise<boolean> {
  const post = await prisma.feedPost.findUnique({
    where: { slug },
    select: { id: true },
  });
  
  return !!post;
}

/**
 * Gera slug único para um post baseado em transação
 * Combina todas as funções acima para garantir slug único
 */
export async function generateUniquePostSlug(
  transaction: {
    type: string;
    ticker: string;
    quantity: number | string;
    date: Date;
  }
): Promise<string> {
  const baseSlug = await generatePostSlug(transaction);
  return ensureUniqueSlug(baseSlug, slugExists);
}





