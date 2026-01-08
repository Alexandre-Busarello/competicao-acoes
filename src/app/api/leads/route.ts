import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, source } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe lead com esse email
    const existingLead = await prisma.lead.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingLead) {
      // Atualizar lead existente
      const updatedLead = await prisma.lead.update({
        where: { email: email.trim().toLowerCase() },
        data: {
          name: name || existingLead.name,
          source: source || existingLead.source,
          checkoutStarted: true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        lead: updatedLead,
        message: 'Lead atualizado com sucesso',
      });
    }

    // Criar novo lead
    const lead = await prisma.lead.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        source: source || 'checkout_cta',
        checkoutStarted: true,
      },
    });

    return NextResponse.json({
      success: true,
      lead,
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

