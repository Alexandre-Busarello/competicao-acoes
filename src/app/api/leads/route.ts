import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, source, bannerClickId } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const emailLower = email.trim().toLowerCase();

    // Verificar se já existe lead com esse email
    const existingLead = await prisma.lead.findUnique({
      where: { email: emailLower },
    });

    if (existingLead) {
      // Não atualizar o lead, apenas verificar status
      // Verificar se existe usuário com esse email (lead convertido)
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: {
          subscription: true,
        },
      });

      // Verificar se usuário é premium baseado na data de expiração
      // Se existe subscription, usar apenas a data de expiração (não confiar em isPremium)
      // Se não existe subscription, usar isPremium como fallback (legado/cache)
      let isPremium = false;
      
      if (user?.subscription) {
        // Se existe subscription, verificar status e data de expiração
        isPremium =
          user.subscription.status === 'active' &&
          user.subscription.currentPeriodEnd !== null &&
          user.subscription.currentPeriodEnd > new Date();
      } else if (user) {
        // Se não existe subscription, usar isPremium como fallback
        isPremium = user.isPremium;
      }

      if (isPremium) {
        // Lead já foi convertido e usuário é premium
        return NextResponse.json({
          success: true,
          lead: existingLead,
          userExists: true,
          isPremium: true,
          action: 'send_magic_link',
          message: 'Você já possui uma conta premium. Um link de acesso será enviado para seu email.',
        });
      }

      // Lead existe mas não é premium - redirecionar para checkout
      return NextResponse.json({
        success: true,
        lead: existingLead,
        userExists: false,
        isPremium: false,
        action: 'redirect_checkout',
        message: 'Redirecionando para checkout...',
      });
    }

    // Criar novo lead
    const lead = await prisma.lead.create({
      data: {
        email: emailLower,
        name: name?.trim() || null,
        source: source || 'checkout_cta',
        checkoutStarted: true,
        bannerClickId: bannerClickId || null,
      },
    });

    return NextResponse.json({
      success: true,
      lead,
      userExists: false,
      isPremium: false,
      action: 'redirect_checkout',
      message: 'Lead criado com sucesso',
    });
  } catch (error) {
    console.error('Error creating/updating lead:', error);
    return NextResponse.json(
      { error: 'Erro ao processar lead' },
      { status: 500 }
    );
  }
}

