import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * API para gerenciar senha do usuário
 * PATCH /api/user/password
 * Body: { currentPassword?: string, newPassword: string }
 * 
 * Se não tiver senha atual, define nova senha
 * Se tiver senha atual, altera senha
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Usar service role para operações administrativas
    const supabaseAdmin = createServerClient(true);
    const supabase = createServerClient();

    // Buscar usuário do Supabase Auth usando o authUserId da sessão
    const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
      session.user.authUserId
    );

    if (getUserError || !authUser.user) {
      console.error('Error getting user:', getUserError);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do usuário' },
        { status: 500 }
      );
    }

    // Se forneceu senha atual, verificar se está correta antes de alterar
    if (currentPassword) {
      // Verificar senha atual fazendo login com cliente normal
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authUser.user.email!,
        password: currentPassword,
      });

      if (verifyError) {
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 401 }
        );
      }
    }

    // Atualizar senha usando service role (admin)
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      session.user.authUserId,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: currentPassword ? 'Senha alterada com sucesso!' : 'Senha definida com sucesso!',
    });
  } catch (error) {
    console.error('Error processing password update:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/password
 * Verifica se usuário tem senha configurada
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Usar service role para buscar dados do usuário
    const supabaseAdmin = createServerClient(true);

    // Buscar usuário do Supabase Auth usando authUserId
    const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
      session.user.authUserId
    );

    if (getUserError || !authUser.user) {
      console.error('Error getting user:', getUserError);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do usuário' },
        { status: 500 }
      );
    }

    // Verificar se tem senha (usuários OAuth/magic link podem não ter senha)
    // Se o usuário tem encrypted_password, significa que tem senha
    const hasPassword = !!(authUser.user as any).encrypted_password;

    return NextResponse.json({
      hasPassword,
    });
  } catch (error) {
    console.error('Error checking password:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

