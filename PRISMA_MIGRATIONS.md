# Configuração de Duas URLs para Prisma

## Problema
- **Migrations** precisam de conexão direta (porta 5432, sem pgbouncer)
- **Aplicação** deve usar connection pooling (porta 6543, com pgbouncer)

## Solução

### 1. No `.env.local` (para a aplicação):
```env
# URL com pgbouncer para queries normais da aplicação
DATABASE_URL=postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2. No `.env` (na raiz, para migrations):
```env
# URL direta para migrations (sem pgbouncer)
DATABASE_URL=postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@db.gkciedlgmbrrxlpxhlae.supabase.co:5432/postgres
```

**Nota:** O Prisma CLI lê o `.env` da raiz do projeto para migrations, enquanto a aplicação Next.js usa `.env.local`.

## Como usar:

### Para rodar migrations:
```bash
# O Prisma CLI vai usar o .env (conexão direta)
npx prisma migrate dev
npx prisma migrate deploy
```

### Para a aplicação:
```bash
# A aplicação vai usar o .env.local (com pgbouncer)
yarn dev
```

## Alternativa: Usar variável de ambiente diretamente

Se preferir, você pode especificar a URL diretamente no comando:

```bash
# Para migrations (conexão direta)
DATABASE_URL="postgresql://postgres.gkciedlgmbrrxlpxhlae:Ght%24%24%401234%26%26T@db.gkciedlgmbrrxlpxhlae.supabase.co:5432/postgres" npx prisma migrate dev

# Para a aplicação (usa .env.local com pgbouncer normalmente)
yarn dev
```

## Verificar qual URL está sendo usada:

```bash
# Ver URL que o Prisma CLI vai usar
npx prisma db pull --print

# Ver URL que a aplicação está usando
node -e "console.log(process.env.DATABASE_URL)"
```

