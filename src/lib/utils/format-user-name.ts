/**
 * Utilitários para formatação de nomes de usuário com ID único
 */

/**
 * Extrai um ID curto (últimos 4 caracteres) de um UUID
 * @param userId - UUID do usuário
 * @returns ID curto de 4 caracteres (ex: "a3f2")
 */
export function getShortUserId(userId: string): string {
  // Remover hífens e pegar os últimos 4 caracteres
  const cleanId = userId.replace(/-/g, '');
  return cleanId.slice(-4).toUpperCase();
}

/**
 * Formata o nome do usuário com ID único para exibição
 * @param name - Nome do usuário
 * @param userId - ID do usuário (UUID)
 * @returns Nome formatado com ID (ex: "João Silva #A3F2")
 */
export function formatUserNameWithId(name: string, userId: string): string {
  // Se o nome já contém um ID, não adicionar outro
  if (hasUserIdInName(name)) {
    return name;
  }
  
  const shortId = getShortUserId(userId);
  return `${name} #${shortId}`;
}

/**
 * Verifica se o nome já contém um ID (#XXXX)
 * @param name - Nome do usuário
 * @returns true se o nome já contém um ID
 */
export function hasUserIdInName(name: string): boolean {
  return /#[\dA-F]{4}$/i.test(name);
}

/**
 * Remove o ID do nome se presente
 * @param name - Nome do usuário (pode conter #ID)
 * @returns Nome sem o ID
 */
export function getNameWithoutId(name: string): string {
  return name.replace(/#[\dA-F]{4}$/i, '').trim();
}

