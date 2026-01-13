import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Constrói a URL de conexão com parâmetros de connection pooling otimizados para serverless
 * Esses parâmetros ajudam a evitar esgotamento de conexões em ambientes como Vercel
 */
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined');
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

// Para a aplicação, sempre usa DATABASE_URL (com pgbouncer)
// Para migrations, o Prisma CLI usa DIRECT_DATABASE_URL (definido no schema)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// CRÍTICO: Sempre usar singleton, mesmo em produção!
// Em ambientes serverless (Vercel), cada função pode criar uma nova instância
// se não usarmos o singleton global. Isso causa esgotamento de conexões.
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Garantir desconexão adequada ao encerrar o processo
if (typeof process !== 'undefined' && process.on) {
  const gracefulShutdown = async () => {
    await prisma.$disconnect();
  };
  
  process.on('beforeExit', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

