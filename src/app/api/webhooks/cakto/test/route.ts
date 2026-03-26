import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';

export const dynamic = 'force-dynamic';

/**
 * Rota de teste para simular webhook da Cakto localmente.
 *
 * POST /api/webhooks/cakto/test
 * Body: { email: "teste@example.com", name: "Nome do Teste" }
 */
export async function POST(request: NextRequest) {
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
    const userName = name?.trim() || generateInvestorName(emailLower);

    console.log('Test Cakto webhook: Criando usuário de teste', { email: emailLower, name: userName });

    const lead = await prisma.lead.findUnique({
      where: { email: emailLower },
    });

    if (lead && !lead.converted) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          converted: true,
          convertedAt: new Date(),
        },
      });
    }

    const supabase = createServerClient(true);

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === emailLower
    );

    let authUser;
    if (existingUser) {
      authUser = existingUser;
    } else {
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: emailLower,
        email_confirm: true,
        password: randomPassword,
        user_metadata: { name: userName },
      });

      if (createError) {
        console.error('Erro ao criar usuário no Supabase:', createError);
        throw createError;
      }

      authUser = newUser.user;
    }

    if (!authUser) {
      throw new Error('Failed to get or create auth user');
    }

    const avatarUrl = await generateAvatarUrlWithFallback(emailLower, userName);

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
        isPremium: true,
      },
    });

    const testCaktoId = `test-subscription-${user.id}`;
    const testCaktoOrderId = `test-order-${user.id}-${Date.now()}`;

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        kiwifyId: testCaktoId,
        kiwifyOrderId: testCaktoOrderId,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        kiwifyId: testCaktoId,
        kiwifyOrderId: testCaktoOrderId,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { isPremium: true },
    });

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/auth/callback`;

    const { error: linkError } = await supabase.auth.signInWithOtp({
      email: emailLower,
      options: { emailRedirectTo: redirectUrl },
    });

    if (linkError) {
      console.error('Erro ao enviar magic link:', linkError);
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
    });
  } catch (error) {
    console.error('Erro ao processar webhook de teste Cakto:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar webhook de teste',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
