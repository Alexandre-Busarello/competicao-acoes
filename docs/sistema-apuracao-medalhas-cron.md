# Sistema de Apuração Mensal de Medalhas via CRON

## Data: 09/01/2026

## Resumo

Implementação de sistema automatizado de apuração de medalhas que executa via CRON no primeiro dia de cada mês às 00:01 UTC. O sistema apura o último ranking do mês anterior, cria medalhas para os top 3 e garante idempotência para evitar duplicação.

## Objetivo

Automatizar a apuração de medalhas mensais e anuais, garantindo que:
- Apenas o último ranking de cada período seja considerado
- Medalhas sejam criadas automaticamente para os top 3
- Sistema seja idempotente (pode executar múltiplas vezes sem criar duplicatas)
- Funcione corretamente em múltiplos fusos horários usando UTC

## Arquitetura

### Fluxo de Execução

1. **CRON Externo** executa no 1º dia do mês às 00:01 UTC
2. **Endpoint** `/api/medals/settle` recebe requisição autenticada
3. **MedalService** determina período anterior em UTC
4. **Verificação** se período já foi apurado (via `MedalSettlement`)
5. **Busca** último ranking do período
6. **Processamento** dos top 3 e criação/atualização de medalhas
7. **Marcação** do período como apurado
8. **Catch-up** de períodos anteriores pendentes

### Componentes

#### 1. Funções Utilitárias UTC

**Arquivo**: `src/lib/utils/utc-utils.ts`

Funções para trabalhar com datas em UTC:
- `getUTCPreviousPeriod()`: Retorna mês/ano anterior em UTC
- `isUTCJanuary()`: Verifica se estamos em Janeiro em UTC
- `getUTCPreviousYear()`: Retorna ano anterior em UTC

#### 2. Tabela de Controle

**Model**: `MedalSettlement`

Controla quais períodos já foram apurados:
- `period`: 'mensal' | 'anual'
- `year`: Ano do período
- `month`: Mês do período (null para anual)
- `settledAt`: Timestamp UTC da apuração

**Constraint**: `@@unique([period, year, month])` garante idempotência

#### 3. MedalService

**Arquivo**: `src/lib/services/medal-service.ts`

Novos métodos:
- `settleMedalsForPeriod()`: Apura medalhas para um período específico
- `settleMedals()`: Método principal chamado pelo CRON
- `findUnsettledPeriods()`: Encontra períodos pendentes

#### 4. Endpoint CRON

**Arquivo**: `src/app/api/medals/settle/route.ts`

- Autenticação via Bearer Token
- Rate limiting: máximo 1 execução por hora
- Retorna estatísticas da apuração

## Implementação Técnica

### 1. Determinação do Período

O sistema usa funções UTC para determinar o período a apurar:

```typescript
const previousPeriod = getUTCPreviousPeriod();
// Se executar em 01/02/2026 00:01 UTC, retorna { year: 2026, month: 1 }
```

### 2. Verificação de Apuração

Antes de processar, verifica se o período já foi apurado:

```typescript
const existingSettlement = await prisma.medalSettlement.findUnique({
  where: {
    period_year_month: { period, year, month }
  }
});
```

Se existe, pula o processamento (idempotência).

### 3. Busca do Último Ranking

Busca o último ranking calculado do período:

```typescript
const lastRanking = await prisma.rankingCalculation.findFirst({
  where: { period, year, month },
  orderBy: { calculatedAt: 'desc' }
});
```

### 4. Processamento dos Top 3

Para cada posição 1, 2, 3:
- Verifica se medalha já existe
- Se não existe, cria nova medalha
- Se existe e posição mudou, atualiza

### 5. Marcação como Apurado

Cria registro em `MedalSettlement` para evitar reprocessamento.

### 6. Catch-up Automático

Após apurar o período atual, processa períodos anteriores que ainda não foram apurados.

## Tratamento de Fusos Horários

### UTC como Padrão

- Todo o sistema usa UTC para evitar problemas de fuso horário
- PostgreSQL armazena timestamps em UTC automaticamente
- Funções JavaScript usam métodos `getUTC*()` para garantir UTC

### Exemplo Prático

- CRON executando em 01/02/2026 00:01 UTC
- Apura medalhas de Janeiro/2026 (mês anterior)
- Se for Janeiro UTC, também apura ranking anual de 2025

### Conversão de Fuso

- 00:01 UTC = 21:01 do dia anterior no Brasil (UTC-3)
- Sistema funciona corretamente independente do fuso do servidor

## Configuração do CRON

### Schedule

```
1 0 1 * *  (1º dia do mês às 00:01 UTC)
```

### Requisição

```bash
curl -X POST https://seu-dominio.com/api/medals/settle \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

### Resposta Esperada

```json
{
  "success": true,
  "periodsSettled": 1,
  "medalsCreated": 3,
  "monthlySettled": {
    "year": 2026,
    "month": 1
  },
  "annualSettled": null,
  "catchUpProcessed": 0,
  "durationMs": 1234
}
```

## Segurança

- Token Bearer obrigatório (`CRON_SECRET_TOKEN`)
- Rate limiting: máximo 1 execução por hora
- Logs detalhados com timestamps UTC para auditoria
- Idempotência garantida via `MedalSettlement`

## Tratamento de Erros

- Se ranking não encontrado: loga erro mas não falha (mês pode não ter tido participantes)
- Se erro ao criar medalha: loga e continua com próximos usuários
- Se CRON executar múltiplas vezes: idempotência previne duplicação
- Logs incluem timestamps UTC para facilitar debug

## Casos Especiais

### Janeiro UTC

Quando o CRON executa em Janeiro (01/01), além de apurar o ranking mensal de Dezembro, também apura o ranking anual do ano anterior.

### Períodos Pendentes

O sistema processa automaticamente períodos anteriores que ainda não foram apurados (catch-up). Isso garante que mesmo se o CRON falhar em algum mês, os períodos serão apurados na próxima execução.

## Arquivos Criados/Modificados

1. **`src/lib/utils/utc-utils.ts`** - NOVO: Funções utilitárias UTC
2. **`prisma/schema.prisma`** - Adicionado model `MedalSettlement`
3. **`prisma/migrations/20260109181351_add_medal_settlement/migration.sql`** - Migration
4. **`src/lib/services/medal-service.ts`** - Adicionados métodos de apuração
5. **`src/app/api/medals/settle/route.ts`** - NOVO: Endpoint CRON
6. **`CRON_SETUP.md`** - Documentação atualizada

## Observações Importantes

- **UTC como Padrão**: Todo o sistema usa UTC para evitar problemas de fuso horário
- **Banco PostgreSQL**: Armazena timestamps em UTC automaticamente
- **CRON Schedule**: `1 0 1 * *` = 1º dia do mês às 00:01 UTC
- **Configuração Externa**: CRON será configurado em serviço externo (org br), não na Vercel
- **Múltiplos Fusos**: Sistema funciona corretamente independente do fuso do servidor
- **Idempotência**: Sistema pode executar múltiplas vezes sem criar duplicatas
- **Catch-up Automático**: Períodos anteriores são processados automaticamente

## Testes Recomendados

1. Testar apuração de mês anterior em UTC
2. Testar idempotência (executar 2x não cria duplicatas)
3. Testar catch-up de múltiplos meses pendentes
4. Testar apuração anual em Janeiro UTC
5. Testar cenário sem ranking (mês sem participantes)
6. Testar em diferentes fusos horários: Simular execução em servidores de diferentes regiões

## Instruções para Configuração Externa

Você deve configurar o CRON em um serviço externo (org br) com as seguintes especificações:

- **URL**: `https://seu-dominio.com/api/medals/settle`
- **Método**: POST
- **Headers**:
  - `Authorization: Bearer SEU_TOKEN_AQUI`
  - `Content-Type: application/json`
- **Schedule**: `1 0 1 * *` (1º dia do mês às 00:01 UTC)
- **Timezone**: UTC (importante!)

O sistema está preparado para funcionar em múltiplos fusos horários, mas o CRON deve ser configurado para executar em UTC.

