import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Verifica se estamos em um ambiente Node.js (servidor)
 * Prisma Client só deve ser usado no servidor, nunca no cliente (browser)
 */
function isServer(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined';
}

/**
 * Constrói a URL de conexão com parâmetros de connection pooling otimizados para serverless
 * Esses parâmetros ajudam a evitar esgotamento de conexões em ambientes como Vercel
 */
function getDatabaseUrl(): string | undefined {
  // Se não estamos no servidor, retornar undefined imediatamente
  // Isso evita que o código seja executado no cliente (browser)
  if (!isServer()) {
    return undefined;
  }

  const baseUrl = process.env.DATABASE_URL;
  
  // Se DATABASE_URL não estiver definido, retornar undefined
  // O Prisma vai usar a URL do datasource definido no schema.prisma
  // IMPORTANTE: Certifique-se de que DATABASE_URL está configurado na Vercel!
  if (!baseUrl) {
    // Só logar no servidor, nunca no cliente
    if (process.env.NODE_ENV === 'production' && isServer()) {
      console.error(
        '⚠️ DATABASE_URL is not defined in production! ' +
        'Please set DATABASE_URL in your Vercel environment variables.'
      );
    }
    return undefined;
  }

  try {
    // Tentar usar URL constructor para manipular parâmetros
    const url = new URL(baseUrl);
    
    // Parâmetros de connection pooling para serverless:
    // - connection_limit: Limita conexões por instância do Prisma Client (1-2 para serverless)
    // - pool_timeout: Tempo máximo (segundos) para aguardar conexão disponível
    // - connect_timeout: Tempo máximo (segundos) para estabelecer conexão
    // - statement_cache_size: Tamanho do cache de statements (0 desabilita para pgbouncer)
    
    // Para serverless, usar connection_limit baixo (1-2) pois cada função serverless
    // deve usar poucas conexões, e o pgbouncer gerencia o pool global
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '1');
    }
    
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '10');
    }
    
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '5');
    }
    
    // Para pgbouncer, desabilitar statement cache
    if (!url.searchParams.has('statement_cache_size')) {
      url.searchParams.set('statement_cache_size', '0');
    }

    return url.toString();
  } catch (error) {
    // Se falhar ao parsear a URL (pode acontecer com URLs complexas),
    // retornar a URL original e adicionar parâmetros manualmente
    const separator = baseUrl.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    
    // Verificar se os parâmetros já existem na URL
    if (!baseUrl.includes('connection_limit=')) {
      params.append('connection_limit', '1');
    }
    if (!baseUrl.includes('pool_timeout=')) {
      params.append('pool_timeout', '10');
    }
    if (!baseUrl.includes('connect_timeout=')) {
      params.append('connect_timeout', '5');
    }
    if (!baseUrl.includes('statement_cache_size=')) {
      params.append('statement_cache_size', '0');
    }
    
    return params.toString() ? `${baseUrl}${separator}${params.toString()}` : baseUrl;
  }
}

/**
 * Cria uma instância do Prisma Client apenas no servidor
 * Nunca deve ser executado no cliente (browser)
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();

  return new PrismaClient({
    // Sempre passar a URL explicitamente se disponível
    // Se databaseUrl for undefined, o Prisma vai usar a URL do datasource do schema.prisma
    // (que usa DIRECT_DATABASE_URL - não ideal, mas evita quebrar o build)
    ...(databaseUrl && {
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    }),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Para a aplicação, sempre usa DATABASE_URL (com pgbouncer)
// Para migrations, o Prisma CLI usa DIRECT_DATABASE_URL (definido no schema)
// CRÍTICO: Sempre usar singleton, mesmo em produção!
// Em ambientes serverless (Vercel), cada função pode criar uma nova instância
// se não usarmos o singleton global. Isso causa esgotamento de conexões.
// 
// IMPORTANTE: Este módulo só deve ser importado em Server Components ou API routes.
// Se importado no cliente, vai causar erro em runtime quando tentar usar.
export const prisma = (() => {
  // Se não estamos no servidor, retornar um proxy que lança erro quando usado
  if (!isServer()) {
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          'Prisma Client cannot be used in the browser. ' +
          'It should only be imported in Server Components or API routes.'
        );
      },
    });
  }

  // No servidor, criar ou reutilizar a instância singleton
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();

    // Garantir desconexão adequada ao encerrar o processo
    if (typeof process !== 'undefined' && process.on) {
      const gracefulShutdown = async () => {
        await globalForPrisma.prisma?.$disconnect();
      };
      
      process.on('beforeExit', gracefulShutdown);
      process.on('SIGINT', gracefulShutdown);
      process.on('SIGTERM', gracefulShutdown);
    }
  }

  return globalForPrisma.prisma;
})();

