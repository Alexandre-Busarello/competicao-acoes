# Edição de Nome no Perfil

## Data
2025-01-XX

## Resumo
Implementação da funcionalidade que permite aos usuários editarem o nome do perfil diretamente na página de perfil, seguindo o mesmo padrão visual da edição de avatar.

## Funcionalidades Implementadas

### 1. Edição Inline do Nome

Na página de perfil (`/perfil`), o usuário pode:
- Ver o nome atual formatado com ID único (ex: "João Silva #A3F2")
- Clicar no botão de edição (ícone de lápis) que aparece ao passar o mouse sobre o nome
- Editar o nome em um campo de input inline
- Salvar as alterações clicando no botão de confirmação (✓) ou pressionando Enter
- Cancelar a edição clicando no botão de cancelar (✗) ou pressionando Escape

### 2. Validação e Feedback

O sistema valida:
- Nome não pode estar vazio
- Nome não pode ter mais de 100 caracteres
- Nome é automaticamente trimado (remove espaços no início e fim)

Durante a atualização:
- Botão de salvar mostra um spinner de loading
- Botões ficam desabilitados durante a atualização
- Mensagens de erro são exibidas em caso de falha

### 3. Atualização Automática

Após salvar o nome:
- Cache do usuário é invalidado para buscar dados atualizados
- Cache do ranking é invalidado para atualizar nomes em toda a aplicação
- Interface é atualizada automaticamente sem necessidade de recarregar a página

## Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/app/api/user/name/route.ts`**
   - Endpoint PATCH para atualizar o nome do usuário
   - Validação de autenticação, formato e tamanho do nome
   - Atualização no banco de dados via Prisma
   - Retorna o novo nome atualizado

### Arquivos Modificados

1. **`src/components/profile/ProfileInfo.tsx`**
   - Adicionado estado para controlar edição do nome (`isEditingName`)
   - Adicionado estado para armazenar nome sendo editado (`editedName`)
   - Adicionado estado para controlar loading durante atualização (`isUpdatingName`)
   - Implementada função `handleStartEditName()` para iniciar edição
   - Implementada função `handleCancelEditName()` para cancelar edição
   - Implementada função `handleSaveName()` para salvar alterações
   - Implementada função `handleKeyDown()` para suportar Enter/Escape
   - Adicionado botão de edição ao lado do nome (aparece no hover)
   - Adicionado input inline para edição do nome
   - Adicionados botões de confirmação e cancelamento durante edição
   - Integração com React Query para invalidar cache após atualização

## Detalhes Técnicos

### API Route

A rota `/api/user/name` implementa:
- Autenticação obrigatória via `requireAuth()`
- Validação de que o nome é uma string não vazia
- Validação de tamanho máximo (100 caracteres)
- Trim automático do nome antes de salvar
- Atualização apenas do campo `name` na tabela `User`
- Tratamento de erros com mensagens apropriadas

### Componente ProfileInfo

O componente implementa:
- Edição inline sem necessidade de modal
- Preservação do ID único no nome (removido durante edição, re-adicionado na exibição)
- Feedback visual durante atualização
- Suporte a teclado (Enter para salvar, Escape para cancelar)
- Integração com React Query para atualização de cache

### Formatação do Nome

O sistema mantém a formatação com ID único:
- Durante edição: mostra apenas o nome sem ID (usando `getNameWithoutId()`)
- Após salvar: exibe nome formatado com ID (usando `formatUserNameWithId()`)
- O ID é baseado nos últimos 4 caracteres do UUID do usuário

## Fluxo de Uso

1. Usuário acessa `/perfil`
2. Passa o mouse sobre o nome para ver o botão de edição
3. Clica no botão de edição (ícone de lápis)
4. Campo de input aparece no lugar do nome
5. Usuário edita o nome
6. Usuário pressiona Enter ou clica no botão de confirmação (✓)
7. Sistema valida e atualiza o nome no banco de dados
8. Cache é invalidado e interface é atualizada automaticamente
9. Nome é exibido formatado com ID único

## Considerações de UX

- Botão de edição aparece apenas no hover para manter interface limpa
- Input tem foco automático ao iniciar edição
- Suporte a teclado para melhor acessibilidade
- Feedback visual claro durante operações assíncronas
- Validação em tempo real com mensagens de erro apropriadas
- Cancelamento fácil sem perder dados originais

## Segurança

- Autenticação obrigatória para atualizar nome
- Validação de entrada no servidor
- Sanitização automática (trim)
- Limite de tamanho para prevenir abusos
- Atualização apenas do próprio usuário (via `session.user.id`)

