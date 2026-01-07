# Integração Supabase - Preparação

Este diretório contém a estrutura preparada para futura integração com Supabase.

## Arquivos

- `types.ts`: Tipos TypeScript baseados no schema do banco de dados
- `hooks.ts`: Hooks placeholder que serão substituídos por implementações reais
- `README.md`: Esta documentação

## Schema do Banco de Dados

### Tabelas Principais

1. **users**: Usuários do sistema
   - id, name, email, avatar_url, is_premium, created_at, updated_at

2. **transactions**: Transações dos usuários
   - id, user_id, ticker, type, quantity, price, date, created_at

3. **portfolios**: Portfólios dos usuários
   - id, user_id, total_value, monthly_return, annual_return, updated_at

4. **portfolio_assets**: Ativos dos portfólios
   - id, portfolio_id, ticker, name, type, quantity, average_price, current_price, return_percentage

5. **competitors**: Ranking de competidores
   - id, user_id, rank, monthly_return, annual_return, period

6. **bruno_portfolio**: Carteira oficial do Bruno
   - id, monthly_return, annual_return, description, updated_at

7. **bruno_portfolio_assets**: Ativos da carteira do Bruno
   - id, bruno_portfolio_id, ticker, name, type, quantity, average_price, current_price, return_percentage

## Próximos Passos para Integração

1. Instalar dependências:
   ```bash
   npm install @supabase/supabase-js @tanstack/react-query
   ```

2. Configurar variáveis de ambiente:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Criar cliente Supabase:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```

4. Substituir hooks placeholder por implementações reais usando React Query

5. Atualizar stores Zustand para sincronizar com Supabase

6. Implementar autenticação com Supabase Auth

7. Configurar Row Level Security (RLS) no Supabase

8. Implementar real-time subscriptions para atualizações em tempo real

