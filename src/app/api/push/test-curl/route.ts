import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '@/lib/services/push-notification-service';
import { prisma } from '@/lib/prisma/client';
import { getServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/push/test-curl
 * Endpoint para testar notificações via curl (aceita userId como parâmetro ou usa usuário autenticado)
 * 
 * Uso:
 *   curl -X POST http://localhost:3000/api/push/test-curl \
 *     -H "Content-Type: application/json" \
 *     -H "Cookie: sb-xxx-auth-token=..." \
 *     -d '{"userId": "optional-user-id"}'
 * 
 * Ou com Authorization header:
 *   curl -X POST http://localhost:3000/api/push/test-curl \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *     -d '{"userId": "optional-user-id"}'
 */
export async function POST(request: NextRequest) {
  try {
    // Tentar obter usuário autenticado primeiro
    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      const supabaseUser = await getServerUser();
      if (supabaseUser) {
        // Buscar userId do banco usando authUserId
        const user = await prisma.user.findUnique({
          where: { authUserId: supabaseUser.id },
        });
        if (user) {
          userId = user.id;
          userEmail = user.email;
        }
      }
    } catch (error) {
      console.log('[API] Não foi possível obter usuário autenticado:', error);
    }

    // Tentar obter userId do body da requisição
    try {
      const body = await request.json().catch(() => ({}));
      if (body.userId) {
        userId = body.userId;
        console.log(`[API] Usando userId do body: ${userId}`);
      }
    } catch (error) {
      // Body vazio ou inválido, continuar
    }

    // Se não tem userId, retornar erro
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Usuário não encontrado. Forneça userId no body ou faça autenticação via cookie/header.',
          usage: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'sb-xxx-auth-token=... (opcional)',
              'Authorization': 'Bearer YOUR_ACCESS_TOKEN (opcional)',
            },
            body: {
              userId: 'string (opcional, se não autenticado)',
            },
            examples: [
              'curl -X POST http://localhost:3000/api/push/test-curl -H "Content-Type: application/json" -d \'{"userId": "user-id-here"}\'',
              'curl -X POST http://localhost:3000/api/push/test-curl -H "Content-Type: application/json" -H "Cookie: sb-xxx-auth-token=..."',
            ],
          },
        },
        { status: 400 }
      );
    }

    console.log(`[API] Teste de notificação via curl solicitado para usuário: ${userId}${userEmail ? ` (${userEmail})` : ''}`);

    // Verificar se tem subscription
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { 
          error: `Usuário ${userId} não tem subscription registrada. O usuário precisa registrar a subscription primeiro através da interface web.`,
        },
        { status: 400 }
      );
    }

    // Verificar preferências
    const preferences = await prisma.pushNotificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences || !preferences.allEnabled) {
      return NextResponse.json(
        { 
          error: `Usuário ${userId} não tem notificações habilitadas. O usuário precisa ativar as notificações primeiro através da interface web.`,
        },
        { status: 400 }
      );
    }

    // Enviar notificação de teste (ignorar rate limit para teste)
    const success = await pushNotificationService.sendTestNotification(userId);

    if (!success) {
      console.log(`[API] ❌ Falha ao enviar notificação de teste para usuário ${userId}`);
      return NextResponse.json(
        { 
          error: 'Não foi possível enviar notificação. Verifique se o service worker está ativo e se há subscriptions válidas.',
          userId,
          subscriptionsCount: subscriptions.length,
        },
        { status: 400 }
      );
    }

    console.log(`[API] ✅ Notificação de teste enviada com sucesso para usuário ${userId}${userEmail ? ` (${userEmail})` : ''}`);
    return NextResponse.json({ 
      success: true,
      message: 'Notificação de teste enviada com sucesso!',
      userId,
      userEmail,
      subscriptionsCount: subscriptions.length,
    });
  } catch (error) {
    console.error('[API] ❌ Erro ao enviar notificação de teste via curl:', error);

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/test-curl
 * Retorna informações sobre como usar o endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/push/test-curl',
    method: 'POST',
    description: 'Endpoint para testar notificações push via curl. Pode ser usado para testar com o browser fechado.',
    authentication: {
      methods: [
        'Cookie: sb-xxx-auth-token=... (recomendado)',
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Body: {"userId": "user-id"} (sem autenticação)',
      ],
    },
    examples: [
      {
        description: 'Com userId no body (sem autenticação)',
        command: `curl -X POST http://localhost:3000/api/push/test-curl \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "user-id-here"}'`,
      },
      {
        description: 'Com cookie de autenticação',
        command: `curl -X POST http://localhost:3000/api/push/test-curl \\
  -H "Content-Type: application/json" \\
  -H "Cookie: sb-xxx-auth-token=YOUR_COOKIE_VALUE"`,
      },
      {
        description: 'Com Authorization header',
        command: `curl -X POST http://localhost:3000/api/push/test-curl \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`,
      },
    ],
    notes: [
      'O usuário precisa ter subscription registrada',
      'O usuário precisa ter notificações habilitadas',
      'O service worker precisa estar ativo',
      'Para testar com browser fechado, o PWA precisa estar instalado',
    ],
  });
}

