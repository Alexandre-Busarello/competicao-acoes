# Configuração de Row Level Security (RLS)

## Por que RLS é necessário?

O Supabase expõe uma API REST pública para suas tabelas. Sem RLS, qualquer pessoa com a API key pode acessar todos os dados. RLS garante que apenas usuários autenticados possam acessar seus próprios dados.

## Como aplicar RLS

### Opção 1: Via Supabase SQL Editor (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
3. Clique em **New query**
4. Abra o arquivo `prisma/supabase-rls.sql` e copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** ou pressione `Ctrl+Enter`

### Opção 2: Via Supabase CLI (se configurado)

```bash
supabase db execute --file prisma/supabase-rls.sql
```

## O que as políticas fazem?

### Tabelas Privadas (usuário só vê seus próprios dados no browser):
- **User**: Usuário só pode ver/editar seus próprios dados
- **Transaction**: Usuário só pode ver/editar suas próprias transações
- **Portfolio**: Usuário só pode ver/editar seu próprio portfolio
- **PortfolioAsset**: Usuário só pode ver assets do seu próprio portfolio
- **Subscription**: Usuário só pode ver sua própria assinatura

**Nota:** O ranking e dados de outros usuários vêm do backend (Prisma com service role) que bypassa RLS.

### Tabelas Privadas (apenas service role):
- **Lead**: Ninguém pode ver via API pública (apenas service role)

### Tabelas Públicas (todos podem ler):
- **BrunoPortfolio**: Todos podem ler (público)
- **BrunoPortfolioAsset**: Todos podem ler (público)

## Importante

### Arquitetura de Acesso:

1. **Frontend (Browser)** → Supabase Client com autenticação do usuário
   - RLS é aplicado
   - Usuário só vê seus próprios dados
   - Ranking vem do backend (não busca direto do banco)

2. **Backend (API Routes)** → Prisma com Service Role Key
   - RLS é bypassado automaticamente
   - Pode acessar todos os dados
   - Calcula ranking e envia para o frontend

### Regras:

- **Escrita**: Todos os usuários só podem criar/editar/deletar seus próprios dados
- **Leitura (Browser)**: Usuários só veem seus próprios dados
- **Leitura (Backend)**: Service role pode acessar todos os dados para ranking
- **API Pública**: Sem autenticação, apenas dados públicos (BrunoPortfolio) podem ser acessados

## Verificando se RLS está ativo

No Supabase Dashboard:
1. Vá em **Table Editor**
2. Selecione uma tabela
3. Você deve ver um badge "RLS ENABLED" ou "UNRESTRICTED" mudando para "RESTRICTED"

## Testando as políticas

### Teste 1: Acesso não autenticado
```javascript
// Deve retornar erro ou array vazio
const { data } = await supabase.from('User').select('*');
```

### Teste 2: Acesso autenticado
```javascript
// Deve retornar apenas os dados do usuário logado
const { data: { session } } = await supabase.auth.getSession();
const { data } = await supabase.from('User').select('*');
// Retorna apenas o usuário com authUserId = session.user.id
```

### Teste 3: Portfolio do Bruno (público)
```javascript
// Deve funcionar mesmo sem autenticação
const { data } = await supabase.from('BrunoPortfolio').select('*');
```

