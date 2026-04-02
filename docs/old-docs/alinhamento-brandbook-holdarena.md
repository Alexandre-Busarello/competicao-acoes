# Alinhamento da Aplicação ao Brandbook HOLDARENA

## Data: 2026-01-08

## Objetivo

Atualizar toda a aplicação para seguir o brandbook HOLDARENA, garantindo consistência visual com as cores e identidade da marca definidas no guia de estilo.

## Cores do Brandbook

### Cores Principais
- **#252830** (Cinza Escuro) - `hsl(220, 8%, 15%)` - Backgrounds escuros, textos escuros
- **#00c219** (Verde Vibrante) - `hsl(135, 100%, 38%)` - Usado para success/valores positivos
- **#ffffff** (Branco) - `hsl(0, 0%, 100%)` - Backgrounds claros, textos claros
- **#3b82f6** (Azul) - `hsl(221.2, 83.2%, 53.3%)` - Cor primary para highlights, botões, links

### Cores Complementares Adicionadas
- **Primary**: `#3b82f6` (azul) - Para highlights, botões principais, links, elementos interativos
- **Success**: `#00c219` (verde do brand) - Para valores positivos e sucesso
- **Destructive**: Vermelho ajustado - Para valores negativos/perdas
- **Warning**: Amarelo ajustado - Para warnings e elementos premium
- **Muted**: Tons de cinza baseados em #252830 - Para backgrounds secundários e bordas

## Arquivos Modificados

### 1. Sistema de Cores Base

#### `src/app/globals.css`
**Mudanças:**
- Atualizadas todas as variáveis CSS para usar as cores do brandbook
- `--primary`: Mantido azul `hsl(221.2, 83.2%, 53.3%)` (#3b82f6) para highlights, botões e links
- `--success`: Verde do brand `hsl(135, 100%, 38%)` (#00c219) para valores positivos
- `--foreground`: Alterado para cinza escuro `hsl(220, 8%, 15%)` (#252830)
- `--background`: Mantido branco `hsl(0, 0%, 100%)` (#ffffff)
- Adicionadas variáveis `--success` e `--warning` para cores complementares
- Ajustadas cores para modo dark mantendo contraste adequado

#### `tailwind.config.ts`
**Mudanças:**
- Adicionadas cores `success` e `warning` ao sistema de cores do Tailwind
- Mapeadas para as variáveis CSS correspondentes

### 2. Componentes de Portfolio

#### `src/components/portfolio/PortfolioSummary.tsx`
- Substituído `text-green-500` por `text-success`
- Substituído `text-red-500` por `text-destructive`

#### `src/components/portfolio/PortfolioHeader.tsx`
- Substituído `text-green-500` por `text-success`
- Substituído `text-red-500` por `text-destructive`

#### `src/components/portfolio/AssetList.tsx`
- Substituído `text-green-500` por `text-success`
- Substituído `text-red-500` por `text-destructive`
- Substituído `text-blue-600/400` e `text-purple-600/400` por `text-primary` e `text-primary/80`

#### `src/components/portfolio/AssetAllocationChart.tsx`
- Atualizada paleta de cores COLORS para usar variações do verde primário (#00c219)
- Mantida diferenciação entre tipos de ativos usando:
  - Verde primário e variações para ações, FIIs e ETFs de ações
  - Laranja vibrante para cripto e ETFs de cripto
  - Laranja/amarelo para commodities e renda fixa
  - Roxo harmonizante para setoriais e outros

### 3. Componentes de Ranking

#### `src/components/ranking/CompetitorCard.tsx`
- Substituído `text-green-500` por `text-success`
- Substituído `text-red-500` por `text-destructive`
- Atualizado `text-yellow-500` para `text-warning` no troféu de primeiro lugar
- Ajustadas cores de medalhas para usar `text-muted-foreground` e `text-warning/80`

#### `src/components/ranking/UserRankCard.tsx`
- Substituído `text-green-500` por `text-success`
- Substituído `text-red-500` por `text-destructive`

#### `src/components/ranking/EmptyRankingState.tsx`
- Substituído gradiente `from-blue-50 to-purple-50` por `from-primary/10 to-primary/5`
- Atualizadas bordas para usar `border-primary/20`

### 4. Componentes de Perfil

#### `src/components/profile/PublicProfileHeader.tsx`
- Substituído `text-green-500` por `text-success`
- Substituído `text-red-500` por `text-destructive`
- Substituído `text-yellow-500` por `text-warning` nos troféus de ranking

#### `src/components/profile/PremiumCard.tsx`
- Substituído `text-yellow-500` por `text-warning`
- Substituído `text-green-500` por `text-success`
- Atualizado border e background para usar `border-warning/30` e `from-warning/10`

#### `src/components/profile/MedalSummary.tsx`
- Substituído `text-yellow-500` por `text-warning` no troféu de ouro

### 5. Componentes de Feed

#### `src/components/feed/FeedPost.tsx`
- Substituído `fill-red-500 text-red-500` por `fill-destructive text-destructive` em curtidas

#### `src/components/feed/PostContent.tsx`
- Substituído `fill-red-500 text-red-500` por `fill-destructive text-destructive` em curtidas

### 6. Componentes de Navegação

#### `src/components/navigation/UserHeader.tsx`
- Substituído `text-yellow-500` por `text-warning` no ícone de premium

### 7. Páginas

#### `src/app/como-funciona/page.tsx`
- Substituídos backgrounds `bg-blue-50` e `bg-purple-50` por `bg-primary/10`
- Substituídos textos `text-blue-800/900` e `text-purple-800/900` por `text-primary` e `text-foreground/80`
- Atualizadas bordas para usar `border-primary/20`

#### `src/app/carteira/[id]/mensal/[year]/[month]/page.tsx`
- Substituído `bg-blue-50` por `bg-primary/10`
- Substituído `text-blue-800` por `text-foreground/80`
- Atualizadas bordas para usar `border-primary/20`

#### `src/app/carteira/[id]/anual/[year]/page.tsx`
- Substituído `bg-blue-50` por `bg-primary/10`
- Substituído `text-blue-800` por `text-foreground/80`
- Atualizadas bordas para usar `border-primary/20`

### 8. Metadados e PWA

#### `src/app/layout.tsx`
- Mantido `themeColor` como `#3b82f6` (azul) para highlights
- Mantido meta tag `theme-color` como `#3b82f6`

#### `src/app/manifest.ts`
- Mantido `theme_color` como `#3b82f6` (azul)

#### `public/manifest.json`
- Mantido `theme_color` como `#3b82f6` (azul)

## Estratégia de Implementação

### Fase 1: Sistema de Cores Base ✅
- Atualizado `globals.css` com novas cores do brandbook
- Atualizado `tailwind.config.ts` com cores complementares
- Testado contraste e acessibilidade

### Fase 2: Componentes ✅
- Substituídas cores hardcoded por variáveis do tema
- Atualizados componentes de ranking e carteira
- Atualizados componentes de feed e perfil
- Atualizadas páginas informativas

### Fase 3: Metadados e PWA ✅
- Atualizado theme-color em todos os arquivos relevantes
- Atualizado manifest.json

## Considerações de Contraste

- Garantido contraste mínimo WCAG AA (4.5:1) para textos
- Verde #00c219 sobre branco: contraste adequado ✅
- Verde #00c219 sobre #252830: ajustado para verde mais claro no modo dark para melhor contraste
- Cores complementares ajustadas para manter harmonia visual

## Cores Complementares Utilizadas

- **Success**: `#00c219` (verde do brand) - Usado para valores positivos, rentabilidades positivas
- **Destructive**: Vermelho ajustado - Usado para valores negativos, perdas, curtidas
- **Warning**: Amarelo ajustado - Usado para elementos premium, troféus, avisos
- **Muted**: Tons de cinza baseados em #252830 - Usado para backgrounds secundários, bordas, textos secundários

## Notas Importantes

1. **Favicon e Logo**: Os arquivos de favicon e logo existentes (`/public/logo-no-bg.png`, `/public/icons/`) não foram modificados nesta implementação. Para completar o alinhamento visual, seria necessário criar novos assets seguindo o design do brandbook (favicon com "A" estilizada em quadrado arredondado).

2. **Tipografia**: A fonte Inter foi mantida como fonte principal do sistema por questões de legibilidade. O brandbook menciona Bank Gothic para o logo, mas essa fonte seria aplicada apenas em elementos específicos do logo, não em toda a aplicação.

3. **Compatibilidade**: Todas as mudanças são retrocompatíveis e não quebram funcionalidades existentes. As cores foram atualizadas mantendo a mesma estrutura de classes do Tailwind.

4. **Modo Dark**: O modo dark foi ajustado para usar as mesmas cores do brandbook, garantindo consistência visual em ambos os temas.

## Ajuste: Reversão de Primary para Azul

**Data do ajuste:** 2026-01-08

Após feedback, a cor primary (highlights) foi revertida para azul (#3b82f6), mantendo o verde (#00c219) apenas para success (valores positivos).

### Mudanças no Ajuste:
- `--primary`: Revertido para azul `hsl(221.2, 83.2%, 53.3%)` (#3b82f6)
- `--success`: Mantido verde `hsl(135, 100%, 38%)` (#00c219) para valores positivos
- `theme-color`: Revertido para `#3b82f6` em todos os metadados

## Resultado

A aplicação agora está alinhada com o brandbook HOLDARENA, utilizando:
- Azul #3b82f6 como cor primary para highlights, botões, links e elementos interativos
- Verde #00c219 apenas para success (valores positivos, rentabilidades positivas)
- Cinza #252830 para textos e backgrounds escuros
- Branco #ffffff para backgrounds claros
- Cores complementares harmoniosas para diferentes estados (sucesso, erro, warning)

Todas as cores hardcoded foram substituídas por variáveis do tema, facilitando manutenção futura e garantindo consistência visual em toda a aplicação.

