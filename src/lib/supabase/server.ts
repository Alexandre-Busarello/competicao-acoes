import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Creates a Supabase client for server-side operations
 * Uses service role key for admin operations, otherwise uses anon key with user session
 */
export function createServerClient(useServiceRole = false) {
  if (useServiceRole && supabaseServiceRoleKey) {
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  const cookieStore = cookies();
  
  // Tentar ler cookie do Supabase Auth
  const supabaseProjectRef = supabaseUrl.split('//')[1].split('.')[0];
  const authCookieName = `sb-${supabaseProjectRef}-auth-token`;
  const authCookie = cookieStore.get(authCookieName);
  
  let accessToken: string | undefined;
  if (authCookie?.value) {
    try {
      const authData = JSON.parse(authCookie.value);
      accessToken = authData.access_token;
    } catch (e) {
      // Ignorar erro de parsing
    }
  }

  // Se não encontrou no cookie formatado, tentar cookie direto
  if (!accessToken) {
    const directToken = cookieStore.get('sb-access-token');
    accessToken = directToken?.value;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Cookie: cookieStore.toString(),
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
      },
    },
  });
}

/**
 * Gets the current user session on the server
 */
export async function getServerSession() {
  try {
    const supabase = createServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getServerSession:', error);
    return null;
  }
}

/**
 * Gets the current user on the server
 * Usa getUser() que valida o token diretamente (mais confiável que getSession)
 */
export async function getServerUser() {
  try {
    const cookieStore = cookies();
    const supabaseProjectRef = supabaseUrl.split('//')[1].split('.')[0];
    const authCookieName = `sb-${supabaseProjectRef}-auth-token`;
    const authCookie = cookieStore.get(authCookieName);
    
    console.log('Checking for auth cookie:', authCookieName);
    console.log('Cookie found:', !!authCookie);
    
    // Extrair token do cookie se disponível
    let accessToken: string | undefined;
    if (authCookie?.value) {
      try {
        const authData = JSON.parse(authCookie.value);
        accessToken = authData.access_token;
        console.log('Token extracted from cookie');
      } catch (e) {
        console.warn('Failed to parse auth cookie');
      }
    }
    
    // Se não encontrou no cookie formatado, tentar cookie direto
    if (!accessToken) {
      const directToken = cookieStore.get('sb-access-token');
      accessToken = directToken?.value;
      console.log('Using direct token cookie:', !!accessToken);
    }
    
    if (!accessToken) {
      console.log('No access token found in cookies');
      return null;
    }
    
    // Criar cliente com token explícito
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
    
    // Tentar getUser() primeiro (valida token diretamente)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError.message);
      return null;
    }
    
    console.log('User found:', user?.email);
    return user;
  } catch (error) {
    console.error('Error in getServerUser:', error);
    return null;
  }
}

