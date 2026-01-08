import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * API route para solicitar um novo magic link
 * POST /api/auth/magic-link
 * Body: { email: "user@example.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verificar se o usuário existe no banco
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email não encontrado. Faça checkout primeiro para criar sua conta.' },
        { status: 404 }
      );
    }

    // Obter URL de redirecionamento
    // Prioridade: APP_URL (server-side) > NEXT_PUBLIC_APP_URL (client-side) > localhost
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/auth/callback`;
    
    console.log('=== Magic Link Configuration ===');
    console.log('Redirect URL (emailRedirectTo):', redirectUrl);
    console.log('APP_URL:', process.env.APP_URL);
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('⚠️ IMPORTANTE: O ConfirmationURL no email usa a Site URL do Supabase Dashboard!');
    console.log('⚠️ Configure a Site URL em: Authentication → URL Configuration → Site URL');
    console.log('⚠️ Site URL deve ser:', appUrl);
    console.log('================================');

    // Enviar magic link via Supabase Auth
    const supabase = createServerClient();
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email: emailLower,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (linkError) {
      console.error('Error sending magic link:', linkError);
      return NextResponse.json(
        { error: 'Erro ao enviar magic link. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link enviado com sucesso',
    });
  } catch (error) {
    console.error('Error processing magic link request:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

