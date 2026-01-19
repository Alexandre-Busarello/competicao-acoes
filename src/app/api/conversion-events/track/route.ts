import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/conversion-events/track
 * Registra eventos de conversão (visualização, clique, conversão)
 * 
 * Body: {
 *   type: 'blur_overlay' | 'profile_checkout',
 *   event: 'view' | 'click',
 *   userId?: string,
 *   leadId?: string (apenas para click)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, event, userId, leadId } = body;

    if (!type || (type !== 'blur_overlay' && type !== 'profile_checkout' && type !== 'signup_banner')) {
      return NextResponse.json(
        { error: 'Tipo inválido. Deve ser "blur_overlay", "profile_checkout" ou "signup_banner"' },
        { status: 400 }
      );
    }

    if (!event || (event !== 'view' && event !== 'click')) {
      return NextResponse.json(
        { error: 'Evento inválido. Deve ser "view" ou "click"' },
        { status: 400 }
      );
    }

    if (event === 'view') {
      // Registrar visualização
      await prisma.conversionEvent.create({
        data: {
          type,
          userId: userId || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Visualização registrada com sucesso',
      });
    } else if (event === 'click') {
      // Buscar evento de visualização mais recente para este tipo e usuário
      // Se não houver visualização, criar uma nova
      let conversionEvent = await prisma.conversionEvent.findFirst({
        where: {
          type,
          userId: userId || null,
          clickedAt: null, // Ainda não foi clicado
        },
        orderBy: {
          viewedAt: 'desc',
        },
      });

      if (!conversionEvent) {
        // Criar novo evento com visualização e clique simultâneos
        conversionEvent = await prisma.conversionEvent.create({
          data: {
            type,
            userId: userId || null,
            leadId: leadId || null,
            clickedAt: new Date(),
          },
        });
      } else {
        // Atualizar evento existente com clique
        conversionEvent = await prisma.conversionEvent.update({
          where: { id: conversionEvent.id },
          data: {
            clickedAt: new Date(),
            leadId: leadId || null,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Clique registrado com sucesso',
        eventId: conversionEvent.id,
      });
    }
  } catch (error) {
    console.error('Error tracking conversion event:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar evento' },
      { status: 500 }
    );
  }
}

