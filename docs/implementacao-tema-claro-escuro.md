# Implementação de Tema Claro/Escuro Global

## Data: 08/01/2026

## Objetivo

Implementar um sistema global de tema claro/escuro com toggle no header, atualizando automaticamente:
- Favicons baseados no tema
- Logos no header baseados no tema
- Configuração PWA para suportar ambos os temas

## Arquivos Criados

### 1. ThemeProvider (`src/lib/providers/ThemeProvider.tsx`)

**Funcionalidades**:
- Gerenciamento de estado do tema (light/dark)
- Persistência da preferência no `localStorage`
- Detecção automática da preferência do sistema operacional
- Aplicação da classe `dark` no elemento `<html>`
- Atualização dinâmica do favicon baseado no tema
- Atualização da meta tag `theme-color` baseada no tema
- Hook `useTheme()` para acesso ao tema em componentes

**Características**:
- Evita flash de conteúdo não estilizado (FOUC) usando estado `mounted`
- Atualiza favicon e apple-touch-icon dinamicamente
- Atualiza `theme-color` meta tag para melhor integração com navegadores

### 2. ThemeToggle (`src/components/ui/theme-toggle.tsx`)

**Funcionalidades**:
- Componente de botão para alternar entre temas
- Ícone dinâmico (Sol para tema claro, Lua para tema escuro)
- Acessibilidade com `aria-label` descritivo
- Integração com sistema de design existente (Button component)

## Arquivos Modificados

### 1. Layout Raiz (`src/app/layout.tsx`)

**Mudanças**:
- Adicionado `ThemeProvider` envolvendo toda a aplicação
- Favicon inicial configurado para `/favicon-claro.png` (será atualizado dinamicamente pelo ThemeProvider)

**Código adicionado**:
```typescript
import { ThemeProvider } from "@/lib/providers/ThemeProvider";

// No body:
<ThemeProvider>
  <QueryProvider>
    {/* ... resto da aplicação */}
  </QueryProvider>
</ThemeProvider>
```

### 2. UserHeader (`src/components/navigation/UserHeader.tsx`)

**Mudanças**:
- Adicionado import do `ThemeToggle` e `useTheme`
- Logo dinâmico com texto baseado no tema:
  - Tema claro: `/holdareana-logo-texto-claro.png`
  - Tema escuro: `/holdareana-logo-texto-escuro.png`
- Toggle de tema adicionado em todos os estados do header:
  - Estado de loading
  - Estado não autenticado
  - Estado autenticado

**Código adicionado**:
```typescript
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/lib/providers/ThemeProvider';

// Dentro do componente:
const { theme } = useTheme();
const logoPath = theme === 'dark' 
  ? '/holdareana-logo-texto-escuro.png' 
  : '/holdareana-logo-texto-claro.png';

// No JSX:
<ThemeToggle />
<Image src={logoPath} ... />
```

## Funcionamento

### Inicialização

1. Ao carregar a aplicação, o `ThemeProvider` verifica:
   - Preferência salva no `localStorage` (chave: `theme`)
   - Se não houver preferência salva, detecta a preferência do sistema operacional
   - Aplica o tema detectado

2. Aplicação do tema:
   - Adiciona/remove classe `dark` no elemento `<html>`
   - Atualiza favicon para versão correspondente
   - Atualiza meta tag `theme-color`

### Alternância de Tema

1. Usuário clica no toggle no header
2. `ThemeProvider` atualiza o estado
3. Salva preferência no `localStorage`
4. Aplica mudanças:
   - Classe `dark` no `<html>`
   - Novo favicon
   - Novo logo no header
   - Nova `theme-color`

### Persistência

- Preferência salva em `localStorage` com chave `theme`
- Valores possíveis: `'light'` ou `'dark'`
- Preferência persiste entre sessões do navegador

## Assets Utilizados

### Favicons
- `/favicon-claro.png` - Favicon para tema claro
- `/favicon-escuro.svg` - Favicon para tema escuro

### Logos
- `/holdareana-logo-texto-claro.png` - Logo com texto para tema claro
- `/holdareana-logo-texto-escuro.png` - Logo com texto para tema escuro

## Integração com Tailwind CSS

O projeto já estava configurado para suportar dark mode:
- `tailwind.config.ts` com `darkMode: ["class"]`
- Variáveis CSS em `globals.css` com suporte a `.dark`
- Componentes já utilizam classes dark mode (ex: `dark:bg-background`)

O `ThemeProvider` apenas adiciona/remove a classe `dark` no elemento `<html>`, ativando automaticamente todas as classes dark mode do Tailwind.

## PWA

### Manifest (`src/app/manifest.ts`)

O manifest PWA mantém configurações estáticas:
- `background_color: '#ffffff'` (branco para tema claro)
- `theme_color: '#3b82f6'` (azul primário)

**Nota**: O `theme-color` meta tag no `<head>` é atualizado dinamicamente pelo `ThemeProvider`:
- Tema claro: `#ffffff`
- Tema escuro: `#252830`

### Ícones PWA

Os ícones PWA (`/icons/icon-*.png`) permanecem estáticos. O favicon da aba do navegador é atualizado dinamicamente pelo `ThemeProvider`.

## Acessibilidade

- Toggle possui `aria-label` descritivo
- Transições suaves entre temas
- Suporte a preferência do sistema operacional
- Persistência da escolha do usuário

## Uso em Outros Componentes

Para usar o tema em outros componentes:

```typescript
import { useTheme } from '@/lib/providers/ThemeProvider';

function MeuComponente() {
  const { theme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Tema atual: {theme}</p>
      <button onClick={toggleTheme}>Alternar tema</button>
    </div>
  );
}
```

## Considerações Técnicas

### Evitar FOUC (Flash of Unstyled Content)

O `ThemeProvider` usa um estado `mounted` para evitar que o conteúdo seja renderizado antes do tema ser aplicado, prevenindo flash de conteúdo não estilizado.

### Atualização de Favicon

A atualização do favicon é feita manipulando diretamente o DOM:
- Busca elementos `<link rel="icon">` e `<link rel="apple-touch-icon">`
- Atualiza o atributo `href` dinamicamente

### Meta Tag Theme Color

A meta tag `theme-color` é atualizada para melhor integração com navegadores mobile, especialmente Android Chrome, que usa essa cor na barra de status.

## Próximos Passos (Opcional)

1. Adicionar animação de transição entre temas
2. Criar mais variações de logos se necessário
3. Adicionar suporte a tema automático (seguir preferência do sistema em tempo real)
4. Adicionar indicador visual do tema atual em outros lugares da UI

