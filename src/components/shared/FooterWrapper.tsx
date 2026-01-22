import { getServerSession } from '@/lib/auth/server';
import { Footer } from './Footer';

export async function FooterWrapper() {
  const session = await getServerSession();
  
  // Mostrar footer apenas para usuários não autenticados
  if (session) {
    return null;
  }

  return <Footer />;
}

