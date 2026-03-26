import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';
import { generateSlugAfterUserCreation } from '@/lib/utils/user-slug-helper';

export const dynamic = 'force-dynamic';

async function removePremiumFromUser(email: string) {
  const emailLower = email.toLowerCase().trim();
  
  const user = await prisma.user.findUnique({
    where: { email: emailLower },
    include: { subscription: true },
  });

  if (user) {
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          status: 'canceled',
          updatedAt: new Date(),
        },
      });
    }

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
 * Valida o secret do webhook da Cakto.
 * A Cakto envia o campo `secret` no body do webhook.
 * Basta comparar com o secret configurado no env.
 */
function validateCaktoSecret(bodySecret: string | null, envSecret: string): boolean {
  if (!bodySecret || !envSecret) {
    return false;
  }
  return bodySecret === envSecret;
}

const PROCESSED_EVENTS = [
  'purchase_approved',
  'refund',
  'chargeback',
  'subscription_canceled',
  'subscription_renewed',
  'subscription_renewal_refused',
];

function shouldProcessEvent(event: string | null): boolean {
  if (!event) return false;
  return PROCESSED_EVENTS.includes(event);
}

/**
 * Webhook da Cakto para processar compras e eventos de subscription.
 *
 * Payload da Cakto:
 *   body.event   -> tipo do evento (purchase_approved, refund, chargeback, ...)
 *   body.secret  -> secret para validação
 *   body.data    -> dados do pedido/customer/subscription
 *
 * Eventos processados:
 *   purchase_approved          -> Ativa premium
 *   refund                     -> Remove premium
 *   chargeback                 -> Remove premium
 *   subscription_canceled      -> Remove premium
 *   subscription_renewed       -> Renova premium
 *   subscription_renewal_refused -> Log only
 *
 * A Cakto exige resposta em até 5 segundos.
 */
export async function POST(request: NextRequest) {
  try {
    const isTestMode = process.env.NODE_ENV === 'development' && process.env.ALLOW_TEST_WEBHOOK === 'true';

    const bodyText = await request.text();

    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      console.error('Cakto webhook: invalid JSON body');
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const event = body.event as string | null;
    const data = body.data || {};

    console.log('Cakto webhook received:', {
      event,
      orderId: data.id,
      status: data.status,
      customer_email: data.customer?.email,
    });

    // Validar secret
    if (!isTestMode) {
      const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET;

      if (webhookSecret) {
        if (!validateCaktoSecret(body.secret, webhookSecret)) {
          console.error('Cakto webhook: invalid or missing secret');
          return NextResponse.json({ error: 'Secret inválido' }, { status: 401 });
        }
        console.log('Cakto webhook secret validated');
      } else {
        console.warn('CAKTO_WEBHOOK_SECRET not configured. Skipping secret validation.');
      }
    }

    if (!event) {
      console.log('Cakto webhook sem evento (possivelmente checkout_abandonment)');
      return NextResponse.json({
        success: true,
        message: 'Evento não processado (sem tipo de evento)',
      });
    }

    if (!shouldProcessEvent(event)) {
      console.log('Cakto evento não processado, ignorando:', event);
      return NextResponse.json({
        success: true,
        message: 'Evento recebido mas não processado',
        event,
      });
    }

    const orderId = data.id || null;
    const customerEmail = data.customer?.email || null;

    // Reusar KiwifyWebhookQueue para manter compatibilidade (pode renomear depois)
    const queueItem = await prisma.kiwifyWebhookQueue.create({
      data: {
        webhookEventType: event,
        orderId,
        customerEmail,
        payload: body,
        status: 'pending',
      },
    });

    console.log('Cakto webhook registrado na fila:', {
      queueId: queueItem.id,
      event,
      orderId,
      customerEmail,
    });

    await prisma.kiwifyWebhookQueue.update({
      where: { id: queueItem.id },
      data: { status: 'processing' },
    });

    let result: NextResponse;

    try {
      if (event === 'purchase_approved') {
        if (data.status !== 'paid') {
          console.log('Cakto purchase_approved mas status não é paid:', data.status);
          result = NextResponse.json({
            success: true,
            message: 'Pedido aprovado mas ainda não pago',
            status: data.status,
          });
        } else {
          const customer = data.customer;
          const caktoSubscription = data.subscription;

          if (!customer) {
            console.error('Cakto webhook: customer não encontrado no payload');
            throw new Error('Dados do cliente não encontrados no webhook');
          }

          const email = customer.email;
          const name = customer.name;
          const caktoOrderId = data.id;
          const caktoId = caktoSubscription?.id || null;

          if (!email) {
            console.error('Cakto webhook: email não encontrado');
            throw new Error('Email não encontrado nos dados do pedido');
          }

          const emailLower = email.toLowerCase().trim();

          let lead = await prisma.lead.findUnique({
            where: { email: emailLower },
            include: {
              bannerClick: {
                include: {
                  banner: true,
                },
              },
            },
          });

          if (!lead) {
            lead = await prisma.lead.create({
              data: {
                email: emailLower,
                converted: true,
                convertedAt: new Date(),
              },
              include: {
                bannerClick: {
                  include: {
                    banner: true,
                  },
                },
              },
            });
          } else if (!lead.converted) {
            lead = await prisma.lead.update({
              where: { id: lead.id },
              data: {
                converted: true,
                convertedAt: new Date(),
              },
              include: {
                bannerClick: {
                  include: {
                    banner: true,
                  },
                },
              },
            });
          }

          let user = await prisma.user.findUnique({
            where: { email: emailLower },
            include: { subscription: true },
          });

          const supabase = createServerClient(true);
          const userName = name?.trim() || generateInvestorName(emailLower);

          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          let authUser = existingUsers?.users?.find(
            (u) => u.email === emailLower
          );

          if (user) {
            if (authUser) {
              if (user.authUserId !== authUser.id) {
                const { data: oldAuthUser } = await supabase.auth.admin.getUserById(user.authUserId);
                if (!oldAuthUser?.user) {
                  await prisma.user.update({
                    where: { id: user.id },
                    data: { authUserId: authUser.id },
                  });
                  const updatedUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: { subscription: true },
                  });
                  if (updatedUser) user = updatedUser;
                }
              }
            } else {
              const { data: authUserById } = await supabase.auth.admin.getUserById(user.authUserId);
              if (authUserById?.user) {
                authUser = authUserById.user;
              } else {
                const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                  email: emailLower,
                  email_confirm: true,
                  password: randomPassword,
                  user_metadata: { name: userName },
                });
                if (!createError && newUser.user) {
                  await prisma.user.update({
                    where: { id: user.id },
                    data: { authUserId: newUser.user.id },
                  });
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
            if (!authUser) {
              const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
              const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: emailLower,
                email_confirm: true,
                password: randomPassword,
                user_metadata: { name: userName },
              });
              if (createError) {
                console.error('Cakto webhook: erro ao criar user no Supabase:', createError);
                throw createError;
              }
              authUser = newUser.user;
            }

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

            await generateSlugAfterUserCreation(newUser.id);

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
          // Prioridade: subscription_period da Cakto, senão 12 meses
          let expirationDate: Date;
          if (caktoSubscription?.next_payment) {
            expirationDate = new Date(caktoSubscription.next_payment);
          } else if (data.subscription_period) {
            const now = new Date();
            expirationDate = new Date(now);
            const period = data.subscription_period;
            if (period === 'weekly') {
              expirationDate.setDate(expirationDate.getDate() + 7);
            } else if (period === 'monthly') {
              expirationDate.setMonth(expirationDate.getMonth() + 1);
            } else if (period === 'yearly') {
              expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            } else {
              expirationDate.setMonth(expirationDate.getMonth() + 12);
            }
          } else {
            const now = new Date();
            expirationDate = new Date(now);
            expirationDate.setMonth(expirationDate.getMonth() + 12);
          }

          // Reusar campos kiwifyId / kiwifyOrderId para armazenar IDs da Cakto
          const subscription = await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
              kiwifyId: caktoId?.toString(),
              kiwifyOrderId: caktoOrderId?.toString(),
              status: 'active',
              currentPeriodEnd: expirationDate,
              updatedAt: new Date(),
            },
            create: {
              userId: user.id,
              kiwifyId: caktoId?.toString(),
              kiwifyOrderId: caktoOrderId?.toString(),
              status: 'active',
              currentPeriodEnd: expirationDate,
            },
          });

          await prisma.user.update({
            where: { id: user.id },
            data: { isPremium: subscription.status === 'active' },
          });

          if (lead.bannerClickId && lead.bannerClick) {
            const bannerClick = lead.bannerClick;
            const bannerId = bannerClick.bannerId;

            const existingConversion = await prisma.feedBannerConversion.findFirst({
              where: { bannerId, userId: user.id, leadId: lead.id },
            });

            if (!existingConversion) {
              await prisma.feedBannerConversion.create({
                data: { bannerId, userId: user.id, leadId: lead.id },
              });
            }
          }

          const conversionEvents = await prisma.conversionEvent.findMany({
            where: {
              OR: [{ leadId: lead.id }, { userId: user.id }],
              clickedAt: { not: null },
              convertedAt: null,
            },
          });

          for (const ce of conversionEvents) {
            await prisma.conversionEvent.update({
              where: { id: ce.id },
              data: {
                convertedAt: new Date(),
                leadId: lead.id,
                userId: user.id,
              },
            });
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const testEmailDomains = ['example.com', 'test.com', 'example.org', 'test.org'];
          const isTestEmail = testEmailDomains.some(domain => emailLower.includes(`@${domain}`));
          const isValidEmail = emailRegex.test(emailLower) && !isTestEmail;

          if (isValidEmail) {
            const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const redirectUrl = `${appUrl}/auth/callback`;

            const { error: linkError } = await supabase.auth.signInWithOtp({
              email: emailLower,
              options: { emailRedirectTo: redirectUrl },
            });

            if (linkError) {
              console.error('Cakto webhook: erro ao enviar magic link:', linkError);
            } else {
              console.log('Magic link enviado para:', emailLower);
            }
          } else {
            console.warn('Email inválido ou de teste, magic link não enviado:', emailLower);
          }

          result = NextResponse.json({
            success: true,
            message: isValidEmail
              ? 'Usuário criado e magic link enviado'
              : 'Usuário criado (email inválido, magic link não enviado)',
            user: { id: user.id, email: user.email },
            magicLinkSent: isValidEmail,
          });
        }
      } else if (
        event === 'refund' ||
        event === 'chargeback' ||
        event === 'subscription_canceled'
      ) {
        const customer = data.customer;
        const email = customer?.email || data.email;

        if (!email) {
          throw new Error('Email não encontrado nos dados do evento');
        }

        const removed = await removePremiumFromUser(email);

        result = NextResponse.json({
          success: true,
          message: removed ? 'Premium removido do usuário' : 'Usuário não encontrado',
          event,
        });
      } else if (event === 'subscription_renewed') {
        const customer = data.customer;
        const caktoSubscription = data.subscription;

        if (!customer?.email) {
          console.error('Cakto webhook: email não encontrado em subscription_renewed');
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
          let expirationDate: Date;
          if (caktoSubscription?.next_payment) {
            expirationDate = new Date(caktoSubscription.next_payment);
          } else {
            const now = new Date();
            expirationDate = new Date(now);
            const period = data.subscription_period || 'monthly';
            if (period === 'weekly') {
              expirationDate.setDate(expirationDate.getDate() + 7);
            } else if (period === 'monthly') {
              expirationDate.setMonth(expirationDate.getMonth() + 1);
            } else if (period === 'yearly') {
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
            data: { isPremium: true },
          });

          result = NextResponse.json({
            success: true,
            message: 'Assinatura renovada e premium atualizado',
          });
        } else {
          result = NextResponse.json({
            success: true,
            message: 'Usuário não encontrado para renovação',
          });
        }
      } else if (event === 'subscription_renewal_refused') {
        const customer = data.customer;

        if (!customer?.email) {
          console.error('Cakto webhook: email não encontrado em subscription_renewal_refused');
          return NextResponse.json(
            { error: 'Email não encontrado nos dados do evento' },
            { status: 400 }
          );
        }

        console.log('Cakto subscription_renewal_refused para:', customer.email);

        result = NextResponse.json({
          success: true,
          message: 'Renovação de assinatura recusada registrada',
        });
      } else {
        throw new Error(`Evento não reconhecido: ${event}`);
      }

      await prisma.kiwifyWebhookQueue.update({
        where: { id: queueItem.id },
        data: {
          status: 'completed',
          processedAt: new Date(),
        },
      });

      console.log('Cakto webhook processado com sucesso:', queueItem.id);
      return result;

    } catch (processingError) {
      const errorMessage = processingError instanceof Error
        ? processingError.message
        : 'Erro desconhecido ao processar webhook';

      await prisma.kiwifyWebhookQueue.update({
        where: { id: queueItem.id },
        data: {
          status: 'error',
          errorMessage,
          processedAt: new Date(),
        },
      });

      console.error('Cakto webhook erro:', { queueId: queueItem.id, error: errorMessage });
      throw processingError;
    }
  } catch (error) {
    console.error('Error processing Cakto webhook:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar webhook',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
