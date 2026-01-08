import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { generateAvatarUrl } from '@/lib/utils/avatar';

/**
 * GET /api/user/gravatar-url?email=...
 * Retorna a URL do Gravatar para o email fornecido
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Gerar URL do Gravatar
    const gravatarUrl = generateAvatarUrl(email);

    return NextResponse.json({ 
      gravatarUrl 
    });
  } catch (error) {
    console.error('Error generating Gravatar URL:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao gerar URL do Gravatar' },
      { status: 500 }
    );
  }
}


