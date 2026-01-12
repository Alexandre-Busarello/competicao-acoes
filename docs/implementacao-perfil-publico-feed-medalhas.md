# Implementação de Página Pública de Perfil com Feed e Medalhas

## Visão Geral

Implementação completa de uma página pública de perfil (`/perfil/[userId]`) seguindo **boas práticas de redes sociais** para preparar a aplicação como futura rede social do investidor.

## Funcionalidades Implementadas

### 1. Rentabilidade Perpétua
- Calculada on-demand com cache de 1 dia
- Considera TODO o histórico de transações do usuário
- Cache em banco (`UserPerpetualProfitability`) e em memória
- Recalcula automaticamente se passou mais de 1 dia

### 2. Sistema de Medalhas
- Medalhas baseadas em posições nos rankings mensais e anuais
- Resumo agrupado por tipo (ouro/prata/bronze) e período
- Timeline completa de medalhas conquistadas
- Cálculo histórico de medalhas para rankings existentes

### 3. Feed de Transações
- Posts automáticos gerados a partir de transações
- Cada transação cria um post no feed automaticamente
- Posts públicos por padrão (`isPublic: true`)
- Usuários podem ocultar posts individuais
- Sistema de likes e comentários
- URLs únicas (slugs) para cada post (SEO-friendly)

### 4. Sistema de Seguir
- Usuários podem seguir outros perfis
- Contadores denormalizados (followerCount, followingCount)
- Notificações quando alguém segue

### 5. Barramento de Processamento de Ações
- Fila universal para processamento assíncrono
- Processamento otimista (tenta executar imediatamente)
- Fallback para processamento em background se falhar
- Preparado para migração para filas externas (RabbitMQ, SQS, Redis)

### 6. Camada de Cache Abstrata
- Interface genérica para cache (`CacheAdapter`)
- Implementação em memória funcional (`MemoryCacheAdapter`)
- Estrutura preparada para Redis (`RedisCacheAdapter`)
- Migração transparente entre implementações

## Estrutura do Banco de Dados

### Novas Tabelas Criadas

1. **UserPerpetualProfitability**: Cache de rentabilidade perpétua
2. **FeedPost**: Posts do feed gerados por transações
3. **FeedComment**: Comentários nos posts
4. **FeedLike**: Likes nos posts
5. **UserFollow**: Relação de seguir usuários
6. **UserStats**: Estatísticas denormalizadas do usuário
7. **UserBlock**: Sistema de bloqueio de usuários
8. **Notification**: Sistema de notificações
9. **FeedTimeline**: Timeline pré-computada para feed de seguidores
10. **UserMedal**: Medalhas conquistadas pelos usuários
11. **ActionQueue**: Fila universal de ações para processamento assíncrono

### Triggers SQL Implementados

- Atualização automática de `likeCount` em `FeedPost`
- Atualização automática de `commentCount` em `FeedPost`
- Atualização automática de `followerCount` e `followingCount` em `UserStats`
- Atualização automática de `postCount` em `UserStats`
- Atualização automática de `totalLikesReceived` em `UserStats`

## Serviços Implementados

### 1. PerpetualProfitabilityService
**Arquivo**: `src/lib/services/perpetual-profitability-service.ts`

- `calculatePerpetualProfitability(userId)`: Calcula rentabilidade perpétua
- `getOrCalculateProfitability(userId)`: Obtém ou calcula com cache de 1 dia
- `invalidateCache(userId)`: Invalida cache quando necessário

### 2. MedalService
**Arquivo**: `src/lib/services/medal-service.ts`

- `calculateMedalsForUser(userId)`: Calcula medalhas para um usuário
- `getUserMedals(userId)`: Retorna resumo de medalhas
- `getMedalTimeline(userId)`: Retorna timeline completa
- `calculateAllHistoricalMedals()`: Calcula medalhas históricas

### 3. FeedService
**Arquivo**: `src/lib/services/feed-service.ts`

- `createPostFromTransaction(transaction)`: Cria post automático de transação
- `getUserFeed(userId, limit, cursor, includePrivate)`: Obtém feed com paginação cursor-based
- `getPostBySlug(slug, currentUserId)`: Obtém post pelo slug
- `togglePostVisibility(postId, userId)`: Alterna visibilidade do post
- `addComment(postId, userId, content)`: Adiciona comentário (com processamento otimista)
- `toggleLike(postId, userId)`: Alterna like (com processamento otimista)
- `updatePost(postId, userId, content)`: Atualiza post
- `deletePost(postId, userId)`: Deleta post (soft delete)

### 4. FollowService
**Arquivo**: `src/lib/services/follow-service.ts`

- `followUser(followerId, followingId)`: Segue/deixa de seguir (com processamento otimista)
- `unfollowUser(followerId, followingId)`: Remove follow
- `getFollowers(userId)`: Obtém lista de seguidores
- `getFollowing(userId)`: Obtém lista de usuários seguidos
- `isFollowing(followerId, followingId)`: Verifica status de follow

### 5. CacheService
**Arquivos**: 
- `src/lib/cache/cache-adapter.ts` (interface)
- `src/lib/cache/memory-cache-adapter.ts` (implementação atual)
- `src/lib/cache/redis-cache-adapter.ts` (estrutura futura)
- `src/lib/cache/cache-service.ts` (serviço unificado)

### 6. QueueService
**Arquivos**:
- `src/lib/queue/queue-adapter.ts` (interface)
- `src/lib/queue/database-queue-adapter.ts` (implementação atual)
- `src/lib/queue/queue-service.ts` (serviço unificado)
- `src/lib/queue/action-handlers.ts` (handlers específicos)

## APIs Implementadas

### Perfil Público
- `GET /api/users/[userId]/public`: Dados públicos do perfil
- `GET /api/users/[userId]/perpetual-profitability`: Rentabilidade perpétua
- `GET /api/users/[userId]/medals`: Resumo de medalhas
- `GET /api/users/[userId]/medals/timeline`: Timeline de medalhas

### Feed
- `GET /api/users/[userId]/feed`: Feed do usuário (com paginação cursor-based)
- `POST /api/feed/[postId]/like`: Curtir/descurtir post
- `POST /api/feed/[postId]/comment`: Adicionar comentário
- `PUT /api/feed/[postId]`: Editar post
- `DELETE /api/feed/[postId]`: Deletar post
- `PATCH /api/feed/[postId]`: Alternar visibilidade do post
- `GET /api/posts/[slug]`: Post completo pelo slug (SEO)

### Seguir
- `POST /api/users/[userId]/follow`: Seguir/deixar de seguir
- `GET /api/users/[userId]/follow`: Verificar status de follow

### Fila de Processamento
- `POST /api/queue/process`: Processa ações pendentes (cron job)
- `GET /api/queue/stats`: Estatísticas da fila

## Integrações

### Criação Automática de Posts
**Arquivo**: `src/app/api/transactions/route.ts`

Modificado para criar post no feed automaticamente após criar transação:
- Cada transação criada gera um post no feed
- Post é público por padrão (`isPublic: true`)
- Slug único gerado automaticamente

## Utilitários

### Geração de Slugs
**Arquivo**: `src/lib/utils/slug-generator.ts`

- `generateSlug(text, date, attempt)`: Gera slug baseado em texto e data
- `generatePostSlug(transaction, attempt)`: Gera slug específico para post
- `ensureUniqueSlug(baseSlug, checkExists)`: Garante slug único
- `slugExists(slug)`: Verifica se slug existe
- `generateUniquePostSlug(transaction)`: Gera slug único para post

## Processamento Otimista

Todas as ações de interação (like, comment, follow) usam processamento otimista:

1. Ação é enfileirada na tabela `ActionQueue`
2. Sistema tenta processar imediatamente
3. Se sucesso: marca como 'completed', retorna resultado ao usuário
4. Se falhar: deixa como 'pending' para processamento posterior
5. Frontend recebe resposta otimista imediatamente

## Cache Strategy

### Onde usar Cache

1. **Rentabilidade Perpétua**: 
   - Chave: `profitability:${userId}`
   - TTL: 1 dia (86400s)
   - Cache + Banco (banco é fonte de verdade)

2. **Feed de Posts**: 
   - Chave: `feed:${userId}:${cursor}`
   - TTL: 5 minutos (300s)
   - Cache de posts recentes

3. **Notificações**: 
   - Chave: `notifications:unread:${userId}`
   - TTL: 1 minuto (60s)
   - Contagem não lida

4. **Estatísticas de Usuário**: 
   - Chave: `stats:${userId}`
   - TTL: 15 minutos (900s)

5. **Feed Timeline**: 
   - Chave: `timeline:${userId}:${cursor}`
   - TTL: 5 minutos (300s)

## Próximos Passos (Pendentes)

### Componentes React
- [ ] `PublicProfileHeader`: Header do perfil público
- [ ] `PerpetualProfitability`: Componente de rentabilidade perpétua
- [ ] `MedalSummary`: Resumo de medalhas
- [ ] `MedalTimeline`: Timeline de medalhas
- [ ] `FeedPost`: Componente de post individual
- [ ] `FeedComment`: Componente de comentário
- [ ] `UserFeed`: Lista de posts do feed
- [ ] `ShareButton`: Componente de compartilhamento

### Páginas
- [ ] `/perfil/[userId]/page.tsx`: Página pública do perfil
- [ ] `/perfil/[userId]/medalhas/page.tsx`: Timeline de medalhas
- [ ] `/post/[slug]/page.tsx`: Página isolada do post (SEO)

### Utilitários de Compartilhamento
- [ ] `src/lib/utils/share.ts`: Funções de compartilhamento
- [ ] Integração com Web Share API para mobile
- [ ] Dropdown com redes sociais para desktop

### Jobs
- [ ] Job para calcular medalhas históricas de rankings existentes
- [ ] Cron job para processar fila de ações pendentes

## Configuração

### Variáveis de Ambiente

```bash
# Cache Provider (opcional, padrão: 'memory')
CACHE_PROVIDER=memory  # ou 'redis'

# Redis URL (se usar Redis)
REDIS_URL=redis://localhost:6379

# Queue Provider (opcional, padrão: 'database')
QUEUE_PROVIDER=database  # ou 'rabbitmq' | 'sqs' | 'redis'

# Cron Secret Token (para processar fila)
CRON_SECRET_TOKEN=your-secret-token
```

## Migração Aplicada

**Migration**: `20260109173350_add_public_profile_tables`

Inclui:
- Todas as novas tabelas
- Índices otimizados
- Triggers para contadores denormalizados
- Foreign keys e constraints

## Notas de Implementação

### Processamento Otimista
- Todas as ações de interação tentam executar imediatamente
- Se falhar, ação fica na fila para processamento posterior
- Frontend recebe resposta otimista imediatamente

### Contadores Denormalizados
- Atualizados via triggers SQL
- Melhoram performance significativamente
- Mantêm consistência automática

### Cache em Múltiplas Camadas
- Cache em memória (rápido, temporário)
- Cache no banco (persistente, fonte de verdade)
- Estrutura preparada para Redis (futuro)

### Escalabilidade
- Cursor-based pagination para grandes volumes
- Índices compostos otimizados
- Preparado para read replicas e sharding
- Estrutura preparada para filas externas

## Conclusão

Implementação completa do backend para página pública de perfil com feed e medalhas, seguindo boas práticas de redes sociais e preparada para escalar. A estrutura permite migração transparente para tecnologias mais robustas (Redis, RabbitMQ) sem mudanças significativas no código dos serviços.


