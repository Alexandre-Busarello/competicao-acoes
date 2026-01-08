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

    // Enviar magic link via Supabase Auth
    const supabase = createServerClient();
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email: emailLower,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
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

