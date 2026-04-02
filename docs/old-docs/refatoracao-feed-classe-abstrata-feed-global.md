# Refatoração Feed com Classe Abstrata e Feed Global

## Resumo

Foi implementada uma arquitetura baseada em classe abstrata para feeds, permitindo reutilização de código e facilitando a criação de novos tipos de feed. Além disso, foi criado um feed global com ordenação por engajamento e sistema de visualizações para evitar repetição de conteúdo.

## Implementação

### 1. Classe Abstrata BaseFeedService

**Arquivo:** `src/lib/services/base-feed-service.ts`

Foi criada uma classe abstrata que define a API comum para todos os tipos de feed:

- **Método abstrato `getFeed()`**: Cada implementação define sua lógica de busca específica
- **Métodos concretos compartilhados**:
  - `enrichWithLikes()`: Enriquece posts com informações de likes do usuário atual
  - `mapToFeedPost()`: Mapeia post do Prisma para FeedPost
  - `fetchPostsFromPrisma()`: Busca posts do Prisma com includes padrão
  - `processCursorPagination()`: Processa resultado de busca com paginação cursor-based
  - Métodos de cache: `getCached()`, `setCache()`, `clearCache()`
- **Propriedades comuns**: Limite padrão de 20 itens por página

### 2. UserFeedService (Classe Concreta)

**Arquivo:** `src/lib/services/user-feed-service.ts`

Estende `BaseFeedService` e implementa feed do usuário:

- **Lógica**: Filtra posts por `userId`
- **Ordenação**: `createdAt DESC` (mais recentes primeiro)
- **Cache**: Implementa cache por 5 minutos (sem informações de like do usuário)
- **Suporte a posts privados**: Permite visualizar posts privados se for o próprio perfil

### 3. GlobalFeedService (Classe Concreta)

**Arquivo:** `src/lib/services/global-feed-service.ts`

Estende `BaseFeedService` e implementa feed global:

- **Lógica**: Busca todos os posts públicos (`isPublic: true`)
- **Ordenação em duas etapas**:
  1. Primeiro: Posts mais engajados (score = `likeCount * 2 + commentCount`)
  2. Depois: Posts mais recentes (`createdAt DESC`)
- **Sistema de visualizações**: 
  - Considera visualizações recentes (últimas 24h) do usuário atual
  - Posts visualizados recentemente vão para o final da fila
  - Separa posts em dois grupos: não visualizados e visualizados
  - Ordena grupos separadamente e concatena

### 4. Modelo FeedView

**Arquivo:** `prisma/schema.prisma` (migration: `20260109191407_add_feed_view_model`)

Foi criado modelo `FeedView` para registrar visualizações:

```prisma
model FeedView {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  viewedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      FeedPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId, viewedAt(sort: Desc)])
  @@index([postId])
}
```

**Características**:
- Relação única por usuário/post (upsert)
- Índices para consultas eficientes
- Cascade delete quando usuário ou post é deletado

### 5. API Endpoints

#### Feed do Usuário (Refatorado)

**Arquivo:** `src/app/api/users/[userId]/feed/route.ts`

- Refatorado para usar `UserFeedService` ao invés de `FeedService.getUserFeed()`
- Mantém compatibilidade com API existente
- Suporta paginação cursor-based

#### Feed Global (Novo)

**Arquivo:** `src/app/api/feed/global/route.ts`

- Endpoint GET com paginação cursor-based
- **Requer autenticação**: Retorna 401 se usuário não estiver logado
- Usa `GlobalFeedService.getFeed()`
- Parâmetros de query:
  - `limit`: Número de posts por página (padrão: 20)
  - `cursor`: Cursor para paginação

#### Registrar Visualizações

**Arquivo:** `src/app/api/feed/[postId]/view/route.ts`

- Endpoint POST para registrar visualização individual
- **Requer autenticação**
- **Upsert**: Cria ou atualiza `viewedAt` se já existe
- Verifica se post existe antes de registrar

### 6. Componentes Frontend

#### GlobalFeed (Novo)

**Arquivo:** `src/components/feed/GlobalFeed.tsx`

- Similar ao `UserFeed` mas chama `/api/feed/global`
- **Scroll infinito**: Usa `useInfiniteQuery` do React Query
- **Registro de visualizações**: 
  - Usa `IntersectionObserver` para detectar quando posts entram na viewport
  - Registra visualização quando 50% do post está visível
  - Evita registro duplicado usando `Set` de IDs visualizados
- **Estado de loading**: Mostra spinner durante carregamento
- **Verificação de autenticação**: Mostra mensagem se usuário não estiver logado

#### Página Feed Global

**Arquivo:** `src/app/(main)/feed/page.tsx`

- Página que exibe o componente `GlobalFeed`
- **Requer autenticação**: Redireciona para login se não autenticado
- Usa `PageHeader` com título "Feed"
- Layout responsivo com container max-width

### 7. Navegação Global

**Arquivos modificados:**
- `src/components/navigation/BottomNav.tsx` (mobile)
- `src/components/navigation/UserHeader.tsx` (desktop)

**Mudanças:**
- Adicionado link "Feed" como primeiro item na navegação
- **Ordem**: Feed → Ranking → Carteira → Perfil
- **Ícone**: `Rss` do lucide-react
- **Rota**: `/feed`

### 8. Refatoração FeedService

**Arquivo:** `src/lib/services/feed-service.ts`

- Removido método `getUserFeed()` (movido para `UserFeedService`)
- Mantidos métodos compartilhados:
  - `createPostFromTransaction()`
  - `getPostBySlug()`
  - `togglePostVisibility()`
  - `addComment()`
  - `toggleLike()`
  - `updatePost()`
  - `deletePost()`
  - `mapToFeedPost()`

## Fluxo de Dados

### Feed do Usuário

1. Cliente solicita feed via `/api/users/[userId]/feed`
2. `UserFeedService.getFeed()` busca posts do usuário
3. Filtra por `userId` e `isPublic` (se não for próprio perfil)
4. Ordena por `createdAt DESC`
5. Enriquece com likes do usuário atual
6. Retorna com cursor para paginação

### Feed Global

1. Cliente solicita feed via `/api/feed/global` (requer autenticação)
2. `GlobalFeedService.getFeed()` busca posts públicos
3. Busca visualizações do usuário nas últimas 24h
4. Separa posts em dois grupos: não visualizados e visualizados
5. Calcula score de engajamento: `likeCount * 2 + commentCount`
6. Ordena grupo não visualizado: primeiro por score DESC, depois por createdAt DESC
7. Ordena grupo visualizado: apenas por createdAt DESC
8. Concatena grupos e limita a 20 itens
9. Enriquece com likes do usuário atual
10. Retorna com cursor para paginação
11. Frontend registra visualizações via `IntersectionObserver` quando posts entram na viewport

## Algoritmo de Ordenação do Feed Global

1. Buscar posts públicos (limit * 2 para ter buffer após filtrar visualizados)
2. Buscar visualizações do usuário nas últimas 24 horas
3. Separar posts em dois grupos:
   - **Não visualizados recentemente**: Posts que o usuário não viu nas últimas 24h
   - **Visualizados recentemente**: Posts que o usuário já viu nas últimas 24h
4. Para grupo não visualizado:
   - Calcular score: `likeCount * 2 + commentCount`
   - Ordenar por score DESC, depois por createdAt DESC
5. Para grupo visualizado:
   - Ordenar apenas por createdAt DESC
6. Concatenar: grupo não visualizado + grupo visualizado
7. Limitar a 20 itens

## Considerações Técnicas

### Performance

- **Cache**: Feed do usuário usa cache de 5 minutos (sem informações de like)
- **Paginação**: Ambos os feeds usam cursor-based pagination com limite de 20 itens
- **Visualizações**: Registradas em batch no frontend via `IntersectionObserver`
- **Índices**: Modelo `FeedView` tem índices otimizados para consultas frequentes

### Segurança

- Feed global requer autenticação
- Visualizações são registradas apenas para usuários autenticados
- Verificação de existência de post antes de registrar visualização

### Compatibilidade

- Mantida compatibilidade com código existente durante transição
- Feed do usuário mantém mesma API
- `FeedService` mantém métodos compartilhados para compatibilidade

## Migração

A migration `20260109191407_add_feed_view_model` foi criada e aplicada:

- Adiciona modelo `FeedView` ao schema
- Adiciona relação `feedViews` em `User` e `FeedPost`
- Cria índices necessários

## Próximos Passos

- Considerar implementar cache para feed global (considerando visualizações do usuário)
- Otimizar registro de visualizações em batch no backend
- Adicionar métricas de engajamento para melhorar algoritmo de ordenação
- Considerar implementar outros tipos de feed (ex: feed de seguidores)

