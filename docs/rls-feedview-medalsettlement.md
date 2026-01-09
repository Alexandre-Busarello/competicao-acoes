# RLS para FeedView e MedalSettlement

## Data: 09/01/2026

## Mudanças Realizadas

### Adição de RLS nas Tabelas FeedView e MedalSettlement

Foram criadas políticas de Row Level Security (RLS) para garantir segurança nas tabelas `FeedView` e `MedalSettlement`:

#### FeedView
- **Leitura**: Privada (apenas service role)
- **Escrita**: Privada (apenas service role)
- **Atualização**: Privada (apenas service role)
- **Exclusão**: Privada (apenas service role)

**Justificativa**: A tabela `FeedView` armazena informações sobre visualizações de posts no feed. Esses dados são internos do sistema e não devem ser acessíveis via API pública, apenas pelo backend para rastreamento e análise.

#### MedalSettlement
- **Leitura**: Privada (apenas service role)
- **Escrita**: Privada (apenas service role)
- **Atualização**: Privada (apenas service role)
- **Exclusão**: Privada (apenas service role)

**Justificativa**: A tabela `MedalSettlement` armazena informações sobre quando as medalhas foram processadas/apuradas para cada período. Esses dados são internos do sistema de processamento de medalhas e não devem ser acessíveis via API pública.

## Como Aplicar

### Aplicar RLS (Obrigatório)

Execute o script SQL diretamente no Supabase SQL Editor:

1. Acesse **Supabase Dashboard** > **SQL Editor**
2. Abra o arquivo `prisma/rls-feedview-medalsettlement.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run** ou pressione `Ctrl+Enter`

**Arquivo**: `prisma/rls-feedview-medalsettlement.sql`

## Arquivos Criados

1. `prisma/rls-feedview-medalsettlement.sql` - **NOVO** - Script SQL para aplicar RLS nas tabelas FeedView e MedalSettlement

## Verificação

Após aplicar o RLS, verifique no Supabase Dashboard:

1. Vá em **Table Editor**
2. Selecione `FeedView` ou `MedalSettlement`
3. Você deve ver um badge **"RLS ENABLED"** ou **"RESTRICTED"** (não mais "UNRESTRICTED")

## Testando as Políticas

### Teste 1: FeedView (Privado)

```javascript
// Deve retornar erro ou array vazio (sem autenticação)
const { data } = await supabase.from('FeedView').select('*');
// Retorna array vazio ou erro
```

### Teste 2: MedalSettlement (Privado)

```javascript
// Deve retornar erro ou array vazio (sem autenticação)
const { data } = await supabase.from('MedalSettlement').select('*');
// Retorna array vazio ou erro
```

### Teste 3: Escrita (Ambas Privadas)

```javascript
// Deve falhar mesmo com autenticação
const { error } = await supabase
  .from('FeedView')
  .insert({ userId: '...', postId: '...' });
// Retorna erro - apenas service role pode inserir
```

## Importante

- **Backend (Prisma com service role)**: Bypassa RLS automaticamente e pode acessar/modificar todas as tabelas
- **Frontend (Supabase Client)**: RLS é aplicado, usuários não podem acessar essas tabelas via API pública
- **FeedView**: Completamente privada, apenas backend pode acessar
- **MedalSettlement**: Completamente privada, apenas backend pode acessar

## Estrutura das Tabelas

### FeedView
```prisma
model FeedView {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  viewedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      FeedPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId, viewedAt(sort: Desc)])
  @@index([postId])
}
```

### MedalSettlement
```prisma
model MedalSettlement {
  id          String   @id @default(uuid())
  period      String   // 'mensal' | 'anual'
  year        Int
  month       Int?     // null para anual
  settledAt   DateTime @default(now()) // Timestamp UTC do banco
  
  @@unique([period, year, month])
  @@index([period, year, month])
  @@index([settledAt])
}
```

## Próximos Passos

1. ✅ Executar script `rls-feedview-medalsettlement.sql` no Supabase SQL Editor
2. ✅ Verificar que RLS está ativo nas tabelas
3. ✅ Testar políticas de acesso
4. ✅ Confirmar que o backend continua funcionando normalmente (Prisma bypassa RLS)

## Notas Técnicas

### Como o RLS Funciona

- **Políticas com `USING (false)`**: Bloqueiam completamente o acesso via API pública
- **Políticas com `WITH CHECK (false)`**: Bloqueiam inserções via API pública
- **Service Role**: Quando o Prisma usa a `DIRECT_DATABASE_URL` (service role), ele bypassa todas as políticas RLS
- **Anon/Authenticated Role**: Quando o Supabase Client usa as chaves públicas, as políticas RLS são aplicadas

### Segurança

As políticas criadas garantem que:
- Nenhum usuário autenticado ou anônimo pode ler dados dessas tabelas via Supabase Client
- Nenhum usuário autenticado ou anônimo pode escrever dados nessas tabelas via Supabase Client
- Apenas o backend (usando service role) pode acessar essas tabelas
- Isso protege dados sensíveis de visualizações e processamento de medalhas

