import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * API route para iniciar login OAuth do Google
 * GET /api/auth/google
 * 
 * Redireciona para página de autorização do Google
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Error initiating Google OAuth:', error);
      return NextResponse.json(
        { error: 'Erro ao iniciar login com Google' },
        { status: 500 }
      );
    }

    if (!data.url) {
      return NextResponse.json(
        { error: 'Erro ao gerar URL de autorização' },
        { status: 500 }
      );
    }

    // Redirecionar para URL de autorização do Google
    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error('Error processing Google OAuth request:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

