# Integração Yahoo Finance

## Uso

- Cotações e dados de mercado para execução de ordens e atualização de posições.
- Dependência: `yahoo-finance2` (ver `package.json`).

## Comportamento de produto (resumo)

- Preço na **execução** da transação obtido automaticamente (ver [CARTEIRA-TRANSACOES.md](../features/CARTEIRA-TRANSACOES.md) e UI “Como funciona”).
- Atualização periódica de preços para o ranking (ex.: a cada 15 minutos — alinhar com copy em `ComoFuncionaContent.tsx` e com jobs em `src/app/api/prices`, `cron`, serviços).

## Código

- Serviços em `src/lib/services/` relacionados a preços e dados financeiros (ex.: `financial-data-service`, ranking).

## Limitações

- Indisponibilidade ou mudanças na API/fonte Yahoo podem exigir tratamento de erro e fallbacks — documentar mudanças relevantes aqui.
