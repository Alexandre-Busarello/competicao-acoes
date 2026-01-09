import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || '';

function validateToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === CRON_SECRET_TOKEN && CRON_SECRET_TOKEN !== '';
}

/**
 * Endpoint para expirar assinaturas premium automaticamente
 * 
 * Busca todas as subscriptions com status 'active' e currentPeriodEnd <= now()
 * e as cancela, removendo o premium dos usuários.
 * 
 * Deve ser chamado diariamente via cron job.
 */
export async function POST(request: NextRequest) {
  try {
    // Valida token
    if (!validateToken(request)) {
      return NextResponse.json(
        { error: 'Não autorizado. Token inválido ou ausente.' },
        { status: 401 }
      );
    }

    const now = new Date();
    
    // Buscar subscriptions ativas que expiraram
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          lte: now,
        },
      },
      include: {
        user: true,
      },
    });

    let expiredCount = 0;
    const errors: string[] = [];

    // Cancelar cada subscription expirada
    for (const subscription of expiredSubscriptions) {
      try {
        // Atualizar subscription para canceled
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'canceled',
            updatedAt: new Date(),
          },
        });

        // Remover premium do usuário
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            isPremium: false,
          },
        });

        expiredCount++;
      } catch (error) {
        const errorMessage = `Erro ao expirar subscription ${subscription.id}: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      totalFound: expiredSubscriptions.length,
      errors: errors.length > 0 ? errors : undefined,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error expiring subscriptions:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar expiração de assinaturas',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

