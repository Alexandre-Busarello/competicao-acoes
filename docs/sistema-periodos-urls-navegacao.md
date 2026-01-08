# Sistema de Períodos com URLs e Navegação

## Data
2025-01-08

## Resumo
Implementação completa do sistema de visualização de rankings e carteiras por período (mês/ano) com URLs compartilháveis, indicadores de período vigente, e navegação via dropdowns. O sistema permite visualizar rankings e carteiras de períodos anteriores, com URLs únicas para cada visualização.

## Regras de Reset e Premiação

### Ranking Mensal

- **Rentabilidade resetada mensalmente**: No primeiro dia de cada mês, a rentabilidade é resetada automaticamente
- **Considera apenas operações do mês**: A rentabilidade mensal considera apenas as transações realizadas dentro do mês específico
- **Premiação**: A premiação não acontece exatamente no reset do mês. Nossa equipe analisa os resultados e entra em contato com os vencedores após análise completa dos dados

**Exemplo**: Em fevereiro/2025, mostra apenas transações de 01/02/2025 até 28/02/2025 (ou data atual se ainda estiver em fevereiro)

### Ranking Anual

- **Considera todas as transações do ano**: A rentabilidade anual considera todas as transações realizadas dentro do ano específico
- **Retorno acumulado**: O ranking anual mostra o retorno acumulado de todos os meses do ano (não uma projeção anualizada)
- **Data de encerramento flexível**: O ranking anual não necessariamente encerra apenas no fim do ano. A equipe pode decidir encerrar antes e criar uma data de corte específica

**Exemplo**: Em 2025, mostra todas as transações de 01/01/2025 até a data de corte definida pela equipe (que pode ser antes de 31/12/2025)

## Estrutura de URLs

### Rankings

- **Mensal**: `/ranking/mensal/[year]/[month]` (ex: `/ranking/mensal/2025/02`)
- **Anual**: `/ranking/anual/[year]` (ex: `/ranking/anual/2025`)
- **Default**: `/ranking` → redireciona automaticamente para período vigente (`/ranking/mensal/2025/02`)

### Carteiras

- **Mensal**: `/carteira/[userId]/mensal/[year]/[month]` (ex: `/carteira/123/mensal/2025/02`)
- **Anual**: `/carteira/[userId]/anual/[year]` (ex: `/carteira/123/anual/2025`)
- **Default**: `/carteira/[userId]` → redireciona automaticamente para período vigente

## Funcionalidades Implementadas

### 1. Utilitários de Período

**Arquivo**: `src/lib/utils/period-utils.ts`

Funções utilitárias para trabalhar com períodos:
- `getCurrentPeriod()`: Obtém período atual (ano e mês vigente)
- `isValidPeriod()`: Valida se um período é válido
- `formatPeriod()`: Formata período para exibição (ex: "Janeiro 2025")
- `getPeriodRange()`: Obtém intervalo de datas para um período
- `isCurrentPeriod()`: Verifica se um período é o vigente
- `getAvailableYears()`: Lista anos disponíveis
- `getAvailableMonths()`: Lista meses disponíveis para um ano

### 2. Schema do Banco de Dados

**Arquivo**: `prisma/schema.prisma`

Atualizado `RankingCalculation` para incluir:
- `year` (Int, obrigatório): Ano do ranking
- `month` (Int?, opcional): Mês do ranking (apenas para ranking mensal)

**Índices**:
- `@@index([period, year, month, calculatedAt])`: Índice composto para buscas eficientes por período específico
- `@@index([period, calculatedAt])`: Índice para compatibilidade com código existente

**Migração**: `20260108180819_add_period_fields_to_ranking_calculation`
- Adiciona campos `year` e `month`
- Atualiza registros existentes baseado em `calculatedAt`
- Cria índices otimizados

### 3. Ranking Service

**Arquivo**: `src/lib/services/ranking-service.ts`

**Modificações**:

- `calculateRanking()`: Agora aceita parâmetros opcionais `year` e `month`
  - Se não fornecidos, usa período vigente
  - Filtra transações pelo período específico usando `getPeriodRange()`
  - Salva no banco com `year` e `month`

- `getRanking()`: Agora aceita parâmetros opcionais `year` e `month`
  - Busca ranking específico do banco usando `year` e `month`
  - Se não encontrar, calcula para o período específico

- `calculateBothRankings()`: Mantém comportamento atual (período vigente)
  - Usa período vigente ao salvar no banco

### 4. API Routes

**Arquivo**: `src/app/api/ranking/route.ts`

Atualizado para aceitar query params:
- `?period=mensal&year=2025&month=02`
- `?period=anual&year=2025`

Validação de parâmetros:
- Ano deve estar entre 2026 (ano de lançamento) e ano atual + 1
- Mês deve estar entre 1 e 12
- Se ano é atual, mês não pode ser futuro

### 5. Componentes de Navegação

#### PeriodSelector (`src/components/ranking/PeriodSelector.tsx`)

Componente com dropdowns para seleção de mês e ano:
- Dropdown de ano com lista de anos disponíveis
- Dropdown de mês (apenas para ranking mensal)
- Navegação via URLs (não apenas state)
- Mostra "(Atual)" ao lado do período vigente
- Aceita `basePath` para funcionar em diferentes contextos (ranking ou carteira)

#### PeriodIndicator (`src/components/ranking/PeriodIndicator.tsx`)

Badge mostrando período atual:
- Formato: "Janeiro 2025" ou "2025"
- Destaque visual quando não está no período vigente
- Mostra "(Atual)" quando é o período vigente

### 6. Páginas de Ranking

#### `/ranking/mensal/[year]/[month]/page.tsx`

- Extrai `year` e `month` dos parâmetros da URL
- Valida parâmetros e redireciona se inválidos
- Busca ranking do período específico via API
- Mostra `PeriodSelector` e `PeriodIndicator`
- Navegação entre períodos via tabs do `RankingHeader`

#### `/ranking/anual/[year]/page.tsx`

- Similar ao mensal, mas sem parâmetro de mês
- Valida apenas o ano
- Busca ranking anual do período específico

#### `/ranking/page.tsx`

- Redireciona automaticamente para período vigente
- Mantém compatibilidade com links antigos

### 7. Páginas de Carteira

#### `/carteira/[id]/mensal/[year]/[month]/page.tsx`

- Mostra carteira filtrada por período mensal específico
- `PeriodSelector` disponível apenas para usuários premium
- `PeriodIndicator` sempre visível
- Transações filtradas pelo período específico

#### `/carteira/[id]/anual/[year]/page.tsx`

- Similar ao mensal, mas para período anual
- Mostra retorno acumulado do ano

#### `/carteira/[id]/page.tsx`

- Redireciona automaticamente para período vigente (mensal)

### 8. Componentes Atualizados

#### UserTransactionList

- Aceita props opcionais: `period`, `year`, `month`
- Filtra transações pelo período específico quando fornecido
- Fallback para ano atual se período não especificado

#### CompetitorCard

- Aceita props opcionais: `period`, `year`, `month`
- Cria links de carteira com período específico
- Mantém compatibilidade com links antigos (sem período)

#### RankingList

- Aceita props opcionais: `period`, `year`, `month`
- Passa período para `CompetitorCard` para criar links corretos

#### UserRankCard

- Aceita props opcionais: `competitors`, `totalParticipants`, `displayedPeriod`
- Usa dados do período específico quando fornecidos
- Fallback para dados do store quando não especificado
- Mostra label correto ("este mês" ou "este ano")

### 9. Página "Como Funciona"

**Arquivo**: `src/app/como-funciona/page.tsx`

Adicionada seção completa "Regras de Reset e Premiação" com:

**Ranking Mensal**:
- Explicação sobre reset mensal no primeiro dia
- Consideração apenas de operações do mês
- Processo de premiação (análise pela equipe)

**Ranking Anual**:
- Consideração de todas as transações do ano
- Retorno acumulado (não anualizado)
- Data de encerramento flexível

**Visualização de Períodos Anteriores**:
- Como usar os seletores de período
- URLs compartilháveis com exemplos

## Fluxo de Dados

```
Usuário acessa /ranking/mensal/2025/02
  ↓
Página extrai year=2025, month=02 dos params
  ↓
Valida período usando isValidPeriod()
  ↓
Chama API: /api/ranking?period=mensal&year=2025&month=02
  ↓
API busca RankingCalculation com period='mensal', year=2025, month=02
  ↓
Se não encontrar, calcula ranking para período específico
  ↓
Retorna ranking filtrado por período
  ↓
Frontend exibe ranking com PeriodIndicator mostrando "Fevereiro 2025"
```

## Considerações de UX

1. **Indicador de Período Vigente**: Badge destacado quando visualizando período atual
2. **Navegação**: Dropdowns mostram apenas períodos disponíveis (desde lançamento do sistema em 2026)
3. **Fallback**: URLs inválidas redirecionam automaticamente para período vigente
4. **Performance**: Cache de rankings por período no `RankingCalculation`
5. **Compartilhamento**: URLs diretas permitem compartilhar visões específicas
6. **Mobile**: Componentes responsivos e otimizados para mobile
7. **Acessibilidade**: Labels e aria-labels mantidos para screen readers

## Arquivos Criados

### Novos Arquivos

1. `src/lib/utils/period-utils.ts` - Utilitários de período
2. `src/components/ranking/PeriodSelector.tsx` - Seletor de período com dropdowns
3. `src/components/ranking/PeriodIndicator.tsx` - Indicador visual de período
4. `src/components/ui/select.tsx` - Componente Select do shadcn/ui
5. `src/app/(main)/ranking/mensal/[year]/[month]/page.tsx` - Página de ranking mensal
6. `src/app/(main)/ranking/anual/[year]/page.tsx` - Página de ranking anual
7. `src/app/carteira/[id]/mensal/[year]/[month]/page.tsx` - Página de carteira mensal
8. `src/app/carteira/[id]/anual/[year]/page.tsx` - Página de carteira anual

### Arquivos Modificados

1. `prisma/schema.prisma` - Adicionados campos `year` e `month` ao `RankingCalculation`
2. `prisma/migrations/20260108180819_add_period_fields_to_ranking_calculation/migration.sql` - Migração do banco
3. `src/lib/services/ranking-service.ts` - Suporte a períodos específicos
4. `src/app/api/ranking/route.ts` - Aceita parâmetros de período
5. `src/app/(main)/ranking/page.tsx` - Redireciona para período vigente
6. `src/app/carteira/[id]/page.tsx` - Redireciona para período vigente
7. `src/components/ranking/UserRankCard.tsx` - Aceita props de período
8. `src/components/ranking/CompetitorCard.tsx` - Cria links com período
9. `src/components/ranking/RankingList.tsx` - Passa período para cards
10. `src/components/portfolio/UserTransactionList.tsx` - Filtra por período
11. `src/app/como-funciona/page.tsx` - Adicionada seção de regras de reset

## Benefícios

1. **Histórico**: Usuários podem visualizar rankings e carteiras de períodos anteriores
2. **Compartilhamento**: URLs únicas permitem compartilhar visões específicas
3. **Transparência**: Regras de reset claramente documentadas
4. **Flexibilidade**: Sistema suporta datas de corte customizadas para ranking anual
5. **Performance**: Cache por período melhora performance
6. **UX**: Navegação intuitiva com dropdowns e indicadores visuais

## Próximos Passos (Opcional)

1. Adicionar campo `cutoffDate` opcional ao `RankingCalculation` para datas de corte customizadas
2. Adicionar filtros adicionais (ex: top 10, top 50)
3. Adicionar gráficos de evolução por período
4. Adicionar exportação de dados por período
5. Adicionar notificações quando período está prestes a resetar

