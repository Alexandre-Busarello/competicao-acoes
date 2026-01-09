import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

/**
 * API helper para criar usuário no banco se não existir
 * Chamado após autenticação bem-sucedida (Google OAuth, magic link, etc)
 * POST /api/auth/create-user-if-needed
 * Body: { authUserId: "uuid", email: "user@example.com", name?: "Nome" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authUserId, email, name } = body;

    if (!authUserId || !email) {
      return NextResponse.json(
        { error: 'authUserId e email são obrigatórios' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verificar primeiro por EMAIL (chave principal)
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (user) {
      // Usuário já existe por email
      // Verificar se o authUserId é diferente (usuário está usando outro método de login)
      if (user.authUserId !== authUserId) {
        // Verificar se o authUserId antigo ainda existe no Supabase Auth
        const supabase = createServerClient(true);
        const { data: oldAuthUser } = await supabase.auth.admin.getUserById(user.authUserId);
        
        if (!oldAuthUser?.user) {
          // AuthUserId antigo não existe mais, atualizar para o novo
          // Isso permite associar múltiplos métodos de login à mesma conta
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              authUserId,
            },
          });
        }
        // Se o authUserId antigo ainda existe, mantemos (usuário pode ter múltiplos métodos)
        // O Supabase Auth gerencia múltiplas identidades (Google, email/password) para o mesmo authUserId
      }
      // Se authUserId já corresponde, não precisa fazer nada
    } else {
      // Usuário não existe, verificar se existe por authUserId (caso raro)
      const existingByAuthUserId = await prisma.user.findUnique({
        where: { authUserId },
      });

      if (existingByAuthUserId) {
        // Se existe por authUserId mas email é diferente, atualizar email
        user = await prisma.user.update({
          where: { id: existingByAuthUserId.id },
          data: {
            email: emailLower,
          },
        });
      } else {
        // Criar novo usuário
        const userName = name?.trim() || generateInvestorName(emailLower);
        const avatarUrl = await generateAvatarUrlWithFallback(emailLower, userName);

        user = await prisma.user.create({
          data: {
            authUserId,
            email: emailLower,
            name: userName,
            avatarUrl,
            isPremium: false,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('Error creating user if needed:', error);
    return NextResponse.json(
      {
        error: 'Erro ao criar usuário',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

