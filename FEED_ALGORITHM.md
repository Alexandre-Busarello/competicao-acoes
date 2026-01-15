# Algoritmo do Feed Global

## Visão Geral

O algoritmo do feed global organiza os posts em **camadas temporais** priorizando conteúdo recente e engajamento, enquanto estimula o scroll do usuário para ver posts mais novos.

## Estrutura de Camadas

O feed é organizado em três camadas principais, na seguinte ordem de **prioridade** (do topo para baixo):

1. **DIA** - Posts das últimas 24 horas (aparecem primeiro)
2. **SEMANA** - Posts dos últimos 7 dias (excluindo o dia atual) - aparecem quando acabam os do DIA
3. **ANTIGOS** - Posts com mais de 7 dias - aparecem quando acabam os da SEMANA

### Ordem de Exibição

```
┌─────────────────────────┐
│   DIA (topo)            │ ← Posts do dia aparecem primeiro
│   - Ordenados por       │
│     engajamento         │
│   - Mais antigos do dia │
│     primeiro            │
│   - Mais novos do dia   │
│     no final            │ ← Estimula scroll para ver posts mais recentes
├─────────────────────────┤
│   SEMANA (meio)         │ ← Aparecem quando acabam os do DIA
│   - Ordenados por       │
│     engajamento         │
│   - Mais antigos primeiro│
├─────────────────────────┤
│   ANTIGOS (embaixo)     │ ← Aparecem quando acabam os da SEMANA
│   - Ordenados por       │
│     engajamento         │
│   - Mais antigos primeiro│
└─────────────────────────┘
```

### Fluxo de Carregamento

1. **Primeiro**: Mostra posts do DIA ordenados por engajamento
2. **Depois**: Quando usuário scrolla e acabam os do DIA, mostra posts da SEMANA
3. **Por último**: Quando acabam os da SEMANA, mostra posts ANTIGOS

## Cálculo de Engajamento

Cada post recebe um **score de engajamento** calculado pela fórmula:

```
Score Base = (likes × 2) + (comentários × 3) + (votos em enquete × 1.5)
```

### Boost Temporário Decrescente para Posts Novos

Posts criados há **menos de 24 horas** recebem um **boost temporário decrescente** baseado na idade:

```
Se idade do post <= 15 minutos:
  Boost = 100 pontos
Senão se idade do post < 24 horas:
  Boost = 100 × (1 - (idade - 15) / (1440 - 15))
  Boost decresce linearmente até 0 pontos em 24 horas
Senão:
  Boost = 0 pontos
```

**Exemplos de boost por idade:**
- **0-15 minutos**: 100 pontos (boost máximo)
- **30 minutos**: ~95 pontos
- **1 hora**: ~90 pontos
- **6 horas**: ~60 pontos
- **12 horas**: ~30 pontos
- **24 horas**: 0 pontos (sem boost)

Isso garante que posts mais recentes apareçam no topo do feed mesmo sem engajamento inicial, com prioridade maior para os mais novos.

### Exemplo:
- **Post muito recente** (criado há 15 min) com 0 likes: `(0 × 2) + (0 × 3) + 100 = 100 pontos` ← Boost máximo
- **Post recente** (criado há 30 min) com 0 likes: `(0 × 2) + (0 × 3) + 95 = 95 pontos` ← Boost decrescente
- **Post médio** (criado há 6 horas) com 0 likes: `(0 × 2) + (0 × 3) + 60 = 60 pontos` ← Boost menor
- Post com 5 likes, 2 comentários e 10 votos em enquete: `(5 × 2) + (2 × 3) + (10 × 1.5) = 31 pontos`
- **Post recente** (criado há 1 hora) com 5 likes: `(5 × 2) + 90 = 100 pontos` ← Boost + engajamento

### Pesos de Engajamento:
- **Like**: 2 pontos
- **Comentário**: 3 pontos
- **Voto em Enquete**: 1.5 pontos
- **Boost Temporário Decrescente** (posts < 24 horas): 100 pontos (0-15 min) → 0 pontos (24 horas)

## Aleatoriedade (Q = 15%)

Para evitar que o feed fique sempre igual, aplicamos **15% de aleatoriedade** ao score de engajamento:

```
Score Final = Score Base × (1 + variação aleatória)
```

Onde a variação aleatória é baseada em um **seed** único por **sessão**, garantindo:
- **Consistência na mesma sessão**: Seed armazenado no `sessionStorage`, mantido durante toda a sessão do usuário
- **Cache eficiente**: Como o seed é consistente na sessão, o cache funciona corretamente
- **Variação entre sessões**: Cada nova sessão recebe um seed diferente
- **Fallback inteligente**: Se não houver seed explícito, usa seed baseado em período (por hora)

### Gerenciamento de Seed

- **Frontend**: Gera seed único ao iniciar sessão e armazena em `sessionStorage`
- **Backend**: Se não receber seed, gera um baseado em período (ano-mês-dia-hora)
- **Benefício**: Permite cache eficiente mantendo aleatoriedade controlada

## Ordenação Dentro de Cada Camada

### Camadas ANTIGOS e SEMANA:
1. **Primário**: Score de engajamento (maior primeiro)
2. **Secundário**: Data de criação (mais antigo primeiro)

### Camada DIA:
1. **Primário**: Score de engajamento (maior primeiro)
2. **Secundário**: Data de criação (mais **novo** primeiro)
   - Isso garante que os posts mais recentes do dia fiquem no final, estimulando scroll

## Paginação e Scroll Infinito

### Primeira Página
- Busca até 500 posts de cada camada
- Aplica algoritmo de ordenação
- Retorna os primeiros `limit` posts (padrão: 20)

### Páginas Seguintes
- Usa cursor-based pagination
- Busca posts seguintes mantendo ordem das camadas
- Quando não há mais posts, entra em **loop infinito**

## Loop Infinito

Quando todos os posts disponíveis foram exibidos:

1. Sistema tenta buscar posts que ainda não foram vistos
2. Se não houver mais posts novos, reinicia mostrando todos novamente
3. O scroll nunca acaba - sempre há conteúdo para carregar

## Cache

### Estratégia de Cache
- **TTL**: 5 minutos
- **Key**: Baseada em parâmetros da query (userId, limit, cursor, seed, etc.)
- **Provider**: Atualmente em memória, preparado para migração para Redis

### Cache Key Format
```
global-feed:{userId}:{limit}:{cursor}:{seed}:{isLoop}:{excludeIds}
```

## Visualizações (Usuários Logados)

Para usuários autenticados:

1. Posts são separados em **visualizados** e **não visualizados**
2. Ordem mantida: não visualizados primeiro, visualizados depois
3. Respeita ordem das camadas: ANTIGOS → SEMANA → DIA

## Exemplo Prático

### Cenário:
- 10 posts ANTIGOS (7+ dias)
- 15 posts da SEMANA (últimos 7 dias)
- 20 posts do DIA (últimas 24h)

### Resultado no Feed:
```
Topo do Scroll:
├─ Post DIA #1 (engajamento: 80, criado há 20 horas) ← Mais antigo do dia, maior engajamento
├─ Post DIA #2 (engajamento: 75, criado há 18 horas)
├─ Post DIA #3 (engajamento: 70, criado há 15 horas)
├─ ...
├─ Post DIA #19 (engajamento: 35, criado há 2 horas)
└─ Post DIA #20 (engajamento: 30, criado há 1 hora) ← Mais novo do dia (embaixo)

Quando acabam os do DIA, aparecem os da SEMANA:
├─ Post SEMANA #1 (engajamento: 60, criado há 5 dias)
├─ Post SEMANA #2 (engajamento: 55, criado há 4 dias)
└─ ...

Quando acabam os da SEMANA, aparecem os ANTIGOS:
├─ Post ANTIGO #1 (engajamento: 50, criado há 30 dias)
└─ Post ANTIGO #2 (engajamento: 45, criado há 25 dias)
```

## Benefícios do Algoritmo

1. **Descoberta de Conteúdo**: Usuários veem posts antigos que podem ter perdido
2. **Engajamento**: Posts com mais interação aparecem primeiro em cada camada
3. **Novidade**: Posts mais recentes ficam embaixo, estimulando scroll
4. **Variedade**: Aleatoriedade evita feed repetitivo
5. **Performance**: Cache reduz carga no banco de dados

## Configurações

### Parâmetros Ajustáveis

- **Q de Aleatoriedade**: 15% (configurável em `applyRandomness`)
- **TTL do Cache**: 5 minutos (300 segundos)
- **Limite por Página**: 20 posts (padrão)
- **Buffer de Busca**: 500 posts por camada na primeira página

## Migração para Redis

O sistema está preparado para migração para Redis:

1. Cache service já usa adapter pattern
2. Basta configurar `REDIS_URL` no ambiente
3. Sistema detecta automaticamente e usa Redis se disponível
4. Fallback automático para memória se Redis não estiver disponível

## Notas Técnicas

- Ordenação por data usa `createdAt` do Prisma
- Seed aleatório usa timestamp atual para garantir unicidade
- Visualizações são consideradas apenas para usuários logados
- Posts privados são filtrados automaticamente para usuários não-autorizados

