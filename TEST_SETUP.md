# Configuração de Testes Locais

Este documento explica como configurar o ambiente de testes local para testar a criação de usuários sem precisar de um webhook real do Kiwify.

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# Kiwify (opcional para testes locais)
KIWIFY_WEBHOOK_SECRET=your_kiwify_webhook_secret
NEXT_PUBLIC_KIWIFY_PRODUCT_URL=https://your-kiwify-product-url.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# IMPORTANTE: Habilitar modo de teste
ALLOW_TEST_WEBHOOK=true
```

### 2. Executar Migrations

Antes de testar, certifique-se de que as migrations foram executadas:

```bash
npx prisma migrate dev --name init
```

## Como Testar

### Opção 1: Página de Teste (Recomendado)

1. Inicie o servidor de desenvolvimento:
   ```bash
   yarn dev
   ```

2. Acesse a página de teste:
   ```
   http://localhost:3000/test/create-user
   ```

3. Preencha o formulário:
   - **Email**: Qualquer email válido (ex: `teste@example.com`)
   - **Nome**: Opcional

4. Clique em "Criar Usuário de Teste"

5. O sistema irá:
   - Criar usuário no Supabase Auth
   - Criar registro no banco de dados
   - Criar assinatura ativa
   - Enviar magic link para o email (se configurado)

### Opção 2: API Direta

Você também pode chamar a API diretamente:

```bash
curl -X POST http://localhost:3000/api/webhooks/kiwify/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "name": "Nome do Teste"
  }'
```

## O que acontece no teste?

1. **Lead**: Se existir um lead com o email informado, ele será marcado como convertido
2. **Supabase Auth**: Cria um usuário no Supabase Auth (ou usa existente)
3. **Banco de Dados**: Cria/atualiza registro na tabela `users`
4. **Assinatura**: Cria assinatura com status `active` e período de 30 dias
5. **Avatar**: Gera avatar usando Gravatar (com fallback para DiceBear)
6. **Magic Link**: Envia magic link para o email (se configurado)

## Verificando o Resultado

Após criar o usuário de teste:

1. **Verificar no Supabase Dashboard**:
   - Vá em Authentication > Users
   - Você deve ver o usuário criado

2. **Verificar no Banco de Dados**:
   ```bash
   npx prisma studio
   ```
   - Verifique as tabelas `User`, `Subscription`, e `Lead`

3. **Fazer Login**:
   - Acesse a aplicação
   - Use o magic link enviado por email
   - Ou faça login diretamente com o email (se senha foi configurada)

## Segurança

⚠️ **IMPORTANTE**: 

- A página `/test/create-user` só funciona em modo de desenvolvimento
- O webhook de teste (`/api/webhooks/kiwify/test`) só funciona se `ALLOW_TEST_WEBHOOK=true`
- **NUNCA** configure `ALLOW_TEST_WEBHOOK=true` em produção
- Em produção, o webhook real (`/api/webhooks/kiwify`) requer autenticação via `KIWIFY_WEBHOOK_SECRET`

## Limpeza

Para remover usuários de teste:

```sql
-- No Prisma Studio ou direto no banco
DELETE FROM "Subscription" WHERE "kiwifyId" = 'test-subscription-id';
DELETE FROM "User" WHERE "email" LIKE '%test%';
DELETE FROM "Lead" WHERE "email" LIKE '%test%';
```

Ou use o Supabase Dashboard para deletar usuários de teste.

