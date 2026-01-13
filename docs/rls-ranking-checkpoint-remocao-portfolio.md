# RLS para Ranking/Checkpoint e Remoção de Tabelas Portfolio

## Data: 08/01/2026

## Mudanças Realizadas

### 1. Adição de RLS nas Tabelas RankingCalculation e PriceUpdateCheckpoint

Foram criadas políticas de Row Level Security (RLS) para garantir segurança nas novas tabelas:

#### RankingCalculation
- **Leitura**: Pública (todos podem ver rankings via API pública)
- **Escrita**: Apenas service role (backend com Prisma)
- **Atualização**: Apenas service role
- **Exclusão**: Apenas service role

**Justificativa**: Rankings são dados públicos que devem ser acessíveis a todos, mas apenas o backend pode criar/atualizar rankings calculados.

#### PriceUpdateCheckpoint
- **Leitura**: Privada (apenas service role)
- **Escrita**: Privada (apenas service role)
- **Atualização**: Privada (apenas service role)
- **Exclusão**: Privada (apenas service role)

**Justificativa**: Checkpoints são dados internos do sistema de processamento e não devem ser acessíveis via API pública.

### 2. Remoção das Tabelas Portfolio e PortfolioAsset

As tabelas `Portfolio` e `PortfolioAsset` foram removidas do schema pois não estavam mais em uso:

- **Portfolio**: Não havia referências diretas no código
- **PortfolioAsset**: Não havia referências diretas no código

**Nota**: As referências a "portfolio" no código são a:
- Funções de cálculo (`calculatePortfolio`)
- Propriedades de objetos de ranking (`portfolio` como propriedade calculada)
- Componentes de UI (`PortfolioHeader`, `PortfolioSummary`, etc.)

Nenhuma dessas referências depende das tabelas removidas.

## Como Aplicar

### 1. Aplicar RLS (Obrigatório)

Execute o script SQL diretamente no Supabase SQL Editor:

1. Acesse **Supabase Dashboard** > **SQL Editor**
2. Abra o arquivo `prisma/rls-ranking-checkpoint.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run** ou pressione `Ctrl+Enter`

**Arquivo**: `prisma/rls-ranking-checkpoint.sql`

### 2. Aplicar Migration de Remoção (Opcional)

Se as tabelas `Portfolio` e `PortfolioAsset` existirem no banco e você quiser removê-las:

```bash
npx prisma migrate dev
```

**Atenção**: Esta migration irá **deletar** as tabelas `Portfolio` e `PortfolioAsset` e todos os dados nelas. Certifique-se de que não há dados importantes antes de executar.

**Arquivo**: `prisma/migrations/20260108224910_remove_portfolio_tables/migration.sql`

## Arquivos Modificados

1. `prisma/schema.prisma` - Removidos models `Portfolio` e `PortfolioAsset`
2. `prisma/supabase-rls.sql` - Removidas políticas RLS das tabelas Portfolio
3. `prisma/rls-ranking-checkpoint.sql` - **NOVO** - Script SQL para aplicar RLS nas novas tabelas
4. `prisma/migrations/20260108224910_remove_portfolio_tables/` - **NOVO** - Migration para remover tabelas

## Verificação

Após aplicar o RLS, verifique no Supabase Dashboard:

1. Vá em **Table Editor**
2. Selecione `RankingCalculation` ou `PriceUpdateCheckpoint`
3. Você deve ver um badge **"RLS ENABLED"** ou **"RESTRICTED"** (não mais "UNRESTRICTED")

## Testando as Políticas

### Teste 1: RankingCalculation (Leitura Pública)

```javascript
// Deve funcionar mesmo sem autenticação
const { data } = await supabase.from('RankingCalculation').select('*');
// Retorna todos os rankings
```

### Teste 2: PriceUpdateCheckpoint (Privado)

```javascript
// Deve retornar erro ou array vazio (sem autenticação)
const { data } = await supabase.from('PriceUpdateCheckpoint').select('*');
// Retorna array vazio ou erro
```

### Teste 3: Escrita (Ambas Privadas)

```javascript
// Deve falhar mesmo com autenticação
const { error } = await supabase
  .from('RankingCalculation')
  .insert({ period: 'mensal', year: 2026, ... });
// Retorna erro - apenas service role pode inserir
```

## Importante

- **Backend (Prisma com service role)**: Bypassa RLS automaticamente e pode acessar/modificar todas as tabelas
- **Frontend (Supabase Client)**: RLS é aplicado, usuários só podem acessar o que as políticas permitem
- **RankingCalculation**: Pode ser lida publicamente, mas escrita apenas pelo backend
- **PriceUpdateCheckpoint**: Completamente privada, apenas backend pode acessar

## Próximos Passos

1. ✅ Executar script `rls-ranking-checkpoint.sql` no Supabase SQL Editor
2. ✅ (Opcional) Executar migration para remover tabelas Portfolio se necessário
3. ✅ Verificar que RLS está ativo nas tabelas
4. ✅ Testar políticas de acesso







