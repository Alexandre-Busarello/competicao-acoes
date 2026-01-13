# Scripts de Manutenção

Este diretório contém scripts utilitários para manutenção e atualização do sistema.

## Scripts Disponíveis

### update-transactions-currency.ts

Script para atualizar transações antigas que não têm o campo `currency` preenchido.

**O que faz:**
- Busca todas as transações sem `currency` no banco de dados
- Agrupa transações por ticker para otimizar (evita buscar o mesmo ticker múltiplas vezes)
- Para cada ticker único, busca a currency no Yahoo Finance
- Atualiza todas as transações desse ticker com a currency encontrada
- Se não encontrar currency, usa 'BRL' como padrão

**Uso:**
```bash
npm run update-currency
```

**Ou diretamente:**
```bash
npx tsx scripts/update-transactions-currency.ts
```

**Requisitos:**
- Variáveis de ambiente configuradas (`.env` com `DIRECT_DATABASE_URL`)
- Prisma Client gerado (`npx prisma generate`)
- Conexão com o banco de dados ativa
- Pacotes instalados: `tsx`, `dotenv`, `@prisma/client`, `yahoo-finance2`

**Comportamento:**
- O script processa transações em lotes por ticker para otimizar
- Inclui retry logic com backoff exponencial para lidar com rate limiting do Yahoo Finance
- Delay de 100ms entre requisições para evitar rate limiting
- Mostra progresso detalhado durante a execução
- Exibe resumo final com estatísticas

**Exemplo de saída:**
```
🚀 Iniciando atualização de currency nas transações...

📊 Encontradas 150 transações sem currency

📈 Encontrados 45 tickers únicos para processar

🔍 Processando PETR4.SA...
  ✅ Currency encontrada: BRL
  📝 25 transações atualizadas

🔍 Processando AAPL...
  ✅ Currency encontrada: USD
  📝 10 transações atualizadas

...

📊 Resumo da atualização:
  ✅ Atualizadas com currency do Yahoo: 140
  ⚠️  Atualizadas com BRL (padrão): 10
  ❌ Falhas: 0
  📈 Total processado: 150

✅ Atualização concluída!
```

## Scripts Python

Os scripts Python neste diretório são para processamento de imagens e geração de assets PWA:

- `generate-pwa-icons.py`: Gera ícones PWA
- `generate-splash-screens.py`: Gera splash screens para iOS
- `process-favicons.py`: Processa favicons
- `process-logo.py`: Processa logos
- `process-logos.py`: Processa múltiplos logos

Para usar os scripts Python, instale as dependências:
```bash
pip3 install -r requirements.txt
```


