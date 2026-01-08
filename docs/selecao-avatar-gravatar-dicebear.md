# Seleção de Avatar - Gravatar e DiceBear

## Visão Geral

Esta implementação permite que os usuários escolham e personalizem seu avatar na aplicação. O sistema suporta duas opções:
1. **Gravatar**: Usuários podem configurar sua foto no Gravatar usando seu email
2. **DiceBear**: Usuários podem escolher entre diversos estilos de avatares gerados automaticamente

## Funcionalidades Implementadas

### 1. Exibição Consistente do Avatar

O avatar do usuário é exibido consistentemente em toda a aplicação:
- **Header de navegação** (`UserHeader.tsx`): Mostra o avatar do usuário logado
- **Página de perfil** (`ProfileInfo.tsx`): Exibe o avatar com opção de edição
- **Ranking**: Avatares dos competidores são exibidos nos cards
- **Portfólio**: Avatar do dono do portfólio é exibido no header

### 2. Seleção de Avatar

Na página de perfil (`/perfil`), o usuário pode:
- Ver seu avatar atual (mesmo do header)
- Clicar no botão de edição (ícone de lápis) que aparece ao passar o mouse sobre o avatar
- Escolher entre:
  - **Configurar Gravatar**: Link direto para o Gravatar com o email pré-preenchido
  - **Escolher avatar DiceBear**: Grid com múltiplos estilos e opções pré-definidas

### 3. API de Atualização

Foi criada uma API route (`/api/user/avatar`) que:
- Valida que o usuário está autenticado
- Valida que a URL do avatar é válida (Gravatar ou DiceBear)
- Atualiza o `avatarUrl` no banco de dados
- Retorna o novo avatarUrl atualizado

## Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/app/api/user/avatar/route.ts`**
   - Endpoint PATCH para atualizar o avatarUrl do usuário
   - Validação de autenticação e URL
   - Atualização no banco de dados via Prisma

2. **`src/components/profile/AvatarSelector.tsx`**
   - Componente modal para seleção de avatar
   - Grid de avatares DiceBear com múltiplos estilos
   - Link para configuração do Gravatar
   - Integração com API para atualização
   - Invalidação automática de cache após atualização

### Arquivos Modificados

1. **`src/components/profile/ProfileInfo.tsx`**
   - Corrigido: Agora usa `user.avatarUrl` ao invés de `user.avatar`
   - Adicionado botão de edição do avatar (aparece no hover)
   - Integrado componente `AvatarSelector`

## Estrutura de Dados

### Banco de Dados
- Campo `avatarUrl` (String, opcional) na tabela `User`
- Armazena URL completa do avatar (Gravatar ou DiceBear)

### Tipos TypeScript
- `AuthUser.avatarUrl`: URL do avatar do usuário autenticado
- `Competitor.avatar`: URL do avatar do competidor (mapeado de `avatarUrl`)

## Estilos DiceBear Disponíveis

O componente `AvatarSelector` oferece os seguintes estilos do DiceBear:
- avataaars
- adventurer
- adventurer-neutral
- big-ears
- big-ears-neutral
- big-smile
- bottts
- croodles
- croodles-neutral
- fun-emoji
- icons
- identicon
- lorelei
- lorelei-neutral
- micah
- miniavs
- notionists
- open-peeps
- personas
- pixel-art
- shapes
- thumbs

Cada estilo possui 24 seeds pré-definidos para gerar avatares únicos.

## Fluxo de Uso

1. **Usuário acessa `/perfil`**
2. **Visualiza seu avatar atual** (mesmo do header)
3. **Passa o mouse sobre o avatar** → Botão de edição aparece
4. **Clica no botão de edição** → Modal `AvatarSelector` abre
5. **Escolhe uma opção**:
   - **Gravatar**: Clica em "Configurar Gravatar" → Abre site do Gravatar em nova aba
   - **DiceBear**: Seleciona estilo → Escolhe avatar do grid → Avatar é atualizado automaticamente
6. **Avatar é atualizado** → Processo automático:
   - `avatarUrl` é atualizado no banco de dados (tabela `User`)
   - Cache do React Query do usuário é invalidado
   - Cache do React Query do ranking é invalidado
   - Na próxima busca do ranking, avatares são buscados atualizados da tabela `User`
7. **Avatar aparece atualizado** em toda aplicação (header, perfil, ranking)

## Validação e Segurança

### Validações Implementadas

1. **Autenticação**: Apenas usuários autenticados podem atualizar avatar
2. **Validação de URL**: Apenas URLs do Gravatar ou DiceBear são aceitas
3. **Validação de tipo**: `avatarUrl` deve ser uma string válida

### Formato de URLs Aceitas

- Gravatar: `https://www.gravatar.com/avatar/{hash}?d=404&s=200`
- DiceBear: `https://api.dicebear.com/7.x/{style}/svg?seed={seed}`

## Integração com Gravatar

Quando o usuário configura seu Gravatar:
1. Acessa o link fornecido (com email pré-preenchido)
2. Faz upload da imagem no Gravatar
3. O avatar é automaticamente atualizado na aplicação (via hash MD5 do email)
4. Não é necessário atualizar manualmente na aplicação

**Nota**: O sistema sempre verifica o Gravatar primeiro. Se não houver imagem configurada, usa fallback para DiceBear.

## Consistência em Toda Aplicação

O avatar é consistente porque:
1. **Fonte única de verdade**: Banco de dados (`User.avatarUrl`)
2. **Avatar não é salvo no ranking**: O ranking é salvo sem o campo `avatar` no JSON. Ao listar o ranking, os avatares são sempre buscados da tabela `User`, garantindo que sempre estejam atualizados.
3. **Enriquecimento dinâmico**: O método `getRanking()` busca os avatares atualizados da tabela `User` e enriquece o ranking antes de retornar.
4. **Cache invalidation**: Quando atualizado:
   - React Query invalida cache do usuário (`['auth', 'user']`)
   - React Query invalida cache do ranking (`['ranking']`)
   - Na próxima busca, avatares são buscados atualizados da tabela User
5. **Mapeamento consistente**: `ranking-service.ts` enriquece `avatar` da tabela User ao retornar
6. **Componentes unificados**: Todos usam o mesmo componente `Avatar` do shadcn/ui

## Melhorias Futuras Possíveis

1. Upload de imagem customizada (além de Gravatar e DiceBear)
2. Preview do avatar antes de confirmar
3. Histórico de avatares escolhidos
4. Geração de avatar baseado em características do usuário
5. Animações ao trocar avatar

## Instruções para IA

Ao trabalhar com avatares nesta aplicação:

**Você DEVE**:
- Sempre usar `user.avatarUrl` ao acessar o avatar do usuário autenticado
- Usar `competitor.avatar` ao trabalhar com dados do ranking (enriquecido da tabela User)
- Validar URLs de avatar antes de salvar no banco
- Invalidar cache do React Query após atualizar avatar
- Manter consistência entre Gravatar e DiceBear
- **NÃO salvar avatar no JSON do ranking** - sempre buscar da tabela User ao listar

**Você NÃO DEVE**:
- Usar `user.avatar` (campo não existe, use `avatarUrl`)
- Salvar avatar no JSON do ranking (sempre buscar da tabela User)
- Aceitar URLs de avatar de domínios não autorizados
- Esquecer de invalidar o cache após atualização
- Criar novos campos de avatar sem atualizar o schema do Prisma
- Modificar a estrutura de dados do ranking sem enriquecer com avatares da tabela User

