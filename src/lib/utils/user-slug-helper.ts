import { updateUserSlug } from './user-slug-generator';

/**
 * Helper para gerar slug após criar usuário
 * Não falha se houver erro (slug é opcional)
 */
export async function generateSlugAfterUserCreation(userId: string): Promise<void> {
  try {
    await updateUserSlug(userId);
  } catch (error) {
    console.error('Error generating user slug after creation:', error);
    // Não lançar erro - slug é opcional e pode ser gerado depois
  }
}

