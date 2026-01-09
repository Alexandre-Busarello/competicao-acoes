# Configuração do Cron Job

## Endpoints Disponíveis

### 1. Endpoint de Atualização de Preços

O endpoint `/api/prices/update` é protegido por token e deve ser chamado periodicamente para atualizar preços e recalcular o ranking.

### 2. Endpoint de Expiração de Assinaturas

O endpoint `/api/subscriptions/expire` é protegido por token e deve ser chamado diariamente para cancelar automaticamente assinaturas premium expiradas (após 12 meses).

**Documentação completa**: Ver `docs/sistema-expiracao-premium-12-meses.md`

### 3. Endpoint de Apuração de Medalhas

O endpoint `/api/medals/settle` é protegido por token e deve ser chamado no primeiro dia de cada mês às 00:01 UTC para apurar medalhas do mês anterior.

**Schedule**: `1 0 1 * *` (1º dia do mês às 00:01 UTC)

**Nota sobre UTC**: 
- Sistema usa UTC para evitar problemas de fuso horário
- 00:01 UTC = 21:01 do dia anterior no Brasil (UTC-3)
- Exemplo: CRON executando em 01/02/2026 00:01 UTC apura medalhas de Janeiro/2026
- Em Janeiro, também apura ranking anual do ano anterior

**O que faz**:
- Busca o último ranking calculado do mês anterior
- Cria medalhas (ouro, prata, bronze) para os top 3 do ranking mensal
- Se for Janeiro, também apura ranking anual do ano anterior
- Processa períodos anteriores que ainda não foram apurados (catch-up)
- Garante idempotência: se executar múltiplas vezes, não cria duplicatas

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
CRON_SECRET_TOKEN=seu_token_seguro_aqui
PRICE_CACHE_TTL=900
```

**Importante:** Gere um token seguro aleatório para `CRON_SECRET_TOKEN`. Exemplo:
```bash
openssl rand -hex 32
```

### 2. Configuração do Cron

#### Opção 1: Cron do Sistema (Linux/Mac)

Edite o crontab:
```bash
crontab -e
```

Adicione as linhas:
```cron
# Atualização de preços (a cada 15 minutos)
*/15 * * * * curl -X POST https://seu-dominio.com/api/prices/update -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Expiração de assinaturas (diariamente às 00:00 UTC)
0 0 * * * curl -X POST https://seu-dominio.com/api/subscriptions/expire -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Apuração de medalhas (1º dia do mês às 00:01 UTC)
1 0 1 * * curl -X POST https://seu-dominio.com/api/medals/settle -H "Authorization: Bearer SEU_TOKEN_AQUI" -H "Content-Type: application/json"
```

#### Opção 2: Vercel Cron Jobs

No arquivo `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/prices/update",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/subscriptions/expire",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/medals/settle",
      "schedule": "1 0 1 * *"
    }
  ]
}
```

E configure o header de autenticação nas configurações do Vercel ou use um middleware.

#### Opção 3: Serviços Externos

- **EasyCron**: https://www.easycron.com/
- **Cron-Job.org**: https://cron-job.org/
- **GitHub Actions**: Use workflows do GitHub

**Para serviços que usam interface web** (apuração de medalhas):
- URL: `https://seu-dominio.com/api/medals/settle`
- Método: POST
- Headers:
  - `Authorization: Bearer SEU_TOKEN_AQUI`
  - `Content-Type: application/json`
- Schedule: `1 0 1 * *` (ou equivalente: "1st day of month at 00:01 UTC")

### 3. Exemplo de Requisição

**Atualização de Preços**:
```bash
curl -X POST https://seu-dominio.com/api/prices/update \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Apuração de Medalhas**:
```bash
curl -X POST https://seu-dominio.com/api/medals/settle \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

### 4. Resposta Esperada

**Atualização de Preços**:
```json
{
  "success": true,
  "tickersUpdated": 150,
  "pricesLastUpdate": "2024-01-15T14:30:00Z",
  "rankingCalculated": true,
  "rankingLastUpdate": "2024-01-15T14:30:15Z",
  "usersRanked": 25,
  "monthlyRankingCount": 25,
  "annualRankingCount": 25,
  "durationMs": 1523
}
```

**Apuração de Medalhas**:
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

**Exemplo com apuração anual (Janeiro)**:
```json
{
  "success": true,
  "periodsSettled": 2,
  "medalsCreated": 6,
  "monthlySettled": {
    "year": 2025,
    "month": 12
  },
  "annualSettled": {
    "year": 2025
  },
  "catchUpProcessed": 0,
  "durationMs": 2345
}
```

## Segurança

- Todos os endpoints são protegidos por token Bearer
- Rate limiting:
  - `/api/prices/update`: máximo 1 request por minuto
  - `/api/subscriptions/expire`: máximo 1 request por hora
  - `/api/medals/settle`: máximo 1 execução por hora
- Token deve ser mantido em segredo
- Use HTTPS em produção

## Monitoramento

Recomenda-se monitorar:
- Tempo de execução (`durationMs`)
- Número de tickers atualizados
- Erros retornados no array `errors` (se houver)

## Troubleshooting

### Erro 401 (Não Autorizado)
- Verifique se o token está correto
- Confirme que o header `Authorization: Bearer TOKEN` está sendo enviado

### Erro 429 (Muitas Requisições)
- Aguarde 1 minuto entre requisições
- Verifique se não há múltiplos crons configurados

### Erro 500 (Erro Interno)
- Verifique os logs do servidor
- Confirme que o Yahoo Finance está acessível
- Verifique se há tickers inválidos no sistema

