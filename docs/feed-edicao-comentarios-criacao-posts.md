# Feed: Edição de Comentários e Criação de Posts Customizados

## Resumo

Implementação completa de funcionalidades para permitir que usuários editem e excluam seus próprios comentários e posts, além de criar novos posts customizados no feed. A solução foi desenvolvida com foco em mobile-first, utilizando páginas dedicadas (SPA) para melhor experiência do usuário.

## Funcionalidades Implementadas

### 1. Edição e Exclusão de Comentários

- **Edição**: Usuários podem editar seus próprios comentários através de uma página dedicada (`/feed/[postId]/comment/[commentId]/edit`)
- **Exclusão**: Usuários podem excluir seus próprios comentários com confirmação via `AlertDialog`
- **Segurança**: Verificação de propriedade no backend antes de permitir edição/exclusão

### 2. Edição e Exclusão de Posts

- **Edição**: Usuários podem editar seus próprios posts através de uma página dedicada (`/feed/[postId]/edit`)
- **Exclusão**: Usuários podem excluir seus próprios posts com confirmação via `AlertDialog`
- **Segurança**: Verificação de propriedade no backend antes de permitir edição/exclusão

### 3. Criação de Posts Customizados

- **FAB (Floating Action Button)**: Botão flutuante com ícone "+" na tela de feed (mobile)
- **Botão Desktop**: Botão "Novo Post" no header para telas maiores
- **Editor Markdown**: Editor moderno com preview em tempo real
- **Suporte a Markdown**: Renderização completa com suporte a links automáticos e quebras de linha

## Componentes Criados/Modificados

### Novos Componentes

1. **`MarkdownEditor.tsx`**
   - Editor de markdown com toolbar para formatação
   - Preview em tempo real (disponível em mobile e desktop)
   - Suporte a seleção de texto nativa no mobile
   - Preservação de histórico undo/redo usando `document.execCommand`
   - Suporte a quebras de linha com `remark-breaks`

2. **`CreatePostFAB.tsx`**
   - Botão flutuante para criação de posts
   - Posicionado no canto inferior direito
   - Visível apenas em mobile (`lg:hidden`)

3. **`AlertDialog` (Shadcn/ui)**
   - Componente de confirmação para exclusões
   - UI leve e responsiva

### Páginas Criadas

1. **`/feed/create/page.tsx`**
   - Página para criação de novos posts
   - Layout responsivo com footer sempre visível
   - Altura calculada dinamicamente para mobile/desktop

2. **`/feed/[postId]/edit/page.tsx`**
   - Página para edição de posts existentes
   - Carrega conteúdo pré-existente
   - Layout idêntico à página de criação

3. **`/feed/[postId]/comment/[commentId]/edit/page.tsx`**
   - Página para edição de comentários
   - Editor simples com Textarea
   - Layout consistente com outras páginas

### Componentes Modificados

1. **`FeedPost.tsx`**
   - Adicionado `DropdownMenu` com opções "Editar" e "Excluir"
   - Integração com `remark-gfm` e `remark-breaks` para renderização

2. **`PostComments.tsx`**
   - Adicionado `DropdownMenu` em cada comentário
   - Opções "Editar" e "Excluir" apenas para o dono do comentário
   - Integração com `remark-gfm` e `remark-breaks`

3. **`PostContent.tsx`**
   - Integração com `remark-gfm` e `remark-breaks` para melhor renderização

4. **`PageHeader.tsx`**
   - Adicionado `flex-shrink-0` para layout consistente
   - Suporte a botão adicional no desktop

5. **`feed/page.tsx`**
   - Integração do `CreatePostFAB` para mobile
   - Botão "Novo Post" no header para desktop

## APIs Criadas/Modificadas

### Novas Rotas API

1. **`POST /api/feed`**
   - Criação de posts customizados
   - Geração automática de slug único
   - Validação de conteúdo
   - Invalidação de cache

2. **`GET /api/feed/[postId]`**
   - Busca de post por ID
   - Verificação de visibilidade/p propriedade

3. **`PUT /api/feed/[postId]/comment/[commentId]`**
   - Edição de comentários
   - Verificação de propriedade

4. **`DELETE /api/feed/[postId]/comment/[commentId]`**
   - Exclusão (soft delete) de comentários
   - Verificação de propriedade

### Rotas API Modificadas

1. **`PUT /api/feed/[postId]`**
   - Já existia, mantida para edição de posts

2. **`DELETE /api/feed/[postId]`**
   - Já existia, mantida para exclusão de posts

## Serviços Modificados

### `feed-service.ts`

- **`createCustomPost(userId: string, content: string)`**: Criação de posts customizados
- **`getPostById(postId: string, currentUserId?: string)`**: Busca de post por ID com verificação de visibilidade
- Métodos `updatePost` e `deletePost` já existiam e foram mantidos

## Dependências Adicionadas

- **`remark-breaks`**: Plugin para renderizar quebras de linha simples como `<br />`
- **`remark-gfm`**: Já existia, utilizado para suporte a GitHub Flavored Markdown

## Correções de UX/UI

### Problemas Resolvidos

1. **Seleção de texto no mobile**
   - Removidos event handlers que interferiam com seleção nativa
   - Seleção funciona normalmente com double-click

2. **Undo/Redo no desktop**
   - Implementado uso de `document.execCommand('insertText')` para preservar histórico
   - Ctrl+Z funciona corretamente após inserção via toolbar

3. **Preview no mobile**
   - Preview disponível em todas as telas
   - Layout adaptativo (full-width no mobile, side-by-side no desktop)

4. **Quebras de linha**
   - Integração de `remark-breaks` em todos os componentes de renderização
   - Quebras de linha simples são renderizadas corretamente

5. **Posicionamento do FAB**
   - Ajustado para `bottom-24` no mobile
   - Oculto em telas grandes (`lg:hidden`)
   - Botão alternativo no header para desktop

6. **Footer sempre visível**
   - Layout ajustado para garantir que footer com botões fique sempre visível
   - Altura calculada dinamicamente:
     - Mobile: `calc(100vh - 300px)`
     - Desktop: `calc(100vh - 327px)`
   - Uso de `flex-shrink-0` e `overflow-hidden` para controle preciso

## Estrutura de Layout

### Páginas de Criação/Edição

```
┌─────────────────────────┐
│   PageHeader (fixo)     │ ← flex-shrink-0
├─────────────────────────┤
│                         │
│   Editor/Textarea       │ ← altura calculada
│   (scroll interno)      │   flex-shrink-0
│                         │
├─────────────────────────┤
│   Footer (fixo)         │ ← flex-shrink-0
│   [Cancelar] [Salvar]   │   sempre visível
└─────────────────────────┘
```

### Container Principal

- `flex flex-col overflow-hidden`: Container principal sem scroll
- `flex-1 flex flex-col min-h-0 overflow-hidden`: Form com scroll interno apenas no editor
- Altura calculada dinamicamente via `useEffect` que detecta tamanho da tela

## Segurança

### Verificações Implementadas

1. **Autenticação**: Todas as rotas requerem autenticação (`requireAuth`)
2. **Propriedade**: Verificação de propriedade antes de editar/excluir
3. **Validação**: Validação de conteúdo antes de criar/atualizar
4. **RLS**: Row Level Security no Supabase para proteção adicional

## Fluxo de Navegação

### Criar Post
1. Usuário clica no FAB (mobile) ou botão "Novo Post" (desktop)
2. Navega para `/feed/create`
3. Escreve conteúdo no editor markdown
4. Clica em "Publicar"
5. Redirecionado para `/feed`

### Editar Post
1. Usuário clica no menu do post → "Editar"
2. Navega para `/feed/[postId]/edit`
3. Conteúdo pré-carregado no editor
4. Faz alterações
5. Clica em "Salvar"
6. Redirecionado para o post ou feed

### Editar Comentário
1. Usuário clica no menu do comentário → "Editar"
2. Navega para `/feed/[postId]/comment/[commentId]/edit`
3. Conteúdo pré-carregado no textarea
4. Faz alterações
5. Clica em "Salvar"
6. Redirecionado para `/feed`

### Excluir Post/Comentário
1. Usuário clica no menu → "Excluir"
2. Confirmação via `AlertDialog`
3. Se confirmado, exclusão é realizada
4. UI atualizada otimisticamente

## Considerações Técnicas

### Markdown Rendering

- **`react-markdown`**: Componente principal para renderização
- **`remark-gfm`**: Suporte a GitHub Flavored Markdown (links automáticos, tabelas, etc.)
- **`remark-breaks`**: Renderização de quebras de linha simples

### Estado e Cache

- **React Query**: Gerenciamento de estado e cache
- **Optimistic Updates**: Atualização imediata da UI antes da confirmação do servidor
- **Cache Invalidation**: Invalidação de cache após mutações

### Responsividade

- **Mobile-first**: Design pensado primeiro para mobile
- **Breakpoints**: Uso de Tailwind breakpoints (`md:`, `lg:`)
- **Altura Dinâmica**: Cálculo de altura baseado no tamanho da tela

## Melhorias Futuras

1. **Autosave**: Salvar rascunhos automaticamente
2. **Mentions**: Menção de usuários com `@username`
3. **Hashtags**: Suporte a hashtags
4. **Upload de Imagens**: Upload e inserção de imagens nos posts
5. **Preview de Links**: Preview de links compartilhados (Open Graph)
6. **Templates**: Templates pré-definidos para posts

## Notas de Implementação

### Você DEVE:
- Sempre verificar propriedade no backend antes de permitir edição/exclusão
- Usar `flex-shrink-0` em elementos fixos (header, footer)
- Calcular altura dinamicamente para diferentes tamanhos de tela
- Usar `document.execCommand` quando possível para preservar undo/redo
- Manter consistência visual entre páginas de criação e edição

### Você NÃO DEVE:
- Usar modais para edição em mobile (usar páginas dedicadas)
- Interferir com seleção de texto nativa no mobile
- Usar `flex-1` em containers que precisam de altura fixa
- Esquecer de invalidar cache após mutações
- Permitir edição/exclusão sem verificação de propriedade



