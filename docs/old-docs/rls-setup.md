# Configuração de RLS (Row Level Security) para Tabelas de Perfil Público

## Visão Geral

Este documento descreve como habilitar RLS (Row Level Security) em todas as tabelas criadas para o sistema de perfil público, feed e medalhas. O objetivo é garantir que apenas o backend (via service role) possa acessar essas tabelas diretamente, bloqueando qualquer acesso público.

## Por que RLS?

- **Segurança**: Previne acesso direto às tabelas via Supabase Client público
- **Controle**: Garante que todas as operações passem pelo backend (APIs)
- **Auditoria**: Facilita rastreamento e logging de operações
- **Compliance**: Melhora conformidade com boas práticas de segurança

## Como Funciona

Quando RLS está habilitado **sem políticas públicas**:
- **Service Role**: Continua funcionando normalmente (ignora RLS completamente)
- **Anon/Authenticated Roles**: Bloqueados completamente (sem políticas = bloqueio total)
- **Backend APIs**: Funcionam normalmente (usam service role via Prisma)

**Importante**: Não criamos políticas públicas. Isso significa que qualquer tentativa de acesso via roles públicos (anon/authenticated) será bloqueada automaticamente. Apenas o service role (usado pelo Prisma no backend) terá acesso.

## Execução do Script

### Opção 1: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo do arquivo `prisma/migrations/enable_rls_public_profile_tables.sql`
4. Cole no editor SQL
5. Execute o script

### Opção 2: Via CLI do Supabase

```bash
# Se você tem Supabase CLI instalado
supabase db execute --file prisma/migrations/enable_rls_public_profile_tables.sql
```

### Opção 3: Via psql direto

```bash
# Conecte ao banco usando a connection string do Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f prisma/migrations/enable_rls_public_profile_tables.sql
```

## Tabelas Protegidas

O script habilita RLS nas seguintes tabelas:

1. **UserPerpetualProfitability** - Cache de rentabilidade perpétua
2. **FeedPost** - Posts do feed
3. **FeedComment** - Comentários nos posts
4. **FeedLike** - Likes nos posts
5. **UserFollow** - Relação de seguir usuários
6. **UserStats** - Estatísticas denormalizadas
7. **UserBlock** - Sistema de bloqueio
8. **Notification** - Notificações
9. **FeedTimeline** - Timeline pré-computada
10. **UserMedal** - Medalhas conquistadas
11. **ActionQueue** - Fila de ações

## Verificação

Após executar o script, você pode verificar se RLS está habilitado:

```sql
-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'UserPerpetualProfitability',
  'FeedPost',
  'FeedComment',
  'FeedLike',
  'UserFollow',
  'UserStats',
  'UserBlock',
  'Notification',
  'FeedTimeline',
  'UserMedal',
  'ActionQueue'
)
ORDER BY tablename;
```

Todas devem retornar `rls_enabled = true`.

## Verificar Políticas Criadas

```sql
-- Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'UserPerpetualProfitability',
  'FeedPost',
  'FeedComment',
  'FeedLike',
  'UserFollow',
  'UserStats',
  'UserBlock',
  'Notification',
  'FeedTimeline',
  'UserMedal',
  'ActionQueue'
)
ORDER BY tablename, policyname;
```

## Importante

⚠️ **Atenção**: Após habilitar RLS, certifique-se de que:

1. **Prisma Client está usando service role**: O Prisma Client deve estar configurado com a connection string que usa a service role key (não a anon key)

2. **Variável de ambiente correta**: Verifique que `DIRECT_DATABASE_URL` no `.env` usa a service role:
   ```
   DIRECT_DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[SERVICE_ROLE_KEY]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

3. **Teste as APIs**: Após habilitar RLS, teste todas as APIs para garantir que continuam funcionando

## Reverter (se necessário)

Se precisar desabilitar RLS temporariamente:

```sql
-- Desabilitar RLS em todas as tabelas
ALTER TABLE "UserPerpetualProfitability" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedPost" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedComment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedLike" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "UserFollow" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "UserStats" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "UserBlock" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedTimeline" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "UserMedal" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ActionQueue" DISABLE ROW LEVEL SECURITY;
```

## Troubleshooting

### Erro: "permission denied for table"

**Causa**: Prisma Client não está usando service role

**Solução**: Verifique a `DIRECT_DATABASE_URL` no `.env` e certifique-se de que usa a service role key

### Erro: "new row violates row-level security policy"

**Causa**: Tentando inserir dados sem service role

**Solução**: Certifique-se de que todas as operações passam pelo backend (APIs) que usa Prisma com service role

### APIs não funcionam após habilitar RLS

**Causa**: Prisma Client não está configurado corretamente

**Solução**: 
1. Verifique `DIRECT_DATABASE_URL` no `.env`
2. Reinicie o servidor Next.js
3. Verifique logs do Prisma para erros de conexão

## Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)

