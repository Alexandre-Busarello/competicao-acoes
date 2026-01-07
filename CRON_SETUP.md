# Configuração do Cron Job

## Endpoint de Atualização

O endpoint `/api/prices/update` é protegido por token e deve ser chamado periodicamente para atualizar preços e recalcular o ranking.

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

Adicione a linha (atualiza a cada 15 minutos):
```cron
*/15 * * * * curl -X POST https://seu-dominio.com/api/prices/update -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Opção 2: Vercel Cron Jobs

No arquivo `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/prices/update",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

E configure o header de autenticação nas configurações do Vercel ou use um middleware.

#### Opção 3: Serviços Externos

- **EasyCron**: https://www.easycron.com/
- **Cron-Job.org**: https://cron-job.org/
- **GitHub Actions**: Use workflows do GitHub

### 3. Exemplo de Requisição

```bash
curl -X POST https://seu-dominio.com/api/prices/update \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

### 4. Resposta Esperada

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

## Segurança

- O endpoint é protegido por token Bearer
- Rate limiting: máximo 1 request por minuto
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

