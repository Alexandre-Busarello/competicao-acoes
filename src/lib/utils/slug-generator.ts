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
 * Gera hash simples para garantir unicidade sem expor informações sensíveis
 */
function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8); // 8 caracteres alfanuméricos
}

/**
 * Gera slug específico para post baseado em transação
 * ATUALIZADO: Não inclui informações sensíveis (ticker/quantidade) no slug
 * Usa hash para garantir unicidade sem expor dados da transação
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
  const dateStr = transaction.date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Gerar hash único baseado em ticker + quantity + timestamp + tipo
  // Isso garante unicidade sem expor informações sensíveis no slug
  const quantity = typeof transaction.quantity === 'string' 
    ? transaction.quantity 
    : transaction.quantity.toString();
  const hashInput = `${transaction.ticker}-${quantity}-${transaction.date.getTime()}-${type}`;
  const hashStr = generateHash(hashInput);
  
  // Slug formato: tipo-data-hash (ex: compra-2026-01-14-a3b5c7d9)
  const baseText = `${type}-${dateStr}-${hashStr}`;
  const normalizedText = normalizeSlug(baseText);
  
  let slug = normalizedText;
  
  if (attempt > 0) {
    slug = `${normalizedText}-${attempt}`;
  }
  
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





