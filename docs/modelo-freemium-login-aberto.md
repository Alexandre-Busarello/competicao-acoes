# Transformação para Modelo Freemium com Login Aberto

## Data: 09/01/2026

## Objetivo

Transformar a plataforma de 100% fechada (checkout obrigatório) para modelo freemium onde:
- Usuários gratuitos podem participar do ranking e ver apenas sua própria carteira completa
- Usuários premium podem ver qualquer carteira
- Login não requer mais checkout obrigatório
- Múltiplos métodos de autenticação disponíveis (Google, magic link, email/senha)

## Mudanças Implementadas

### 1. Autenticação e Criação de Usuários

#### 1.1. API de Magic Link (`src/app/api/auth/magic-link/route.ts`)
- **Removida** verificação obrigatória de usuário existente
- **Implementada** criação automática de usuário no Supabase Auth e banco se não existir
- **Verifica primeiro por EMAIL** (chave principal)
- Se usuário existe por email, associa o método de login à conta existente
- Usuários criados via magic link são gratuitos por padrão (`isPremium: false`)

#### 1.2. API de Signup/Login com Email e Senha (`src/app/api/auth/signup/route.ts`)
- **Criada** nova API para cadastro/login com email e senha
- **Verifica primeiro por EMAIL** (chave principal)
- Se usuário existe por email mas não tem senha no Supabase Auth, permite criar senha
- Se usuário existe e tem senha, faz login normalmente
- Se usuário criou conta com outro método (Google, magic link), associa senha à conta existente
- Suporta criação automática de conta no primeiro uso
- Usuários criados são gratuitos por padrão

#### 1.3. API de Login Social Google (`src/app/api/auth/google/route.ts`)
- **Criada** API para iniciar fluxo OAuth do Google
- Redireciona para página de autorização do Google
- Callback cria usuário automaticamente se não existir

#### 1.4. API Helper para Criar Usuário (`src/app/api/auth/create-user-if-needed/route.ts`)
- **Criada** API helper chamada após autenticação bem-sucedida
- **Verifica primeiro por EMAIL** (chave principal)
- Se usuário existe por email, associa o novo método de login (authUserId) à conta existente
- Se authUserId antigo não existe mais, atualiza para o novo método
- Se authUserId antigo ainda existe, mantém (Supabase Auth gerencia múltiplas identidades)
- Cria usuário no banco se não existir
- Usado no callback de autenticação (Google, magic link)

#### 1.5. Página de Login (`src/app/auth/login/page.tsx`)
- **Adicionado** botão de login com Google
- **Adicionado** formulário de login com email e senha
- **Mantida** opção de magic link (com tabs para escolher método)
- **Removida** mensagem de "checkout obrigatório"
- **Atualizado** CTA opcional de upgrade para premium (menos proeminente)

#### 1.6. Callback de Autenticação (`src/app/auth/callback/page.tsx`)
- **Adicionada** chamada para criar usuário automaticamente após autenticação
- Funciona para Google OAuth, magic link e outros métodos

### 2. Gerenciamento de Senha

#### 2.1. API de Gerenciamento de Senha (`src/app/api/user/password/route.ts`)
- **Criada** API para definir/alterar senha do usuário
- **GET**: Verifica se usuário tem senha configurada
- **PATCH**: Define senha (se não tiver) ou altera senha (se já tiver)
- Validação de senha forte (mínimo 6 caracteres)

#### 2.2. Componente PasswordManager (`src/components/profile/PasswordManager.tsx`)
- **Criado** componente para gerenciar senha na página de perfil
- Mostra formulário diferente se usuário tem ou não tem senha
- Validação e feedback visual de sucesso/erro
- Suporte para mostrar/ocultar senha

#### 2.3. Página de Perfil (`src/app/(main)/perfil/page.tsx`)
- **Adicionado** componente `PasswordManager` após `ProfileInfo`
- Usuários podem configurar senha mesmo tendo entrado via Google ou magic link

### 3. Transações e Ranking

#### 3.1. API de Transações (`src/app/api/transactions/route.ts`)
- **Removido** `requirePremium()` → Alterado para `requireAuth()` apenas
- Usuários gratuitos podem cadastrar transações normalmente
- Usuários gratuitos podem participar do ranking

#### 3.2. TransactionModal (`src/components/portfolio/TransactionModal.tsx`)
- **Removido** bloqueio de cadastro para não-premium
- **Removido** CTA de checkout do modal
- **Removido** import não utilizado de `CheckoutCTA`

### 4. CTAs e Vendas

#### 4.1. CheckoutCTA (`src/components/checkout/CheckoutCTA.tsx`)
- **Atualizados** textos padrão:
  - `title`: "Upgrade para Premium"
  - `description`: "Desbloqueie funcionalidades exclusivas com assinatura premium"
  - `buttonText`: "Fazer Upgrade"

#### 4.2. LeadCaptureModal (`src/components/checkout/LeadCaptureModal.tsx`)
- **Atualizado** título para "Upgrade para Premium"
- **Atualizada** descrição padrão
- **Adicionado** aviso importante sobre usar mesmo email do cadastro no checkout Kiwify
- **Adicionado** uso de `useAuth` para pré-preencher email quando usuário está autenticado
- Banner amarelo destacando importância do email correto

#### 4.3. ProtectedAction (`src/components/checkout/ProtectedAction.tsx`)
- **Atualizada** mensagem: "Esta funcionalidade é exclusiva para assinantes premium"

#### 4.4. CheckoutSection (`src/components/profile/CheckoutSection.tsx`)
- **Alterado** título de "Entre para a Elite" para "Upgrade para Premium"
- **Removida** menção a "participar do ranking" (já é gratuito)
- **Atualizado** texto do botão para "Fazer Upgrade para Premium"
- **Adicionado** aviso importante sobre email do Kiwify quando usuário está autenticado
- Banner amarelo mostrando email da conta

#### 4.5. EmptyRankingState (`src/components/ranking/EmptyRankingState.tsx`)
- **Atualizadas** mensagens para modelo freemium:
  - Não autenticado: "Crie sua conta gratuita e comece a competir"
  - Autenticado gratuito: "Cadastre transações para aparecer no ranking"
- **Alterados** CTAs:
  - Não autenticado: Botão "Criar Conta Grátis" + "Já tenho conta"
  - Gratuito: Botão "Cadastrar Transação" + CTA opcional de upgrade

#### 4.6. BlurOverlay (`src/components/portfolio/BlurOverlay.tsx`)
- **Atualizado** texto para focar em upgrade para premium
- Botão agora diz "Fazer Upgrade para Premium"

### 5. Acesso a Carteiras

#### 5.1. Páginas de Carteira
- **`src/app/carteira/[id]/mensal/[year]/[month]/page.tsx`**
- **`src/app/carteira/[id]/anual/[year]/page.tsx`**
- **Adicionada** verificação `canAccess = isOwner || isPremium`
- **Implementada** lógica condicional:
  - Se `canAccess`: mostra conteúdo completo
  - Se não `canAccess`: mostra conteúdo com blur + BlurOverlay
- Seletor de período só aparece para `canAccess`

#### 5.2. Componentes de Carteira
- **`src/components/portfolio/AssetList.tsx`**:
  - **Adicionada** prop `isOwner`
  - **Implementada** lógica `canView = isPremium || isOwner`
  - Ativos visíveis se `canView` ou se `asset.visible` ou se é o primeiro

- **`src/components/portfolio/UserTransactionList.tsx`**:
  - **Adicionada** prop `isOwner`
  - **Implementada** lógica `canView = isPremium || isOwner`
  - Transações visíveis se `canView`

### 6. Webhook Kiwify

#### 6.1. Webhook (`src/app/api/webhooks/kiwify/route.ts`)
- **Atualizado** para verificar se usuário já existe no banco por EMAIL (chave principal)
- **Implementada** lógica:
  - Se usuário existe por email: atualiza para premium e cria/atualiza subscription
  - Se authUserId é diferente: verifica se antigo ainda existe e atualiza se necessário
  - Se não existe: cria novo usuário premium
- **Garantido** que usuários existentes sejam atualizados, não duplicados
- Usuários criados começam com `isPremium: false` e são atualizados pela subscription

## Fluxo de Dados

### Criação de Conta Gratuita
1. Usuário acessa `/auth/login`
2. Escolhe método: Google, Magic Link ou Email/Senha
3. Sistema cria usuário automaticamente no Supabase Auth e banco
4. Usuário é criado com `isPremium: false`
5. Usuário pode cadastrar transações e participar do ranking

### Upgrade para Premium
1. Usuário faz checkout no Kiwify usando mesmo email da conta
2. Webhook recebe confirmação de pagamento
3. Sistema verifica se usuário existe (gratuito)
4. Sistema atualiza usuário para premium e cria/atualiza subscription
5. Usuário ganha acesso completo

### Acesso a Carteiras
- **Própria carteira**: Sempre visível (gratuito ou premium)
- **Outras carteiras**: Requer premium
- Se não-premium tentar acessar outra carteira: vê conteúdo com blur + CTA de upgrade

## Configurações Necessárias

### Supabase Dashboard
1. **Habilitar Google OAuth**:
   - Authentication → Providers → Google
   - Configurar Client ID e Client Secret
   - Adicionar redirect URL: `https://seu-dominio.com/auth/callback`

2. **Habilitar Email/Password**:
   - Authentication → Providers → Email
   - Habilitar "Enable email provider"

3. **Habilitar Magic Link**:
   - Authentication → Providers → Email
   - Habilitar "Enable email provider"
   - Configurar Site URL: `https://seu-dominio.com`

## Lógica de Associação de Métodos de Login

### Princípio: Email como Chave Principal
- Todas as verificações de usuário são feitas por **EMAIL primeiro**
- Se usuário existe por email, usa a conta existente independente do método de login
- Múltiplos métodos de login (Google, magic link, email/senha) são associados à mesma conta

### Fluxo de Associação
1. **Usuário cria conta com Google**:
   - Email: `user@example.com`
   - AuthUserId: `google-auth-id-123`
   - Criado no banco com `authUserId: google-auth-id-123`

2. **Usuário tenta fazer login com email/senha**:
   - Sistema verifica por email `user@example.com`
   - Encontra conta existente
   - Se Supabase Auth permite adicionar senha ao mesmo authUserId, associa senha
   - Se Supabase Auth cria novo authUserId, atualiza no banco (caso raro)

3. **Usuário tenta fazer login com magic link**:
   - Sistema verifica por email `user@example.com`
   - Encontra conta existente
   - Usa a mesma conta, não cria duplicado

### Preservação de Métodos
- Se usuário já tem senha e entra com Google: mantém senha, permite login com Google também
- Se usuário entra com Google e depois define senha: mantém acesso via Google, adiciona acesso via senha
- Supabase Auth gerencia múltiplas identidades (identities) para o mesmo authUserId

## Considerações Importantes

### Modelo de Negócios
- Ranking é público (visível para todos, incluindo não autenticados)
- Usuários gratuitos podem participar do ranking normalmente
- Usuários gratuitos podem cadastrar transações e ver sua própria carteira completa
- Apenas visualização de outras carteiras requer premium
- Checkout não é mais obrigatório para criar conta ou participar do ranking

### Autenticação
- **Email é a chave principal**: Todas as verificações de usuário são feitas por email primeiro
- **Múltiplos métodos de login**: Usuário pode usar Google, magic link ou email/senha para a mesma conta
- **Associação automática**: Se usuário tenta usar qualquer método e o email já está na base, permite login e associa o método
- **Preservação de métodos**: Se usuário já tem senha e entra com Google, mantém a senha mas permite login com Google também
- Webhook do Kiwify atualiza usuários existentes, não cria duplicados
- Usuários que entram via Google ou magic link podem configurar senha depois na página de perfil
- Usuários que já têm senha podem alterá-la na página de perfil
- Verificação de senha usa `getUser()` do Supabase Auth e checa `encrypted_password`

### CTAs e Conversão
- Todos os CTAs focam em "Upgrade para Premium" ao invés de "Acesso Premium"
- Benefícios do premium focam em ver outras carteiras e funcionalidades exclusivas
- Não mencionar "participar do ranking" como benefício premium (já é gratuito)
- CTAs são opcionais e não bloqueantes para usuários gratuitos
- **IMPORTANTE**: Reforçado em todos os pontos de checkout que o email informado no Kiwify DEVE ser o mesmo do cadastro na plataforma
  - Avisos visuais destacados (banners amarelos/laranjas) antes do checkout
  - Mostra o email que será usado quando usuário está autenticado
  - Explica que emails diferentes podem causar problemas na vinculação da assinatura

## Arquivos Criados

1. `src/app/api/auth/signup/route.ts` - API de signup/login email/senha
2. `src/app/api/auth/google/route.ts` - API de login Google OAuth
3. `src/app/api/auth/create-user-if-needed/route.ts` - Helper para criar usuário
4. `src/app/api/user/password/route.ts` - API de gerenciamento de senha
5. `src/components/profile/PasswordManager.tsx` - Componente de gerenciamento de senha

## Arquivos Modificados

1. `src/app/api/auth/magic-link/route.ts` - Criação automática, verificação por email primeiro
2. `src/app/api/auth/signup/route.ts` - Verificação por email primeiro, associação de métodos
3. `src/app/api/auth/create-user-if-needed/route.ts` - Verificação por email primeiro, associação de métodos
4. `src/app/auth/login/page.tsx` - Múltiplos métodos de login
5. `src/app/auth/callback/page.tsx` - Criação automática de usuários
6. `src/app/api/transactions/route.ts` - Removido requirePremium
7. `src/components/portfolio/TransactionModal.tsx` - Removido bloqueio premium
8. `src/components/checkout/CheckoutCTA.tsx` - Textos atualizados
9. `src/components/checkout/LeadCaptureModal.tsx` - Textos e aviso de email
10. `src/components/checkout/ProtectedAction.tsx` - Mensagem atualizada
11. `src/components/profile/CheckoutSection.tsx` - Benefícios e aviso de email
12. `src/components/ranking/EmptyRankingState.tsx` - Mensagens freemium
13. `src/components/portfolio/BlurOverlay.tsx` - Texto atualizado
14. `src/app/carteira/[id]/mensal/[year]/[month]/page.tsx` - Verificação de acesso
15. `src/app/carteira/[id]/anual/[year]/page.tsx` - Verificação de acesso
16. `src/components/portfolio/AssetList.tsx` - Suporte a isOwner
17. `src/components/portfolio/UserTransactionList.tsx` - Suporte a isOwner
18. `src/app/api/webhooks/kiwify/route.ts` - Verificação por email primeiro, atualização de usuários existentes
19. `src/app/(main)/perfil/page.tsx` - Adicionado PasswordManager

## Testes Recomendados

1. **Criação de conta gratuita**:
   - Via Google OAuth
   - Via Magic Link
   - Via Email/Senha

2. **Cadastro de transações**:
   - Usuário gratuito deve conseguir cadastrar
   - Transações devem aparecer no ranking

3. **Acesso a carteiras**:
   - Própria carteira: deve ser visível para gratuito
   - Outras carteiras: deve mostrar blur para gratuito
   - Premium: deve ver todas as carteiras

4. **Gerenciamento de senha**:
   - Usuário sem senha deve conseguir definir
   - Usuário com senha deve conseguir alterar

5. **Upgrade para premium**:
   - Webhook deve atualizar usuário existente (gratuito)
   - Webhook deve criar novo usuário se não existir
   - Email do Kiwify deve ser o mesmo do cadastro

6. **CTAs**:
   - Verificar textos atualizados
   - Verificar avisos sobre email do Kiwify
   - Verificar que não bloqueiam uso gratuito

## Notas Finais

Esta implementação transforma completamente o modelo de negócios da plataforma, permitindo que usuários gratuitos participem ativamente enquanto mantém incentivos claros para upgrade premium. O foco está em funcionalidades exclusivas (ver outras carteiras) ao invés de bloquear funcionalidades básicas (participar do ranking).

