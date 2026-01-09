import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

/**
 * API route para signup/login com email e senha
 * POST /api/auth/signup
 * Body: { email: "user@example.com", password: "senha123" }
 * 
 * Cria conta automaticamente se não existir, ou faz login se já existir
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verificar se usuário já existe no banco por EMAIL (chave principal)
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    const supabase = createServerClient();

    // Se não existir no banco, criar conta
    if (!user) {
      // Tentar criar usuário no Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailLower,
        password,
        options: {
          emailRedirectTo: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        },
      });

      if (signUpError) {
        // Se erro for que email já existe no Supabase Auth, tentar fazer login
        // Isso pode acontecer se usuário criou conta com Google ou magic link antes
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('already exists') ||
            signUpError.message.includes('User already registered')) {
          
          // Tentar fazer login (pode ser que já tenha senha ou o Supabase permita adicionar)
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: emailLower,
            password,
          });

          if (signInError) {
            // Se não conseguir fazer login, pode ser que não tenha senha ainda
            // Nesse caso, informar que deve usar outro método ou definir senha no perfil
            return NextResponse.json(
              { error: 'Este email já está cadastrado. Use Google ou Magic Link para fazer login, ou defina uma senha na página de perfil.' },
              { status: 400 }
            );
          }

          if (signInData.user) {
            // Login bem-sucedido - criar usuário no banco associando ao authUserId existente
            const userName = generateInvestorName(emailLower);
            const avatarUrl = await generateAvatarUrlWithFallback(emailLower, userName);

            user = await prisma.user.create({
              data: {
                authUserId: signInData.user.id,
                email: emailLower,
                name: userName,
                avatarUrl,
                isPremium: false,
              },
            });

            return NextResponse.json({
              success: true,
              message: 'Login realizado com sucesso!',
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
            });
          }
        }

        console.error('Error signing up:', signUpError);
        return NextResponse.json(
          { error: signUpError.message || 'Erro ao criar conta. Tente novamente.' },
          { status: 400 }
        );
      }

      if (!signUpData.user) {
        return NextResponse.json(
          { error: 'Erro ao criar conta. Tente novamente.' },
          { status: 500 }
        );
      }

      // Gerar nome criativo
      const userName = generateInvestorName(emailLower);

      // Gerar avatar
      const avatarUrl = await generateAvatarUrlWithFallback(emailLower, userName);

      // Criar usuário no banco
      user = await prisma.user.create({
        data: {
          authUserId: signUpData.user.id,
          email: emailLower,
          name: userName,
          avatarUrl,
          isPremium: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Conta criada com sucesso! Verifique seu email para confirmar.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // Se já existe no banco por email, tentar fazer login
    // O usuário pode ter criado conta com outro método (Google, magic link)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password,
    });

    if (signInError) {
      // Se não conseguir fazer login com senha
      // Verificar se o authUserId do banco corresponde a algum usuário no Supabase Auth
      const supabaseAdmin = createServerClient(true);
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(user.authUserId);
      
      if (authUserData?.user) {
        // Usuário existe no Supabase Auth mas não tem senha ou senha está incorreta
        // Verificar se tem senha (encrypted_password)
        const hasPassword = !!(authUserData.user as any).encrypted_password;
        
        if (!hasPassword) {
          // Não tem senha - usuário criou conta com Google ou magic link
          return NextResponse.json(
            { error: 'Este email não tem senha configurada. Use Google ou Magic Link para fazer login, ou defina uma senha na página de perfil.' },
            { status: 401 }
          );
        } else {
          // Tem senha mas está incorreta
          return NextResponse.json(
            { error: 'Email ou senha incorretos' },
            { status: 401 }
          );
        }
      } else {
        // AuthUserId não existe mais no Supabase Auth (caso raro)
        // Tentar criar nova conta no Supabase Auth com senha
        const { data: newSignUpData, error: newSignUpError } = await supabase.auth.signUp({
          email: emailLower,
          password,
          options: {
            emailRedirectTo: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
          },
        });

        if (newSignUpError || !newSignUpData.user) {
          return NextResponse.json(
            { error: 'Erro ao configurar senha. Tente novamente.' },
            { status: 500 }
          );
        }

        // Atualizar authUserId no banco
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authUserId: newSignUpData.user.id,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Senha configurada com sucesso! Login realizado.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        });
      }
    }

    if (!signInData.user) {
      return NextResponse.json(
        { error: 'Erro ao fazer login. Tente novamente.' },
        { status: 500 }
      );
    }

    // Se authUserId mudou (usuário tinha conta com outro método), atualizar
    if (user.authUserId !== signInData.user.id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authUserId: signInData.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error processing signup/login request:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

