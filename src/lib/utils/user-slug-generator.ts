import { prisma } from '@/lib/prisma/client';
import crypto from 'crypto';

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
    .substring(0, 50); // Limita tamanho
}

/**
 * Gera hash do ID do usuário e retorna os primeiros 8 caracteres
 */
function getUserIdHash(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex');
  return hash.substring(0, 8);
}

/**
 * Gera slug para perfil de usuário baseado em nome e quantidade de medalhas
 * Formato: nome-usuario-X-medalhas (ex: joao-silva-15-medalhas)
 * Em caso de colisão, concatena hash do ID do usuário
 */
export async function generateUserSlug(
  name: string,
  totalMedals: number,
  userId?: string
): Promise<string> {
  const normalizedName = normalizeSlug(name);
  const medalsSuffix = totalMedals > 0 ? `-${totalMedals}-medalhas` : '';
  const baseSlug = `${normalizedName}${medalsSuffix}`;
  
  // Garantir que slug é único
  let slug = baseSlug;
  
  // Verificar se slug já existe
  const existing = await prisma.user.findUnique({
    where: { slug },
    select: { id: true },
  });
  
  // Se não existe ou é o mesmo usuário, usar este slug
  if (!existing || (userId && existing.id === userId)) {
    return slug;
  }
  
  // Se existe e é outro usuário, adicionar hash do ID para garantir unicidade
  if (userId) {
    const userIdHash = getUserIdHash(userId);
    slug = `${baseSlug}-${userIdHash}`;
    
    // Verificar novamente se ainda há colisão (muito improvável)
    const existingWithHash = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });
    
    if (!existingWithHash || existingWithHash.id === userId) {
      return slug;
    }
    
    // Se ainda houver colisão (extremamente raro), adicionar timestamp
    slug = `${baseSlug}-${userIdHash}-${Date.now().toString(36)}`;
  } else {
    // Se não temos userId ainda (criação inicial), usar hash aleatório
    const randomHash = crypto.randomBytes(4).toString('hex');
    slug = `${baseSlug}-${randomHash}`;
  }
  
  return slug;
}

/**
 * Atualiza ou cria slug para um usuário baseado em suas medalhas
 */
export async function updateUserSlug(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      medals: {
        select: { id: true },
      },
    },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const totalMedals = user.medals.length;
  const slug = await generateUserSlug(user.name, totalMedals, userId);
  
  // Atualizar slug no banco
  await prisma.user.update({
    where: { id: userId },
    data: { slug },
  });
  
  return slug;
}

/**
 * Busca usuário por slug ou ID (mantém compatibilidade)
 */
export async function findUserBySlugOrId(identifier: string) {
  // Tentar buscar por slug primeiro
  let user = await prisma.user.findUnique({
    where: { slug: identifier },
  });
  
  // Se não encontrou por slug, tentar por ID
  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: identifier },
    });
  }
  
  return user;
}

