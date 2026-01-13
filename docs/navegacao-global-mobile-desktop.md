# Navegação Global Mobile e Desktop

## Resumo da Implementação

Foi implementada uma navegação global que aparece em todas as telas da aplicação, tanto no mobile quanto no desktop. A navegação mobile aparece na parte inferior da tela (bottom navigation) e a navegação desktop aparece no header, integrada ao componente `UserHeader`.

## Componentes Criados/Modificados

### 1. GlobalNavigation (`src/components/navigation/GlobalNavigation.tsx`)

Componente que gerencia a exibição da navegação global. Ele verifica se a rota atual deve exibir a navegação ou não.

**Funcionalidades:**
- Verifica se a rota atual está na lista de rotas onde a navegação deve ser ocultada
- Renderiza `UserHeader` e `BottomNav` quando apropriado
- Exporta hook `useShouldShowNavigation` para uso em outros componentes

**Rotas onde a navegação é ocultada:**
- `/auth/*` - Páginas de autenticação
- `/checkout/*` - Páginas de checkout

### 2. NavigationWrapper (`src/components/navigation/NavigationWrapper.tsx`)

Componente wrapper que gerencia a navegação e aplica padding condicionalmente no conteúdo principal.

**Funcionalidades:**
- Renderiza `GlobalNavigation`
- Aplica padding-bottom (`pb-16`) no mobile quando a navegação está visível
- Remove padding no desktop (`md:pb-0`)

### 3. UserHeader (`src/components/navigation/UserHeader.tsx`)

Componente atualizado para incluir navegação desktop.

**Mudanças:**
- Adicionada navegação horizontal no desktop com links para:
  - Ranking (`/ranking`)
  - Carteira (`/minha-carteira`)
  - Perfil (`/perfil`)
- Navegação aparece apenas no desktop (`hidden md:flex`)
- Links destacam quando a rota atual corresponde ao item de navegação
- Mantém funcionalidade existente de exibição de avatar e informações do usuário

### 4. BottomNav (`src/components/navigation/BottomNav.tsx`)

Componente existente, mantido sem alterações significativas. Continua exibindo apenas no mobile (`md:hidden`).

### 5. Layout Raiz (`src/app/layout.tsx`)

Layout raiz atualizado para incluir a navegação global.

**Mudanças:**
- Importado `NavigationWrapper` em vez de componentes individuais
- `NavigationWrapper` gerencia tanto a navegação quanto o padding do conteúdo
- Mantidos componentes PWA (`ServiceWorkerRegistration`, `InstallPrompt`, `UpdatePrompt`)

### 6. Layout Main (`src/app/(main)/layout.tsx`)

Layout simplificado, removendo componentes de navegação que agora estão no layout raiz.

**Mudanças:**
- Removidos `BottomNav`, `UserHeader` e componentes PWA
- Mantido apenas wrapper com `max-w-4xl` para limitar largura do conteúdo

## Ajustes de Padding

### Padding Global

O padding-bottom é aplicado globalmente através do `NavigationWrapper`:
- Mobile: `pb-16` (64px) - espaço suficiente para o BottomNav
- Desktop: `md:pb-0` - sem padding adicional

### Páginas com Padding Específico

Algumas páginas mantiveram padding específico quando necessário:
- `bruno-method/page.tsx`: Mantém `pb-32` devido a conteúdo fixo na parte inferior (card de CTA)

### Páginas Ajustadas

As seguintes páginas tiveram padding removido, pois agora é aplicado globalmente:
- `carteira/[id]/mensal/[year]/[month]/page.tsx`: Removido `pb-32`
- `carteira/[id]/anual/[year]/page.tsx`: Removido `pb-32`
- `como-funciona/page.tsx`: Removido `pb-32`

## Estrutura de Navegação

### Mobile (Bottom Navigation)

A navegação mobile aparece fixa na parte inferior da tela:
- Altura: `h-16` (64px)
- Posição: `fixed bottom-0`
- Z-index: `z-50`
- Visível apenas no mobile: `md:hidden`

Itens de navegação:
1. **Ranking** - Ícone: Trophy
2. **Carteira** - Ícone: Wallet
3. **Perfil** - Ícone: User

### Desktop (Header Navigation)

A navegação desktop aparece no header, entre o logo e as informações do usuário:
- Visível apenas no desktop: `hidden md:flex`
- Layout horizontal com espaçamento entre itens
- Links destacados quando ativos (cor primária e fundo com opacidade)
- Hover effect em links inativos

## Comportamento de Rotas

### Rotas com Navegação

Todas as rotas exibem navegação por padrão, exceto:
- Rotas de autenticação (`/auth/*`)
- Rotas de checkout (`/checkout/*`)

### Detecção de Rota Ativa

A navegação detecta a rota ativa usando `usePathname()`:
- Compara `pathname` com `href` do item
- Considera sub-rotas usando `pathname?.startsWith(item.href + '/')`
- Aplica estilo ativo quando corresponde

## Considerações Técnicas

### Client Components

Todos os componentes de navegação são Client Components (`'use client'`) porque:
- Precisam acessar `usePathname()` do Next.js
- Precisam acessar estado de autenticação (`useAuth`)
- Precisam interagir com o usuário (cliques, navegação)

### Z-index Hierarchy

Ordem de z-index para evitar sobreposições:
- BottomNav: `z-50`
- UserHeader: `z-20`
- FABs (Floating Action Buttons): `z-40`
- PageHeader: `z-20`

### Safe Area (iOS)

O BottomNav usa `safe-area-bottom` para respeitar áreas seguras em dispositivos iOS com notch.

## Testes Recomendados

1. **Mobile:**
   - Verificar se BottomNav aparece em todas as telas (exceto auth/checkout)
   - Verificar se conteúdo não fica escondido atrás do BottomNav
   - Verificar se FABs estão posicionados acima do BottomNav
   - Testar em diferentes tamanhos de tela mobile

2. **Desktop:**
   - Verificar se navegação aparece no header
   - Verificar se links destacam corretamente quando ativos
   - Verificar se hover funciona corretamente
   - Testar em diferentes larguras de tela

3. **Rotas Especiais:**
   - Verificar se navegação não aparece em `/auth/login`
   - Verificar se navegação não aparece em `/checkout/*`
   - Verificar se navegação aparece normalmente em outras rotas

4. **Padding:**
   - Verificar se padding está aplicado corretamente no mobile
   - Verificar se não há padding duplicado
   - Verificar se conteúdo não fica muito espaçado no desktop

## Próximos Passos (Opcional)

1. Adicionar animações de transição entre rotas
2. Adicionar indicador de notificações nos itens de navegação
3. Considerar adicionar mais itens de navegação no futuro (se necessário)
4. Adicionar testes automatizados para navegação




