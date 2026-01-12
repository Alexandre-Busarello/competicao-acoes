# Implementação de Comentários no Feed

## Resumo da Implementação

Foi implementada a funcionalidade completa de comentários nos posts do feed. Agora, ao clicar no ícone de comentários, uma seção expansível é aberta diretamente no post, permitindo visualizar e adicionar comentários sem redirecionar para outra página.

## Componentes Criados/Modificados

### 1. PostComments (`src/components/feed/PostComments.tsx`)

Componente novo que gerencia a exibição e criação de comentários.

**Funcionalidades:**
- Lista todos os comentários do post (apenas comentários principais, não respostas)
- Exibe respostas aninhadas aos comentários principais
- Formulário para adicionar novos comentários (apenas para usuários autenticados)
- Suporte a markdown nos comentários
- Loading state durante carregamento
- Empty state quando não há comentários

**Estrutura:**
- `PostComments`: Componente principal que gerencia estado e mutations
- `CommentItem`: Componente para renderizar cada comentário individualmente
- Suporte a respostas aninhadas (replies)

### 2. FeedPost (`src/components/feed/FeedPost.tsx`)

Componente atualizado para incluir seção de comentários expansível.

**Mudanças:**
- Adicionado estado `showComments` para controlar visibilidade
- Botão de comentários agora abre/fecha seção ao invés de redirecionar
- Botão destaca quando comentários estão abertos
- Integrado componente `PostComments`

**Antes:**
```tsx
<Link href={postUrl}>
  <Button variant="ghost" size="sm">
    <MessageCircle />
    <span>{post.commentCount}</span>
  </Button>
</Link>
```

**Depois:**
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => setShowComments(!showComments)}
>
  <MessageCircle className={showComments ? 'text-primary' : 'text-muted-foreground'} />
  <span>{post.commentCount}</span>
</Button>
{showComments && <PostComments postId={post.id} />}
```

### 3. PostContent (`src/components/feed/PostContent.tsx`)

Componente atualizado para incluir seção de comentários sempre visível.

**Mudanças:**
- Comentários sempre visíveis na página de detalhes do post
- Integrado componente `PostComments`

### 4. Textarea (`src/components/ui/textarea.tsx`)

Componente novo criado para formulário de comentários.

**Características:**
- Baseado no padrão shadcn/ui
- Suporte a todas as props padrão de textarea HTML
- Estilização consistente com outros componentes UI

### 5. API Comment Route (`src/app/api/feed/[postId]/comment/route.ts`)

Endpoint atualizado para suportar GET e POST.

**GET `/api/feed/[postId]/comment`:**
- Busca todos os comentários do post
- Retorna apenas comentários principais (parentCommentId: null)
- Inclui respostas aninhadas (replies)
- Ordena por data de criação (mais antigos primeiro)
- Não requer autenticação

**POST `/api/feed/[postId]/comment`:**
- Adiciona novo comentário ao post
- Requer autenticação
- Valida conteúdo (não pode ser vazio)
- Retorna comentário completo com informações do usuário
- Atualiza commentCount do post automaticamente (via trigger do banco)

## Estrutura de Dados

### FeedComment (Prisma Schema)

```prisma
model FeedComment {
  id             String        @id @default(uuid())
  postId         String
  userId         String
  parentCommentId String?      // null para comentários principais
  content        String
  likeCount      Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?     // Soft delete
  reportedAt     DateTime?
  post           FeedPost      @relation(...)
  user           User          @relation(...)
  parentComment  FeedComment?  @relation("CommentReplies", ...)
  replies        FeedComment[] @relation("CommentReplies")
}
```

### Interface Comment (TypeScript)

```typescript
interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  replies?: Comment[];
}
```

## Fluxo de Funcionamento

### Visualizar Comentários

1. Usuário clica no botão de comentários no `FeedPost`
2. Estado `showComments` é alternado para `true`
3. Componente `PostComments` é renderizado
4. Query busca comentários via `GET /api/feed/[postId]/comment`
5. Comentários são exibidos com formatação markdown
6. Respostas são exibidas aninhadas aos comentários principais

### Adicionar Comentário

1. Usuário autenticado digita comentário no textarea
2. Usuário clica em "Comentar"
3. Mutation `addCommentMutation` é executada
4. POST é enviado para `/api/feed/[postId]/comment`
5. Comentário é criado no banco de dados
6. `commentCount` do post é atualizado automaticamente (trigger)
7. Cache é invalidado para atualizar UI
8. Textarea é limpo
9. Lista de comentários é atualizada

## Suporte a Markdown

Os comentários suportam formatação markdown através do `ReactMarkdown`:

- **Negrito**: `**texto**`
- *Itálico*: `*texto*`
- `Código inline`: `` `código` ``
- Links: `[texto](url)`
- Parágrafos e quebras de linha

## Estados e Loading

### Loading States

- **Carregando comentários**: Spinner centralizado
- **Enviando comentário**: Botão mostra "Enviando..." com spinner
- **Empty state**: Mensagem quando não há comentários

### Error Handling

- Erros de rede são tratados pelo React Query
- Validação de conteúdo vazio no frontend e backend
- Mensagens de erro apropriadas para usuário não autenticado

## Cache e Invalidação

Quando um comentário é adicionado, os seguintes caches são invalidados:

- `['comments', postId]` - Lista de comentários do post
- `['user-feed']` - Feed do usuário (para atualizar commentCount)
- `['post', slug]` - Post individual (se estiver aberto)

## Considerações de UX

### FeedPost

- Comentários são expansíveis/colapsáveis
- Botão de comentários destaca quando aberto
- Não redireciona para outra página
- Mantém contexto do feed

### PostContent

- Comentários sempre visíveis
- Melhor experiência para página dedicada do post
- Permite discussão mais focada

## Próximos Passos (Opcional)

1. **Respostas a comentários**: Implementar funcionalidade de responder a comentários específicos
2. **Edição de comentários**: Permitir editar comentários próprios
3. **Exclusão de comentários**: Permitir deletar comentários próprios
4. **Likes em comentários**: Adicionar funcionalidade de curtir comentários
5. **Notificações**: Notificar autor do post quando há novo comentário
6. **Paginação**: Implementar paginação para posts com muitos comentários
7. **Filtros**: Filtrar comentários por mais recentes/mais antigos

## Arquivos Modificados/Criados

### Criados:
- `src/components/feed/PostComments.tsx`
- `src/components/ui/textarea.tsx`
- `docs/implementacao-comentarios-feed.md`

### Modificados:
- `src/components/feed/FeedPost.tsx`
- `src/components/feed/PostContent.tsx`
- `src/app/api/feed/[postId]/comment/route.ts`

## Testes Recomendados

1. **Visualização:**
   - Verificar se comentários carregam corretamente
   - Verificar se respostas são exibidas aninhadas
   - Verificar empty state quando não há comentários
   - Verificar loading state durante carregamento

2. **Criação:**
   - Verificar se usuário autenticado pode comentar
   - Verificar se usuário não autenticado não vê formulário
   - Verificar validação de conteúdo vazio
   - Verificar se commentCount é atualizado após comentar
   - Verificar se markdown é renderizado corretamente

3. **UX:**
   - Verificar se seção expande/colapsa corretamente
   - Verificar se botão destaca quando aberto
   - Verificar se não há redirecionamento indesejado
   - Verificar responsividade mobile

4. **Performance:**
   - Verificar se cache funciona corretamente
   - Verificar se invalidação atualiza UI adequadamente
   - Verificar se não há queries desnecessárias



