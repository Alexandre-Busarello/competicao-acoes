import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * API route para sincronizar sessão do cliente com cookies do servidor
 * POST /api/auth/sync-session
 * Body: { access_token: "...", refresh_token: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, expires_at } = body;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Tokens são obrigatórios' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseProjectRef = supabaseUrl.split('//')[1].split('.')[0];
    const cookieName = `sb-${supabaseProjectRef}-auth-token`;

    // Criar objeto de sessão no formato que o Supabase espera
    const sessionData = {
      access_token,
      refresh_token,
      expires_at: expires_at || Math.floor(Date.now() / 1000) + 3600,
      expires_in: expires_at ? Math.floor((expires_at * 1000 - Date.now()) / 1000) : 3600,
      token_type: 'bearer',
    };

    const cookieValue = JSON.stringify(sessionData);

    // Criar resposta
    const response = NextResponse.json({ success: true });

    // Definir cookies HTTP-only
    response.cookies.set(cookieName, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    });

    // Cookies adicionais para compatibilidade
    response.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
    });

    console.log('Session synced to cookies:', cookieName);
    return response;
  } catch (error) {
    console.error('Error syncing session:', error);
    return NextResponse.json(
      {
        error: 'Erro ao sincronizar sessão',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

