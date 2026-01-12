import { redirect } from 'next/navigation';
import { findUserBySlugOrId } from '@/lib/utils/user-slug-generator';
import { updateUserSlug } from '@/lib/utils/user-slug-generator';
import { PublicProfilePageClient } from './PublicProfilePageClient';

export default async function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  // Buscar usuário por slug ou ID
  const user = await findUserBySlugOrId(params.userId);
  
  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <p className="text-muted-foreground text-center">Perfil não encontrado</p>
        </div>
      </div>
    );
  }

  // Verificar se acessou pelo ID (UUID) ou pelo slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId);
  
  if (isUUID && params.userId === user.id) {
    // Acessou pelo ID
    if (!user.slug) {
      // Não tem slug - gerar slug e redirecionar
      try {
        const slug = await updateUserSlug(user.id);
        redirect(`/perfil/${slug}`);
      } catch (error) {
        console.error('Error generating slug:', error);
        // Continuar sem slug se houver erro
      }
    } else {
      // Tem slug - redirecionar para slug
      redirect(`/perfil/${user.slug}`);
    }
  }
  // Se acessou pelo slug, continuar normalmente (não redirecionar)

  // Passar userId real para o componente client
  return <PublicProfilePageClient userId={user.id} />;
}
