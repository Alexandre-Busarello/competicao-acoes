import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';

export const dynamic = 'force-dynamic';

/**
 * Webhook do Kiwify para processar compras confirmadas
 * 
 * Eventos esperados:
 * - order.paid: Compra confirmada
 * - order.refunded: Reembolso
 * - subscription.cancelled: Assinatura cancelada
 */
export async function POST(request: NextRequest) {
  try {
    // Em desenvolvimento, permitir bypass se ALLOW_TEST_WEBHOOK estiver configurado
    const isTestMode = process.env.NODE_ENV === 'development' && process.env.ALLOW_TEST_WEBHOOK === 'true';
    
    // Verificar autenticação do webhook (se configurado e não estiver em modo de teste)
    if (!isTestMode) {
      const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;
      const authHeader = request.headers.get('authorization');
      
      if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { event, data } = body;

    console.log('Kiwify webhook received:', { event, data });

    // Processar apenas eventos de compra confirmada
    if (event === 'order.paid' || event === 'order.completed') {
      const order = data.order || data;
      const email = order.customer?.email || order.email;
      const name = order.customer?.name || order.name;
      const kiwifyOrderId = order.id || order.order_id;
      const kiwifyId = order.subscription_id || order.product_id;

      if (!email) {
        console.error('No email found in webhook data');
        return NextResponse.json(
          { error: 'Email não encontrado nos dados do pedido' },
          { status: 400 }
        );
      }

      // Verificar se existe lead com esse email
      const lead = await prisma.lead.findUnique({
        where: { email: email.toLowerCase().trim() },
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
      }

      // Criar ou atualizar usuário no Supabase Auth
      const supabase = createServerClient(true); // Usar service role para criar usuário

      // Gerar nome criativo se não fornecido (antes de criar/atualizar usuário)
      const userName = name?.trim() || generateInvestorName(email);

      // Verificar se usuário já existe no Supabase Auth
      let authUser;
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === email.toLowerCase().trim()
      );

      if (existingUser) {
        authUser = existingUser;
      } else {
        // Criar novo usuário no Supabase Auth
        // Gerar senha aleatória (usuário usará magic link)
        const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          email_confirm: true,
          password: randomPassword,
          user_metadata: {
            name: userName,
          },
        });

        if (createError) {
          console.error('Error creating user in Supabase:', createError);
          throw createError;
        }

        authUser = newUser.user;
      }

      if (!authUser) {
        throw new Error('Failed to get or create auth user');
      }
      
      // Gerar avatar
      const avatarUrl = await generateAvatarUrlWithFallback(email, userName);

      // Criar ou atualizar usuário no banco
      const user = await prisma.user.upsert({
        where: { authUserId: authUser.id },
        update: {
          email: email.toLowerCase().trim(),
          name: userName,
          avatarUrl,
          updatedAt: new Date(),
        },
        create: {
          authUserId: authUser.id,
          email: email.toLowerCase().trim(),
          name: userName,
          avatarUrl,
          isPremium: true, // Será atualizado pela subscription
        },
      });

      // Criar ou atualizar assinatura
      const subscription = await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          kiwifyId: kiwifyId?.toString(),
          kiwifyOrderId: kiwifyOrderId?.toString(),
          status: 'active',
          currentPeriodEnd: order.current_period_end
            ? new Date(order.current_period_end * 1000)
            : null,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          kiwifyId: kiwifyId?.toString(),
          kiwifyOrderId: kiwifyOrderId?.toString(),
          status: 'active',
          currentPeriodEnd: order.current_period_end
            ? new Date(order.current_period_end * 1000)
            : null,
        },
      });

      // Atualizar isPremium do usuário baseado na subscription
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPremium: subscription.status === 'active',
        },
      });

      // Obter URL de redirecionamento
      // Prioridade: APP_URL (server-side) > NEXT_PUBLIC_APP_URL (client-side) > localhost
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const redirectUrl = `${appUrl}/auth/callback`;
      
      console.log('Magic link redirect URL:', redirectUrl);

      // Enviar magic link via Supabase Auth
      // Usar signInWithOtp para enviar magic link
      const { error: linkError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (linkError) {
        console.error('Error sending magic link:', linkError);
        // Não falhar o webhook se não conseguir enviar email
        // O usuário pode solicitar um novo link depois
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário criado e magic link enviado',
        user: {
          id: user.id,
          email: user.email,
        },
      });
    }

    // Processar outros eventos se necessário
    if (event === 'order.refunded' || event === 'subscription.cancelled') {
      const order = data.order || data;
      const email = order.customer?.email || order.email;

      if (email) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { subscription: true },
        });

        if (user?.subscription) {
          await prisma.subscription.update({
            where: { id: user.subscription.id },
            data: {
              status: 'canceled',
              updatedAt: new Date(),
            },
          });

          await prisma.user.update({
            where: { id: user.id },
            data: {
              isPremium: false,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Evento processado',
    });
  } catch (error) {
    console.error('Error processing Kiwify webhook:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar webhook',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

