# Implementação: Edição de Comentários e Criação de Posts Customizados

## Data: 2025-01-XX

## Resumo

Implementação completa de funcionalidades para permitir que usuários editem/excluam seus comentários e posts, além de criar posts customizados no feed. Tudo implementado com abordagem mobile-first usando páginas dedicadas ao invés de modais pesados.

## Funcionalidades Implementadas

### 1. Edição e Exclusão de Comentários

**Arquivos Criados:**
- `src/app/api/feed/[postId]/comment/[commentId]/route.ts` - API para editar/excluir comentários

**Arquivos Modificados:**
- `src/components/feed/PostComments.tsx` - Adicionado menu dropdown com opções de editar/excluir

**Funcionalidades:**
- ✅ Usuários podem editar seus próprios comentários através de página dedicada
- ✅ Usuários podem excluir seus próprios comentários com confirmação
- ✅ Verificação de segurança no servidor (apenas dono pode editar/excluir)
- ✅ UI mobile-friendly com menu dropdown e confirmação leve

**Rotas:**
- `GET /api/feed/[postId]/comment/[commentId]` - Buscar comentário
- `PUT /api/feed/[postId]/comment/[commentId]` - Editar comentário
- `DELETE /api/feed/[postId]/comment/[commentId]` - Excluir comentário (soft delete)

**Páginas:**
- `/feed/[postId]/comment/[commentId]/edit` - Página de edição de comentário

### 2. Edição e Exclusão de Posts

**Arquivos Modificados:**
- `src/components/feed/FeedPost.tsx` - Adicionado menu dropdown, removidos dialogs de edição
- `src/app/api/feed/[postId]/route.ts` - Adicionado método GET para buscar post por ID

**Funcionalidades:**
- ✅ Usuários podem editar seus próprios posts através de página dedicada
- ✅ Usuários podem excluir seus próprios posts com confirmação
- ✅ Menu dropdown com opções "Editar" e "Excluir" (apenas para dono)
- ✅ Removidos dialogs pesados de edição (substituídos por páginas)

**Rotas:**
- `GET /api/feed/[postId]` - Buscar post por ID
- `PUT /api/feed/[postId]` - Editar post (já existia)
- `DELETE /api/feed/[postId]` - Excluir post (já existia)

**Páginas:**
- `/feed/[postId]/edit` - Página de edição de post

### 3. Criação de Posts Customizados

**Arquivos Criados:**
- `src/app/api/feed/route.ts` - API para criar posts customizados
- `src/app/(main)/feed/create/page.tsx` - Página de criação de posts
- `src/components/feed/MarkdownEditor.tsx` - Editor markdown compartilhado
- `src/components/feed/CreatePostFAB.tsx` - Botão flutuante para criar posts

**Arquivos Modificados:**
- `src/lib/services/feed-service.ts` - Adicionado método `createCustomPost()`
- `src/app/(main)/feed/page.tsx` - Adicionado FAB

**Funcionalidades:**
- ✅ Usuários podem criar posts customizados (não apenas de transações)
- ✅ Editor markdown com toolbar simples
- ✅ Preview em tempo real (desktop)
- ✅ Botão FAB flutuante na tela de feed
- ✅ Validação de conteúdo (não vazio, máximo 10000 caracteres)

**Rotas:**
- `POST /api/feed` - Criar post customizado

**Páginas:**
- `/feed/create` - Página de criação de post

### 4. Melhorias na Renderização de Links

**Arquivos Modificados:**
- `src/components/feed/FeedPost.tsx` - Adicionado remark-gfm
- `src/components/feed/PostContent.tsx` - Adicionado ReactMarkdown com remark-gfm
- `src/components/feed/PostComments.tsx` - Adicionado remark-gfm

**Funcionalidades:**
- ✅ Detecção automática de links em posts e comentários
- ✅ Links são renderizados como elementos clicáveis
- ✅ Suporte a GitHub Flavored Markdown (GFM)

**Dependências Adicionadas:**
- `remark-gfm` - Plugin para GitHub Flavored Markdown
- `@radix-ui/react-alert-dialog` - Componente de alerta leve

## Componentes Criados

### MarkdownEditor

Editor markdown compartilhado usado tanto para criar quanto para editar posts.

**Características:**
- Toolbar com botões de formatação (negrito, itálico, código, links, listas)
- Preview em tempo real (escondido no mobile, visível no desktop)
- Inserção de texto na posição do cursor
- Mobile-first com botões touch-friendly (min 44x44px)

**Props:**
- `value: string` - Conteúdo atual
- `onChange: (value: string) => void` - Callback de mudança
- `placeholder?: string` - Placeholder do textarea
- `minHeight?: string` - Altura mínima do editor
- `showPreview?: boolean` - Mostrar preview inicialmente
- `className?: string` - Classes CSS adicionais

### CreatePostFAB

Botão flutuante para criar novos posts.

**Características:**
- Posicionamento fixo (bottom-right)
- Mobile: `bottom-20 right-4` (acima do BottomNav)
- Desktop: `bottom-8 right-8`
- Tamanho: 56x56px (padrão Material Design)
- Animação de hover/active

### AlertDialog

Componente de confirmação leve para ações destrutivas.

**Características:**
- Baseado em Radix UI AlertDialog
- Mais leve que Dialog completo
- Usado para confirmação de exclusão

## Estrutura de Páginas

### Página de Criação (`/feed/create`)

- Header fixo com título "Novo Post" e botão voltar
- Editor markdown full-screen
- Footer fixo com botão "Publicar" e contador de caracteres
- Loading states durante criação
- Redirecionamento para `/feed` após sucesso

### Página de Edição de Post (`/feed/[postId]/edit`)

- Header fixo com título "Editar Post" e botão voltar
- Carrega post via API
- Editor preenchido com conteúdo existente
- Footer fixo com botões "Cancelar" e "Salvar"
- Redirecionamento para `/post/[slug]` após salvar

### Página de Edição de Comentário (`/feed/[postId]/comment/[commentId]/edit`)

- Header fixo com título "Editar Comentário" e botão voltar
- Carrega comentário via API
- Editor simples (textarea) preenchido
- Footer fixo com botões "Cancelar" e "Salvar"
- Redirecionamento de volta para feed após salvar

## Segurança

### Verificações Implementadas

1. **Autenticação:** Todas as rotas usam `requireAuth()`
2. **Ownership Posts:** Verificação dupla no servidor (`post.userId === session.user.id`)
3. **Ownership Comentários:** Verificação dupla no servidor (`comment.userId === session.user.id`)
4. **Validação:** Conteúdo não pode ser vazio, máximo de caracteres
5. **Sanitização:** Markdown é renderizado de forma segura (react-markdown já faz isso)
6. **UI Segura:** Botões de editar/excluir aparecem apenas para o dono (verificação no cliente + servidor)

### Fluxo de Segurança

```
Cliente: Verifica se user.id === post.userId (mostra/oculta botões)
    ↓
Servidor: Verifica autenticação (requireAuth)
    ↓
Servidor: Verifica ownership (post.userId === session.user.id)
    ↓
Servidor: Executa ação ou retorna 403
```

## UX Mobile-First

### Princípios Aplicados

1. **Navegação Fluida:** Usar Next.js App Router para transições suaves entre páginas
2. **Sem Modais Pesados:** Apenas confirmações leves para ações destrutivas
3. **Páginas Dedicadas:** Cada ação tem sua própria página para melhor uso do espaço mobile
4. **Headers Consistentes:** Todas as páginas têm header com botão voltar
5. **Loading States:** Feedback visual durante operações assíncronas
6. **Toasts/Notificações:** Feedback discreto após ações (não modais bloqueantes)
7. **Scroll Restoration:** Manter posição do scroll ao voltar para feed após edição

### Responsividade

**Mobile (< 768px):**
- FAB fixo bottom-right (acima do BottomNav)
- Editor full-width
- Toolbar scroll horizontal
- Preview escondido
- Botões grandes e touch-friendly

**Desktop (>= 768px):**
- FAB com offset maior
- Editor com max-width centralizado
- Toolbar completa visível
- Preview toggle visível
- Cards com padding maior

## Fluxo de Dados

### Criar Post Customizado

```
Usuário clica FAB
  → Navega para /feed/create
  → Página de Criação
  → Editor Markdown
  → Usuário escreve post
  → POST /api/feed
  → FeedService.createCustomPost
  → Prisma cria FeedPost
  → Invalidar cache
  → Navegar para /feed
```

### Editar Post

```
Usuário clica Editar Post
  → Navega para /feed/postId/edit
  → Página de Edição
  → Carrega post via API
  → Editor preenchido
  → Usuário edita
  → PUT /api/feed/postId
  → Verificar ownership
  → Atualizar post
  → Invalidar cache
  → Navegar para /post/slug
```

### Editar Comentário

```
Usuário clica Editar Comentário
  → Navega para /feed/postId/comment/commentId/edit
  → Página de Edição
  → Carrega comentário via API
  → Editor preenchido
  → Usuário edita
  → PUT /api/feed/postId/comment/commentId
  → Verificar ownership
  → Atualizar comentário
  → Invalidar cache
  → Navegar de volta para feed
```

### Excluir Post/Comentário

```
Usuário clica Excluir
  → Confirmação leve (AlertDialog)
  → DELETE /api/feed/[postId|commentId]
  → Verificar ownership
  → Soft delete
  → Invalidar cache
  → Toast de sucesso
```

## Testes Recomendados

1. ✅ Criar post customizado e verificar no feed
2. ✅ Editar post próprio (deve funcionar)
3. ✅ Editar post de outro usuário (deve falhar 403)
4. ✅ Excluir post próprio (deve funcionar)
5. ✅ Excluir post de outro usuário (deve falhar 403)
6. ✅ Editar comentário próprio (deve funcionar)
7. ✅ Editar comentário de outro usuário (deve falhar 403)
8. ✅ Excluir comentário próprio (deve funcionar)
9. ✅ Excluir comentário de outro usuário (deve falhar 403)
10. ✅ Verificar links automáticos em posts
11. ✅ Testar FAB em mobile e desktop
12. ✅ Testar editor em diferentes tamanhos de tela
13. ✅ Verificar que menu de três pontos aparece apenas para posts próprios

## Arquivos Criados

- `src/app/api/feed/[postId]/comment/[commentId]/route.ts`
- `src/app/api/feed/route.ts`
- `src/app/(main)/feed/create/page.tsx`
- `src/app/(main)/feed/[postId]/edit/page.tsx`
- `src/app/(main)/feed/[postId]/comment/[commentId]/edit/page.tsx`
- `src/components/feed/MarkdownEditor.tsx`
- `src/components/feed/CreatePostFAB.tsx`
- `src/components/ui/alert-dialog.tsx`
- `docs/implementacao-edicao-comentarios-posts-customizados.md`

## Arquivos Modificados

- `src/components/feed/FeedPost.tsx` - Adicionado menu dropdown, removidos dialogs de edição, melhorada detecção de links
- `src/components/feed/PostComments.tsx` - Adicionados links para editar comentários, melhorada exclusão, melhorada detecção de links
- `src/components/feed/PostContent.tsx` - Adicionado ReactMarkdown com remark-gfm
- `src/app/(main)/feed/page.tsx` - Adicionado FAB
- `src/lib/services/feed-service.ts` - Adicionado método `createCustomPost()` e `getPostById()`
- `src/app/api/feed/[postId]/route.ts` - Adicionado método GET

## Dependências Adicionadas

- `remark-gfm` - Para detecção automática de links em markdown
- `@radix-ui/react-alert-dialog` - Componente de alerta leve

## Notas de Implementação

### Abordagem Mobile-First

A implementação seguiu uma abordagem mobile-first, evitando modais pesados e usando páginas dedicadas para cada ação. Isso garante:

- Melhor uso do espaço em telas pequenas
- Navegação mais intuitiva
- Menos sobrecarga de JavaScript
- Melhor acessibilidade
- Experiência mais fluida

### Reutilização de Componentes

O `MarkdownEditor` foi criado como componente compartilhado, usado tanto para criar quanto para editar posts. Isso garante:

- Consistência na experiência do usuário
- Manutenção mais fácil
- Código mais limpo

### Segurança

Todas as verificações de segurança foram implementadas tanto no cliente quanto no servidor:

- Cliente: Oculta botões para usuários não autorizados
- Servidor: Valida autenticação e ownership antes de executar ações

Isso garante que mesmo que alguém tente burlar a UI, o servidor sempre validará as permissões.

## Próximos Passos (Opcional)

1. **Notificações:** Notificar usuários quando seus posts/comentários são editados
2. **Histórico de Edições:** Manter histórico de edições (opcional)
3. **Limite de Caracteres:** Adicionar indicador visual de limite de caracteres
4. **Draft Auto-save:** Salvar rascunhos automaticamente
5. **Upload de Imagens:** Permitir upload de imagens nos posts
6. **Mencionar Usuários:** Sistema de menções (@usuario)
7. **Hashtags:** Sistema de hashtags (#tag)

