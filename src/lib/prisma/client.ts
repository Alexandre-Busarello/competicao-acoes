import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Para a aplicação, sempre usa DATABASE_URL (com pgbouncer)
// Para migrations, o Prisma CLI usa DIRECT_DATABASE_URL (definido no schema)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL, // Sempre usa DATABASE_URL (com pgbouncer) para queries
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

