# Correção: Feed Global - Garantir Aparição de Posts Recentes

## Problema Identificado

Posts de usuários de teste não estavam aparecendo no Feed Global, mesmo quando criados recentemente. O problema ocorria porque:

1. **Paginação com cursor**: Quando havia um cursor (páginas seguintes), a busca apenas retornava posts após o cursor, podendo pular posts novos que foram criados entre a primeira página e a página atual.

2. **Ordenação por engajamento**: Posts novos sem engajamento (likes/comentários) ficavam atrás de posts antigos com engajamento, mesmo sendo mais recentes.

## Solução Implementada

### 1. Busca de Posts Recentes em Páginas Seguintes

**Você deve** buscar posts muito recentes (últimas 24 horas) mesmo quando há cursor, garantindo que posts novos sempre apareçam.

**Você NÃO deve** depender apenas do cursor para buscar posts em páginas seguintes, pois isso pode pular posts novos.

**Implementação:**
- Quando há cursor, além de buscar posts após o cursor, também buscar posts das últimas 24 horas
- Combinar os resultados, removendo duplicatas e priorizando posts mais recentes
- Garantir que posts novos sempre apareçam, independente da página atual

### 2. Prioridade Absoluta para Posts Muito Recentes

**Você deve** garantir que posts muito recentes (últimas 2 horas) sempre apareçam no topo do feed, independente do engajamento.

**Você NÃO deve** ordenar apenas por engajamento sem considerar a recência dos posts, pois isso pode ocultar posts novos importantes.

**Implementação:**
- Posts criados nas últimas 2 horas são separados e ordenados apenas por data (mais recentes primeiro)
- Esses posts aparecem ANTES de todos os outros posts, mesmo que tenham menos engajamento
- Posts recentes (últimas 24 horas mas mais de 2 horas) recebem boost de +5 pontos no score de engajamento
- Posts mais antigos (mais de 24 horas) são ordenados apenas por engajamento (score DESC, createdAt DESC)
- A ordenação final é: `[posts muito recentes ordenados por data] + [posts recentes com boost ordenados por engajamento] + [posts antigos ordenados por engajamento]`

### 3. Sistema de Engajamento

**Você deve** usar o seguinte sistema de pontuação:
- Like: 2 pontos
- Comentário: 3 pontos
- Score total: `likeCount * 2 + commentCount * 3`

**Você NÃO deve** usar pesos diferentes ou ignorar comentários na contagem de engajamento.

### 3. Ajustes na Lógica de Ordenação

**Você deve** aplicar o boost de prioridade tanto para usuários logados quanto não logados.

**Você NÃO deve** aplicar lógicas diferentes de ordenação para diferentes tipos de usuários quando se trata de posts recentes.

**Implementação:**
- Boost aplicado em ambos os fluxos (com e sem usuário logado)
- Posts muito recentes sempre têm prioridade sobre posts antigos, mesmo sem engajamento

## Arquivos Modificados

- `src/lib/services/global-feed-service.ts`
  - Modificada a lógica de busca quando há cursor
  - Adicionado boost de prioridade para posts muito recentes
  - Ajustada ordenação para considerar recência junto com engajamento

## Comportamento Esperado

1. **Posts novos sempre aparecem**: Posts criados nas últimas 24 horas sempre aparecem no feed, mesmo em páginas seguintes
2. **Prioridade para posts recentes**: Posts criados nas últimas 2 horas aparecem antes de posts antigos, mesmo sem engajamento
3. **Balanceamento**: Posts com engajamento ainda têm prioridade, mas posts muito recentes não ficam completamente ocultos
4. **Posts visualizados sempre aparecem**: Posts visualizados sempre aparecem no final do feed, mesmo ao navegar páginas seguintes (não desaparecem)
5. **Feed nunca zera**: Quando há poucos posts (menos que o limite), TODOS os posts são mostrados, garantindo que o feed nunca fique vazio
6. **Rotação contínua**: Posts visualizados vão para o final da fila, mas continuam aparecendo, criando uma rotação contínua de conteúdo

## Testes Recomendados

1. Criar um post de teste e verificar se aparece no Feed Global imediatamente
2. Navegar para páginas seguintes do feed e verificar se posts novos ainda aparecem
3. Verificar se posts muito recentes aparecem antes de posts antigos com engajamento
4. Testar com usuário logado e não logado para garantir comportamento consistente

## Notas Técnicas

- Posts muito recentes (últimas 2 horas) têm prioridade absoluta e aparecem antes de todos os outros posts
- Isso garante que posts novos sempre sejam visíveis, mesmo sem engajamento inicial
- Posts recentes (últimas 24h mas mais de 2h) recebem boost de +5 pontos no score de engajamento
- Sistema de engajamento: Like = 2 pontos, Comentário = 3 pontos
- A busca na primeira página busca até 1000 posts públicos para garantir cobertura completa
- A busca de posts recentes em páginas seguintes busca até 50 posts das últimas 24 horas para garantir cobertura
- Posts visualizados são buscados separadamente do banco para garantir que sempre apareçam, mesmo quando há cursor
- A combinação de resultados remove duplicatas usando um Map, priorizando posts mais recentes
- **Lógica de poucos posts**: Quando há poucos posts (≤ limite), TODOS são mostrados para nunca zerar o feed
- **Lógica de muitos posts**: Quando há muitos posts (> limite), aplica limites e paginação (30% seguidos, 50% não visualizados, 20% visualizados)
- A paginação é aplicada APÓS a ordenação completa, garantindo que posts muito recentes não sejam cortados prematuramente
- Posts visualizados sempre aparecem no final, criando uma rotação contínua de conteúdo

