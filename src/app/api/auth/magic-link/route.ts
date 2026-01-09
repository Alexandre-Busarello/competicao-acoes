import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

/**
 * API route para solicitar um novo magic link
 * POST /api/auth/magic-link
 * Body: { email: "user@example.com" }
 * 
 * Cria usuário automaticamente se não existir (modelo freemium)
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

    // Verificar se o usuário existe no banco por EMAIL (chave principal)
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    const supabaseAdmin = createServerClient(true); // Usar service role para criar usuário

    // Verificar se usuário já existe no Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email === emailLower
    );

    let authUser = existingAuthUser;

    // Se não existir no banco, criar automaticamente
    if (!user) {
      // Gerar nome criativo
      const userName = generateInvestorName(emailLower);

      if (!authUser) {
        // Criar novo usuário no Supabase Auth
        // Gerar senha aleatória (usuário usará magic link)
        const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: emailLower,
          email_confirm: true,
          password: randomPassword,
          user_metadata: {
            name: userName,
          },
        });

        if (createError) {
          console.error('Error creating user in Supabase:', createError);
          return NextResponse.json(
            { error: 'Erro ao criar usuário. Tente novamente mais tarde.' },
            { status: 500 }
          );
        }

        authUser = newUser.user;
      }

      if (!authUser) {
        return NextResponse.json(
          { error: 'Erro ao criar usuário. Tente novamente mais tarde.' },
          { status: 500 }
        );
      }

      // Gerar avatar
      const avatarUrl = await generateAvatarUrlWithFallback(emailLower, authUser.user_metadata?.name || generateInvestorName(emailLower));

      // Criar usuário no banco
      user = await prisma.user.create({
        data: {
          authUserId: authUser.id,
          email: emailLower,
          name: authUser.user_metadata?.name || generateInvestorName(emailLower),
          avatarUrl,
          isPremium: false,
        },
      });
    } else if (authUser && user.authUserId !== authUser.id) {
      // Usuário existe no banco mas authUserId é diferente
      // Isso significa que o usuário está usando outro método de login (ex: tinha Google, agora usando magic link)
      // Verificar se o authUserId antigo ainda existe
      const { data: oldAuthUser } = await supabaseAdmin.auth.admin.getUserById(user.authUserId);
      
      if (!oldAuthUser?.user) {
        // AuthUserId antigo não existe mais, atualizar para o novo
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authUserId: authUser.id,
          },
        });
      }
      // Se o authUserId antigo ainda existe, mantemos (usuário pode ter múltiplos métodos)
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

