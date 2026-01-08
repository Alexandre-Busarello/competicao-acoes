import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';

export const dynamic = 'force-dynamic';

/**
 * Rota de teste para simular webhook do Kiwify localmente
 * Permite testar a criação de usuário sem precisar de um webhook real
 * 
 * Uso:
 * POST /api/webhooks/kiwify/test
 * Body: { email: "teste@example.com", name: "Nome do Teste" }
 */
export async function POST(request: NextRequest) {
  // Verificar se está em modo de desenvolvimento
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_WEBHOOK) {
    return NextResponse.json(
      { error: 'Test webhook não disponível em produção' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    // Gerar nome criativo se não fornecido
    const userName = name?.trim() || generateInvestorName(emailLower);

    console.log('🧪 Test webhook: Criando usuário de teste', { email: emailLower, name: userName });

    // Verificar se existe lead com esse email
    const lead = await prisma.lead.findUnique({
      where: { email: emailLower },
    });

    // Marcar lead como convertido se existir
    if (lead && !lead.converted) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          converted: true,
          convertedAt: new Date(),
        },
      });
      console.log('✅ Lead marcado como convertido');
    }

    // Criar ou buscar usuário no Supabase Auth
    const supabase = createServerClient(true); // Usar service role

    // Verificar se usuário já existe no Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === emailLower
    );

    let authUser;
    if (existingUser) {
      authUser = existingUser;
      console.log('✅ Usuário já existe no Supabase Auth');
    } else {
      // Criar novo usuário no Supabase Auth
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: emailLower,
        email_confirm: true,
        password: randomPassword,
        user_metadata: {
          name: userName,
        },
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário no Supabase:', createError);
        throw createError;
      }

      authUser = newUser.user;
      console.log('✅ Usuário criado no Supabase Auth');
    }

    if (!authUser) {
      throw new Error('Failed to get or create auth user');
    }

    // Gerar avatar
    const avatarUrl = await generateAvatarUrlWithFallback(emailLower, userName);
    console.log('✅ Avatar gerado:', avatarUrl);

    // Criar ou atualizar usuário no banco
    const user = await prisma.user.upsert({
      where: { authUserId: authUser.id },
      update: {
        email: emailLower,
        name: userName,
        avatarUrl,
        updatedAt: new Date(),
      },
      create: {
        authUserId: authUser.id,
        email: emailLower,
        name: userName,
        avatarUrl,
        isPremium: true, // Em teste, já marca como premium
      },
    });
    console.log('✅ Usuário criado/atualizado no banco');

    // Criar ou atualizar assinatura
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        kiwifyId: 'test-subscription-id',
        kiwifyOrderId: `test-order-${Date.now()}`,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        kiwifyId: 'test-subscription-id',
        kiwifyOrderId: `test-order-${Date.now()}`,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });
    console.log('✅ Assinatura criada/atualizada');

    // Atualizar isPremium do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: true,
      },
    });

    // Enviar magic link via Supabase Auth
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email: emailLower,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (linkError) {
      console.error('⚠️ Erro ao enviar magic link:', linkError);
      // Não falhar o teste se não conseguir enviar email
    } else {
      console.log('✅ Magic link enviado');
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário de teste criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        authUserId: user.authUserId,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
      magicLinkSent: !linkError,
      note: 'Em desenvolvimento local, você pode fazer login diretamente com o email e senha gerada, ou usar o magic link se configurado.',
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook de teste:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar webhook de teste',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

