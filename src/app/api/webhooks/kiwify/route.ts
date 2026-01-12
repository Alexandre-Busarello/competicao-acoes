import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';
import crypto from 'crypto';

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
 * Valida a assinatura do webhook do Kiwify usando HMAC SHA1
 * 
 * A validação segue a fórmula: signature = hmac_sha1(JSON.stringify(request.body), secretKey)
 * O signature vem na querystring e o secretKey é o token do webhook configurado no painel
 */
function validateKiwifySignature(bodyText: string, signature: string | null, secretKey: string): boolean {
  if (!signature || !secretKey) {
    return false;
  }

  const calculatedSignature = crypto
    .createHmac('sha1', secretKey)
    .update(bodyText)
    .digest('hex');

  return calculatedSignature === signature;
}

/**
 * Webhook do Kiwify para processar compras confirmadas
 * 
 * Formato do webhook do Kiwify:
 * - O evento vem em webhook_event_type
 * - Os dados do cliente estão em Customer (Customer.email, Customer.full_name)
 * - Os dados da subscription estão em Subscription (Subscription.id, Subscription.next_payment)
 * - O order_id está em order_id
 * - A validação usa signature na querystring com HMAC SHA1
 * 
 * Eventos suportados:
 * - order_approved: Compra aprovada (ativa premium)
 * - order_refunded: Reembolso (remove premium)
 * - chargeback: Chargeback (remove premium)
 * - subscription_canceled: Assinatura cancelada (remove premium)
 * - subscription_renewed: Assinatura renovada (renova premium)
 * - subscription_late: Assinatura atrasada (pode manter ou remover premium)
 * - billet_created: Boleto gerado (aguardar pagamento)
 * - pix_created: Pix gerado (aguardar pagamento)
 * - order_rejected: Compra recusada (não ativa premium)
 * 
 * IMPORTANTE: 
 * - O email é sempre a chave entre Kiwify e a aplicação
 * - Configure KIWIFY_WEBHOOK_SECRET nas variáveis de ambiente com o token do painel
 */
export async function POST(request: NextRequest) {
  try {
    // Em desenvolvimento, permitir bypass se ALLOW_TEST_WEBHOOK estiver configurado
    const isTestMode = process.env.NODE_ENV === 'development' && process.env.ALLOW_TEST_WEBHOOK === 'true';
    
    // Ler o body como texto primeiro (precisamos do texto bruto para validação)
    const bodyText = await request.text();

    // Parsear o JSON
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Error parsing webhook body as JSON:', parseError);
      console.error('Raw body received:', bodyText);
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    console.log('Kiwify webhook received:', {
      webhook_event_type: body.webhook_event_type,
      order_status: body.order_status,
      order_id: body.order_id,
      customer_email: body.Customer?.email,
    });

    // Validar assinatura do webhook usando HMAC SHA1
    // O signature vem na querystring: ?signature=xxx
    // A fórmula é: signature = hmac_sha1(JSON.stringify(request.body), secretKey)
    if (!isTestMode) {
      const webhookToken = process.env.KIWIFY_WEBHOOK_SECRET;
      const { searchParams } = new URL(request.url);
      const signature = searchParams.get('signature');

      if (webhookToken) {
        if (!signature) {
          console.error('Missing signature in querystring');
          return NextResponse.json(
            { error: 'Assinatura não encontrada' },
            { status: 401 }
          );
        }

        const isValid = validateKiwifySignature(bodyText, signature, webhookToken);
        if (!isValid) {
          console.error('Invalid webhook signature. Expected signature from HMAC SHA1 of body with token');
          return NextResponse.json(
            { error: 'Assinatura inválida' },
            { status: 401 }
          );
        }

        console.log('Webhook signature validated successfully');
      } else {
        console.warn('KIWIFY_WEBHOOK_SECRET not configured. Skipping signature validation.');
      }
    }

    // O Kiwify envia o evento em webhook_event_type
    const webhookEventType = body.webhook_event_type;
    
    // Validar que temos um evento (exceto para carrinho abandonado que não tem webhook_event_type)
    if (!webhookEventType) {
      // Carrinho abandonado não tem webhook_event_type, podemos ignorar ou logar
      console.log('Webhook sem webhook_event_type recebido (possivelmente carrinho abandonado)');
      return NextResponse.json({
        success: true,
        message: 'Evento não processado (carrinho abandonado ou evento desconhecido)',
      });
    }

    console.log('Kiwify webhook event:', { 
      webhookEventType, 
      orderStatus: body.order_status,
      hasCustomer: !!body.Customer,
      hasSubscription: !!body.Subscription
    });

    // Processar eventos de acordo com o tipo
    // order_approved: Compra aprovada - ativar premium
    // IMPORTANTE: Só ativar premium se order_status === 'paid'
    if (webhookEventType === 'order_approved') {
      // Validar que o pedido está realmente pago
      if (body.order_status !== 'paid') {
        console.log('Order approved but status is not paid:', body.order_status);
        return NextResponse.json({
          success: true,
          message: 'Pedido aprovado mas ainda não pago',
          order_status: body.order_status,
        });
      }

      // Formato do Kiwify: dados estão diretamente no body
      // Customer está em body.Customer
      // Subscription está em body.Subscription
      // Order ID está em body.order_id
      
      const customer = body.Customer;
      const kiwifySubscription = body.Subscription;
      
      if (!customer) {
        console.error('No Customer found in webhook data. Body structure:', JSON.stringify(body, null, 2));
        return NextResponse.json(
          { error: 'Dados do cliente não encontrados no webhook' },
          { status: 400 }
        );
      }

      const email = customer.email;
      const name = customer.full_name || customer.first_name;
      const kiwifyOrderId = body.order_id;
      // Subscription ID pode estar em body.subscription_id ou body.Subscription.id
      const kiwifyId = body.subscription_id || kiwifySubscription?.id;

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

      // Calcular data de expiração
      // Prioridade: usar next_payment da subscription do Kiwify, senão 12 meses
      let expirationDate: Date;
      if (kiwifySubscription?.next_payment) {
        expirationDate = new Date(kiwifySubscription.next_payment);
      } else {
        // Fallback: 12 meses a partir de agora
        const now = new Date();
        expirationDate = new Date(now);
        expirationDate.setMonth(expirationDate.getMonth() + 12);
      }

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
      webhookEventType === 'order_refunded' ||
      webhookEventType === 'chargeback' ||
      webhookEventType === 'subscription_canceled'
    ) {
      // Formato do Kiwify: Customer está em body.Customer
      const customer = body.Customer;
      const email = customer?.email || body.email;

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
        webhook_event_type: webhookEventType,
      });
    }

    // subscription_renewed: Assinatura renovada - renovar premium
    if (webhookEventType === 'subscription_renewed') {
      const customer = body.Customer;
      const kiwifySubscription = body.Subscription;
      
      if (!customer?.email) {
        console.error('No Customer email found in subscription_renewed webhook');
        return NextResponse.json(
          { error: 'Email não encontrado nos dados do evento' },
          { status: 400 }
        );
      }

      const emailLower = customer.email.toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: { subscription: true },
      });

      if (user && user.subscription) {
        // Calcular nova data de expiração baseada no next_payment do Kiwify
        let expirationDate: Date;
        if (kiwifySubscription?.next_payment) {
          expirationDate = new Date(kiwifySubscription.next_payment);
        } else {
          // Fallback: adicionar período baseado na frequência
          const now = new Date();
          expirationDate = new Date(now);
          const frequency = kiwifySubscription?.plan?.frequency || 'monthly';
          if (frequency === 'weekly') {
            expirationDate.setDate(expirationDate.getDate() + 7);
          } else if (frequency === 'monthly') {
            expirationDate.setMonth(expirationDate.getMonth() + 1);
          } else if (frequency === 'yearly') {
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);
          } else {
            expirationDate.setMonth(expirationDate.getMonth() + 1);
          }
        }

        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            status: 'active',
            currentPeriodEnd: expirationDate,
            updatedAt: new Date(),
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            isPremium: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Assinatura renovada e premium atualizado',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário não encontrado para renovação',
      });
    }

    // subscription_late: Assinatura atrasada - pode manter ou remover premium dependendo da política
    if (webhookEventType === 'subscription_late') {
      const customer = body.Customer;
      
      if (!customer?.email) {
        console.error('No Customer email found in subscription_late webhook');
        return NextResponse.json(
          { error: 'Email não encontrado nos dados do evento' },
          { status: 400 }
        );
      }

      // Por enquanto, apenas logamos. Pode implementar lógica específica depois
      console.log('Subscription late for customer:', customer.email);
      
      return NextResponse.json({
        success: true,
        message: 'Assinatura atrasada registrada',
      });
    }

    // billet_created: Boleto gerado - aguardar pagamento (não fazer nada ainda)
    if (webhookEventType === 'billet_created') {
      console.log('Boleto created for order:', body.order_id);
      return NextResponse.json({
        success: true,
        message: 'Boleto gerado - aguardando pagamento',
      });
    }

    // pix_created: Pix gerado - aguardar pagamento (não fazer nada ainda)
    if (webhookEventType === 'pix_created') {
      console.log('Pix created for order:', body.order_id);
      return NextResponse.json({
        success: true,
        message: 'Pix gerado - aguardando pagamento',
      });
    }

    // order_rejected: Compra recusada - não ativar premium
    if (webhookEventType === 'order_rejected') {
      console.log('Order rejected:', body.order_id, 'Reason:', body.card_rejection_reason);
      return NextResponse.json({
        success: true,
        message: 'Compra recusada registrada',
      });
    }

    // Evento não reconhecido ou não tratado
    console.log('Kiwify webhook event not handled:', webhookEventType);
    return NextResponse.json({
      success: true,
      message: 'Evento recebido mas não processado',
      webhook_event_type: webhookEventType,
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

