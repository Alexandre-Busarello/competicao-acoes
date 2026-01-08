# Configuração Final de Variáveis de Ambiente

## Estrutura de Variáveis

Você precisa ter **duas variáveis** no seu `.env.local`:

### 1. `DATABASE_URL` - Para a aplicação (com pgbouncer)
Usada pelo Prisma Client nas queries normais da aplicação.

```env
DATABASE_URL=postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2. `DIRECT_DATABASE_URL` - Para migrations (sem pgbouncer)
Usada pelo Prisma CLI para executar migrations.

```env
DIRECT_DATABASE_URL=postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@db.gkciedlgmbrrxlpxhlae.supabase.co:5432/postgres
```

## Como funciona:

- **Schema Prisma** (`prisma/schema.prisma`): Usa `DIRECT_DATABASE_URL` para migrations
- **Prisma Client** (`src/lib/prisma/client.ts`): Usa `DATABASE_URL` (com pgbouncer) para queries
- **Prisma CLI** (`npx prisma migrate`): Usa `DIRECT_DATABASE_URL` do schema

## Exemplo completo do `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gkciedlgmbrrxlpxhlae.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_TYQdipWdfHosDJ4YN6IXfw_h6OoqusL
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Database - Para aplicação (com pgbouncer)
DATABASE_URL=postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Database - Para migrations (sem pgbouncer)
DIRECT_DATABASE_URL=postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@db.gkciedlgmbrrxlpxhlae.supabase.co:5432/postgres

# Kiwify
KIWIFY_WEBHOOK_SECRET=seu_webhook_secret
NEXT_PUBLIC_KIWIFY_PRODUCT_URL=https://seu-produto-kiwify.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Testes
ALLOW_TEST_WEBHOOK=true
```

## Comandos:

```bash
# Rodar migrations (usa DIRECT_DATABASE_URL)
npx prisma migrate dev

# Aplicação (usa DATABASE_URL com pgbouncer)
yarn dev
```

## Onde obter DIRECT_DATABASE_URL:

1. Supabase Dashboard → Settings → Database
2. Role até "Connection string"
3. Selecione "URI" (não Session mode)
4. Use porta **5432** (não 6543)
5. **Remova** `pgbouncer=true` se existir
6. O host geralmente é `db.[PROJECT_REF].supabase.co` (não `pooler`)

