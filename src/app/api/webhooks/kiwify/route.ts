import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';

export const dynamic = 'force-dynamic';

/**
 * Função auxiliar para remover premium de um usuário
 * Remove premium mesmo se não tiver subscription ativa
 */
async function removePremiumFromUser(email: string) {
  const emailLower = email.toLowerCase().trim();
  
  const user = await prisma.user.findUnique({
    where: { email: emailLower },
    include: { subscription: true },
  });

  if (user) {
    // Atualizar subscription se existir
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          status: 'canceled',
          updatedAt: new Date(),
        },
      });
    }

    // Sempre remover premium do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: false,
      },
    });

    return true;
  }

  return false;
}

/**
 * Webhook do Kiwify para processar compras confirmadas
 * 
 * Eventos esperados:
 * - order.paid: Compra confirmada (ativa premium)
 * - order.completed: Compra completada (ativa premium)
 * - order.refunded: Reembolso (remove premium)
 * - order.chargeback: Chargeback (remove premium)
 * - subscription.cancelled: Assinatura cancelada (remove premium)
 * 
 * IMPORTANTE: O email é sempre a chave entre Kiwify e a aplicação
 */
export async function POST(request: NextRequest) {
  try {
    // Em desenvolvimento, permitir bypass se ALLOW_TEST_WEBHOOK estiver configurado
    const isTestMode = process.env.NODE_ENV === 'development' && process.env.ALLOW_TEST_WEBHOOK === 'true';
    
    // Verificar autenticação do webhook (se configurado e não estiver em modo de teste)
    // if (!isTestMode) {
    //   const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;
    //   const authHeader = request.headers.get('authorization');
      
    //   if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    //     return NextResponse.json(
    //       { error: 'Unauthorized' },
    //       { status: 401 }
    //     );
    //   }
    // }

    const body = await request.json();
    const { event, data } = body;

    console.log('Kiwify webhook headers:', request.headers);
    console.log('Kiwify webhook body:', request.body);
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

      const emailLower = email.toLowerCase().trim();

      // Verificar se existe lead com esse email
      let lead = await prisma.lead.findUnique({
        where: { email: emailLower },
      });

      // Criar lead se não existir ou marcar como convertido se existir
      if (!lead) {
        // Criar lead e marcar como convertido imediatamente
        lead = await prisma.lead.create({
          data: {
            email: emailLower,
            converted: true,
            convertedAt: new Date(),
          },
        });
      } else if (!lead.converted) {
        // Marcar lead existente como convertido
        lead = await prisma.lead.update({
          where: { id: lead.id },
          data: {
            converted: true,
            convertedAt: new Date(),
          },
        });
      }

      // Verificar se usuário já existe no banco por EMAIL (chave principal)
      let user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: {
          subscription: true,
        },
      });

      const supabase = createServerClient(true);
      const userName = name?.trim() || generateInvestorName(emailLower);

      // Verificar se existe no Supabase Auth por email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      let authUser = existingUsers?.users?.find(
        (u) => u.email === emailLower
      );

      if (user) {
        // Usuário já existe no banco por email
        if (authUser) {
          // Se authUserId é diferente, pode ser que o usuário tenha múltiplos métodos de login
          // Verificar se o authUserId antigo ainda existe
          if (user.authUserId !== authUser.id) {
            const { data: oldAuthUser } = await supabase.auth.admin.getUserById(user.authUserId);
            
            if (!oldAuthUser?.user) {
              // AuthUserId antigo não existe mais, atualizar para o novo método
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  authUserId: authUser.id,
                },
              });
              // Buscar novamente com subscription
              const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
                include: { subscription: true },
              });
              if (updatedUser) user = updatedUser;
            }
            // Se o authUserId antigo ainda existe, mantemos (Supabase Auth gerencia múltiplas identidades)
          }
        } else {
          // Usuário existe no banco mas não encontrado no Supabase Auth por email
          // Tentar buscar pelo authUserId do banco
          const { data: authUserById } = await supabase.auth.admin.getUserById(user.authUserId);
          
          if (authUserById?.user) {
            authUser = authUserById.user;
          } else {
            // Criar no Supabase Auth (caso raro - usuário foi criado manualmente)
            const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
            
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: emailLower,
              email_confirm: true,
              password: randomPassword,
              user_metadata: {
                name: userName,
              },
            });

            if (!createError && newUser.user) {
              // Atualizar authUserId no banco
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  authUserId: newUser.user.id,
                },
              });
              // Buscar novamente com subscription
              user = await prisma.user.findUnique({
                where: { id: user.id },
                include: { subscription: true },
              });
              if (!user) throw new Error('Failed to update user');
              authUser = newUser.user;
            }
          }
        }
      } else {
        // Usuário não existe no banco
        if (!authUser) {
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
            console.error('Error creating user in Supabase:', createError);
            throw createError;
          }

          authUser = newUser.user;
        }

        // Criar usuário no banco
        const avatarUrl = await generateAvatarUrlWithFallback(emailLower, userName);
        const newUser = await prisma.user.create({
          data: {
            authUserId: authUser.id,
            email: emailLower,
            name: userName,
            avatarUrl,
            isPremium: false,
          },
        });
        // Buscar com subscription
        user = await prisma.user.findUnique({
          where: { id: newUser.id },
          include: { subscription: true },
        });
        if (!user) throw new Error('Failed to create user');
      }

      if (!user || !authUser) {
        throw new Error('Failed to get or create user');
      }

      // Calcular data de expiração: 12 meses a partir de agora
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setMonth(expirationDate.getMonth() + 12);

      // Criar ou atualizar assinatura
      const subscription = await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          kiwifyId: kiwifyId?.toString(),
          kiwifyOrderId: kiwifyOrderId?.toString(),
          status: 'active',
          currentPeriodEnd: expirationDate,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          kiwifyId: kiwifyId?.toString(),
          kiwifyOrderId: kiwifyOrderId?.toString(),
          status: 'active',
          currentPeriodEnd: expirationDate,
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

    // Processar eventos que removem premium: reembolso, chargeback e cancelamento
    if (
      event === 'order.refunded' ||
      event === 'order.chargeback' ||
      event === 'chargeback.created' ||
      event === 'subscription.cancelled'
    ) {
      const order = data.order || data;
      const email = order.customer?.email || order.email;

      if (!email) {
        console.error('No email found in cancellation/refund/chargeback webhook data');
        return NextResponse.json(
          { error: 'Email não encontrado nos dados do evento' },
          { status: 400 }
        );
      }

      const removed = await removePremiumFromUser(email);

      return NextResponse.json({
        success: true,
        message: removed
          ? 'Premium removido do usuário'
          : 'Usuário não encontrado',
        event,
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

