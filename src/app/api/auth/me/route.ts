import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { generateInvestorName } from '@/lib/utils/generate-investor-name';
import { generateAvatarUrlWithFallback } from '@/lib/utils/avatar';
import { createServerClient } from '@/lib/supabase/server';

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
      
      console.log('User created in database:', user.email, 'id:', user.id);
    }

    // Verificar se tem assinatura ativa
    const hasActiveSubscription =
      user.subscription?.status === 'active' &&
      (!user.subscription.currentPeriodEnd ||
        user.subscription.currentPeriodEnd > new Date());

    const userData = {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isPremium: hasActiveSubscription || user.isPremium,
    };
    
    console.log('Returning user data:', userData.email, 'isPremium:', userData.isPremium);
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ user: null });
  }
}

