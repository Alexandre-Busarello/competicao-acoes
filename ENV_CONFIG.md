# Configuração de Variáveis de Ambiente

## Duas URLs para Prisma

Você precisa de **duas URLs diferentes**:

1. **`DATABASE_URL`** - Com pgbouncer (para queries da aplicação)
2. **`DIRECT_DATABASE_URL`** - Sem pgbouncer (para migrations)

## Configuração no `.env.local`:

```env
# URL com pgbouncer - Para queries normais da aplicação
DATABASE_URL=postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# URL direta - Para migrations do Prisma (sem pgbouncer)
DIRECT_DATABASE_URL=postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@db.gkciedlgmbrrxlpxhlae.supabase.co:5432/postgres

# API Financeira - Para Ranking GGB
FINANCIAL_DATA_API_URL=https://seu-dominio.com/api/v1/financial-data
FINANCIAL_DATA_API_KEY=sua-api-key-aqui
```

## Como funciona:

- **Aplicação Next.js**: Usa `DATABASE_URL` (com pgbouncer) para todas as queries
- **Prisma Migrate**: Usa `DIRECT_DATABASE_URL` (sem pgbouncer) para executar migrations
- **Prisma Client**: Usa `DATABASE_URL` (com pgbouncer) para queries normais

## Onde obter a URL direta:

1. Supabase Dashboard → Settings → Database
2. Role até "Connection string"
3. Selecione "URI" (não Session mode)
4. Use a porta **5432** (não 6543)
5. **Remova** qualquer parâmetro `pgbouncer=true`

## Comandos:

```bash
# Rodar migrations (usa DIRECT_DATABASE_URL)
npx prisma migrate dev

# Aplicação normal (usa DATABASE_URL com pgbouncer)
yarn dev
```

