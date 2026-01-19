import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/feed/banners/[bannerId]/track
 * Registra impressão ou clique de um banner
 * 
 * Body: {
 *   type: 'impression' | 'click',
 *   userId?: string,
 *   leadId?: string (apenas para click)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { bannerId: string } }
) {
  try {
    const { bannerId } = params;
    const body = await request.json();
    const { type, userId, leadId } = body;

    if (!type || (type !== 'impression' && type !== 'click')) {
      return NextResponse.json(
        { error: 'Tipo inválido. Deve ser "impression" ou "click"' },
        { status: 400 }
      );
    }

    // Verificar se banner existe
    const banner = await prisma.feedBanner.findUnique({
      where: { id: bannerId },
    });

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner não encontrado' },
        { status: 404 }
      );
    }

    if (type === 'impression') {
      // Registrar impressão
      await prisma.feedBannerImpression.create({
        data: {
          bannerId,
          userId: userId || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Impressão registrada com sucesso',
      });
    } else if (type === 'click') {
      // Registrar clique
      const click = await prisma.feedBannerClick.create({
        data: {
          bannerId,
          userId: userId || null,
          leadId: leadId || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Clique registrado com sucesso',
        bannerClickId: click.id,
      });
    }
  } catch (error) {
    console.error('Error tracking banner event:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar evento' },
      { status: 500 }
    );
  }
}

