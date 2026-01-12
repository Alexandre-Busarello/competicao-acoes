# Banner de Conversão no Ranking e CTA na Página de Login

## Data: 08/01/2026

## Objetivo

Implementar estratégias de conversão para usuários não logados:
1. Banner discreto na página de ranking quando há competidores mas o usuário não está logado
2. CTA de checkout na página de login para direcionar novos usuários ao fluxo de compra

## Problema Identificado

Usuários não autenticados visualizavam o ranking mas não tinham um call-to-action claro para participar da competição. A página de login também não oferecia uma alternativa para novos usuários que ainda não tinham conta.

## Solução Implementada

### 1. Banner de Conversão Discreto (`src/components/ranking/ConversionBanner.tsx`)

**Características**:
- Banner discreto que não tira o foco do ranking
- Design sutil com gradiente azul/roxo
- Mensagem clara: "Comece a pontuar agora e participe da comunidade e prêmios"
- Dois botões de ação:
  - **Participar**: Abre modal de checkout (fluxo completo)
  - **Entrar**: Redireciona para página de login

**Visual**:
- Fundo com gradiente suave (`from-blue-50 to-purple-50`)
- Ícone de troféu dourado para chamar atenção
- Layout responsivo (coluna no mobile, linha no desktop)
- Bordas arredondadas e sombra sutil

**Comportamento**:
- Só aparece quando há competidores no ranking (`hasCompetitors === true`)
- Só aparece para usuários não autenticados (`!isAuthenticated`)
- Posicionado logo após o `RankingHeader`, antes do disclaimer de atualização

### 2. Integração na Página de Ranking (`src/app/(main)/ranking/page.tsx`)

**Mudanças**:
- Adicionado import do componente `ConversionBanner`
- Adicionado import do hook `useAuth` para verificar autenticação
- Banner renderizado condicionalmente:
  ```typescript
  {hasCompetitors && !isAuthenticated && <ConversionBanner />}
  ```

**Posicionamento**:
- Aparece logo após o header do ranking
- Antes do disclaimer de atualização
- Antes do `UserRankCard` (que só aparece para usuários logados)

### 3. CTA na Página de Login (`src/app/auth/login/page.tsx`)

**Características**:
- Seção adicional abaixo do formulário de login
- Só aparece quando o formulário não está em estado de sucesso
- Design destacado mas não intrusivo
- Mensagem focada em benefícios: "Comece a pontuar agora"

**Visual**:
- Card com gradiente azul/roxo
- Ícone de troféu dourado
- Ícone de sparkles para chamar atenção
- Botão de checkout em destaque

**Comportamento**:
- Usa o componente `CheckoutCTA` com source `login_page`
- Abre modal de captura de lead seguido de redirecionamento para checkout Kiwify
- Não interfere no fluxo de login existente

## Fluxo de Conversão

### Banner no Ranking

1. Usuário não logado acessa `/ranking`
2. Vê o ranking com competidores
3. Visualiza banner discreto no topo
4. Clica em "Participar" ou "Entrar"
5. Se clicar em "Participar":
   - Abre modal `LeadCaptureModal`
   - Preenche email (e nome opcional)
   - Sistema salva lead via `/api/leads`
   - Redireciona para checkout Kiwify com parâmetros

### CTA na Página de Login

1. Usuário acessa `/auth/login`
2. Vê formulário de login
3. Visualiza seção de CTA abaixo do formulário
4. Clica em "Criar conta e participar"
5. Abre modal `LeadCaptureModal`
6. Preenche email (e nome opcional)
7. Sistema salva lead via `/api/leads`
8. Redireciona para checkout Kiwify com parâmetros

## Componentes Utilizados

### `CheckoutCTA`
- Componente reutilizável para CTAs de checkout
- Abre `LeadCaptureModal` ao clicar
- Aceita props para customização (source, buttonText, variant, size)

### `LeadCaptureModal`
- Modal de captura de lead
- Valida email antes de submeter
- Salva lead no banco via API
- Redireciona para checkout Kiwify após sucesso

### `redirectToKiwifyCheckout`
- Função utilitária em `src/lib/utils/checkout.ts`
- Adiciona parâmetros de query (email, source)
- Redireciona para URL do produto Kiwify

## Tracking e Analytics

Cada CTA usa um `source` diferente para tracking:
- `ranking_banner`: Banner no ranking
- `login_page`: CTA na página de login

Isso permite identificar a origem das conversões e otimizar campanhas.

## Arquivos Modificados

1. **Criado**: `src/components/ranking/ConversionBanner.tsx`
   - Componente do banner de conversão

2. **Modificado**: `src/app/(main)/ranking/page.tsx`
   - Adicionado import de `ConversionBanner` e `useAuth`
   - Adicionada renderização condicional do banner

3. **Modificado**: `src/app/auth/login/page.tsx`
   - Adicionado import de `CheckoutCTA` e ícones
   - Adicionada seção de CTA abaixo do formulário

## Design e UX

### Princípios Aplicados

1. **Discretidade**: Banner não compete visualmente com o ranking
2. **Clareza**: Mensagem direta sobre benefícios
3. **Acessibilidade**: Dois caminhos (checkout ou login)
4. **Responsividade**: Layout adapta-se a diferentes tamanhos de tela
5. **Consistência**: Usa componentes e estilos já existentes no sistema

### Cores e Estilos

- **Gradiente**: Azul para roxo (`from-blue-50 to-purple-50`)
- **Ícone**: Troféu dourado (`from-yellow-400 to-orange-500`)
- **Bordas**: Azul claro (`border-blue-200`)
- **Texto**: Hierarquia clara com tamanhos diferentes

## Próximos Passos (Opcional)

1. **A/B Testing**: Testar diferentes textos e posicionamentos
2. **Analytics**: Implementar tracking de cliques e conversões
3. **Personalização**: Mostrar mensagens diferentes baseadas no número de competidores
4. **Otimização**: Ajustar timing de exibição (ex: após X segundos na página)

## Notas Técnicas

- O banner usa `useAuth` para verificar autenticação, garantindo que só apareça para usuários não logados
- O componente `CheckoutCTA` gerencia o estado do modal internamente
- O fluxo de checkout é o mesmo usado em outras partes da aplicação (perfil, ações protegidas)
- O source tracking permite identificar origem das conversões para análise posterior






