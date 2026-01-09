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

### 2. Boost de Prioridade para Posts Muito Recentes

**Você deve** dar boost de prioridade moderado para posts muito recentes (últimas 2 horas) na ordenação por engajamento.

**Você NÃO deve** ordenar apenas por engajamento sem considerar a recência dos posts, mas também NÃO deve usar boost excessivo que sobreponha posts com engajamento significativo.

**Implementação:**
- Posts criados nas últimas 2 horas recebem um boost moderado de +20 pontos no score de engajamento
- Isso garante que posts novos apareçam antes de posts muito antigos sem engajamento
- Posts com engajamento significativo (ex: 30+ likes = 60+ pontos) ainda têm prioridade sobre posts novos sem engajamento
- A ordenação final considera: `boostedScore DESC, createdAt DESC`

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

## Testes Recomendados

1. Criar um post de teste e verificar se aparece no Feed Global imediatamente
2. Navegar para páginas seguintes do feed e verificar se posts novos ainda aparecem
3. Verificar se posts muito recentes aparecem antes de posts antigos com engajamento
4. Testar com usuário logado e não logado para garantir comportamento consistente

## Notas Técnicas

- O boost de 20 pontos é suficiente para garantir que posts muito recentes apareçam antes de posts muito antigos sem engajamento, mas não sobrepõe posts com engajamento significativo
- Exemplo: Um post antigo com 30 likes e 5 comentários (score = 65) ainda terá prioridade sobre um post novo sem engajamento (score = 0 + 20 boost = 20)
- A busca de posts recentes em páginas seguintes busca até 50 posts das últimas 24 horas para garantir cobertura
- A combinação de resultados remove duplicatas usando um Map, priorizando posts mais recentes

