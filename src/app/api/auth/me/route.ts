import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';
import { createServerClient } from '@/lib/supabase/server';
import { generateSlugAfterUserCreation } from '@/lib/utils/user-slug-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== /api/auth/me called ===');
    
    // Buscar usuário do Supabase Auth primeiro
    const supabaseUser = await getServerUser();
    
    if (!supabaseUser) {
      console.log('No Supabase user found in /api/auth/me');
      return NextResponse.json({ user: null });
    }
    
    console.log('Supabase user found:', supabaseUser.email, 'id:', supabaseUser.id);

    // Buscar dados do usuário no banco
    let user = await prisma.user.findUnique({
      where: { authUserId: supabaseUser.id },
      include: {
        subscription: true,
      },
    });

    // Se usuário não existe no banco, criar automaticamente
    if (!user) {
      console.log('User not found in database, creating...');
      
      const emailLower = (supabaseUser.email || '').toLowerCase().trim();
      const userName = supabaseUser.user_metadata?.name || generateInvestorName(emailLower);
      const avatarUrl = await generateAvatarUrlWithFallback(
        emailLower,
        userName
      );

      user = await prisma.user.create({
        data: {
          authUserId: supabaseUser.id,
          email: emailLower,
          name: userName,
          avatarUrl,
          isPremium: false,
        },
        include: {
          subscription: true,
        },
      });
      
      // Gerar slug inicial para o novo usuário
      await generateSlugAfterUserCreation(user.id);
      
      console.log('User created in database:', user.email, 'id:', user.id);
    }

    // Verificar se tem assinatura ativa baseado na data de expiração
    // Se existe subscription, usar apenas a data de expiração (não confiar em isPremium)
    // Se não existe subscription, usar isPremium como fallback (legado/cache)
    let isPremium = false;
    
    if (user.subscription) {
      // Se existe subscription, verificar status e data de expiração
      isPremium =
        user.subscription.status === 'active' &&
        user.subscription.currentPeriodEnd !== null &&
        user.subscription.currentPeriodEnd > new Date();
    } else {
      // Se não existe subscription, usar isPremium como fallback
      isPremium = user.isPremium;
    }

    const userData = {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isPremium,
    };
    
    console.log('Returning user data:', userData.email, 'isPremium:', userData.isPremium);
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ user: null });
  }
}

