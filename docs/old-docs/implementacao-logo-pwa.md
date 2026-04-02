# Implementação do Logo e Ícones PWA

## Data: 08/01/2026

## Objetivo

Implementar o logo "Arena do Investidor" na aplicação, incluindo:
1. Exibição do logo no header da aplicação
2. Remoção do fundo branco do logo
3. Geração de ícones PWA em diferentes tamanhos
4. Configuração de splash screens para iOS
5. Atualização do manifest e metadados do PWA

## Arquivos Modificados

### 1. Componente UserHeader (`src/components/navigation/UserHeader.tsx`)

**Mudanças**:
- Adicionado import do componente `Image` do Next.js
- Substituído placeholder do logo por imagem real em todos os estados:
  - Estado de loading
  - Estado não autenticado
  - Estado autenticado
- Logo configurado como link para a página de ranking (`/ranking`)
- Dimensões: `width={120} height={40}` com classe `h-8 w-auto` para responsividade
- Adicionado atributo `priority` para carregamento prioritário

**Código adicionado**:
```typescript
import Image from 'next/image';

// Em cada estado do componente:
<Link href="/ranking" className="flex items-center">
  <Image 
    src="/logo-no-bg.png" 
    alt="Arena do Investidor" 
    width={120} 
    height={40}
    className="h-8 w-auto object-contain"
    priority
  />
</Link>
```

### 2. Layout Raiz (`src/app/layout.tsx`)

**Mudanças**:
- Atualizado título da aplicação de "Ranking Investimentos - Bruno Chimarelli" para "Arena do Investidor"
- Atualizado `appleWebApp.title` para "Arena do Investidor"
- Atualizado `apple-mobile-web-app-title` para "Arena do Investidor"
- Adicionado link para favicon (`/icons/icon-192x192.png`)
- Adicionados 11 links para splash screens do iOS em diferentes resoluções

**Splash screens adicionados**:
- iPhone SE (1st gen): 640x1136
- iPhone 8: 750x1334
- iPhone XR: 828x1792
- iPhone X/XS: 1125x2436
- iPhone XS Max: 1242x2688
- iPhone 12/13: 1170x2532
- iPhone 12 Pro Max: 1284x2778
- iPhone 14 Pro: 1179x2556
- iPhone 14 Pro Max: 1290x2796
- iPad: 1536x2048
- iPad Pro 10.5": 1668x2224
- iPad Pro 12.9": 2048x2732

### 3. Manifest PWA (`src/app/manifest.ts`)

**Mudanças**:
- Atualizado `name` de "Ranking Investimentos - Bruno Chimarelli" para "Arena do Investidor"
- Atualizado `short_name` de "Ranking Invest" para "Arena Invest"
- Mantidos os ícones existentes (já apontam para os arquivos corretos)

## Scripts Criados

### 1. Script de Processamento do Logo (`scripts/process-logo.py`)

**Funcionalidades**:
- Remove fundo branco do logo usando threshold de 240 (pixels RGB acima deste valor são considerados brancos)
- Gera versão do logo sem fundo (`logo-no-bg.png`)
- Cria ícones PWA em 4 versões:
  - `icon-192x192.png` - Ícone padrão 192x192
  - `icon-512x512.png` - Ícone padrão 512x512
  - `icon-maskable-192x192.png` - Ícone maskable 192x192 (com padding de 80%)
  - `icon-maskable-512x512.png` - Ícone maskable 512x512 (com padding de 80%)

**Uso**:
```bash
python3 scripts/process-logo.py
```

**Tecnologias**:
- Python 3
- PIL/Pillow para processamento de imagens

### 2. Script de Geração de Splash Screens (`scripts/generate-splash-screens.py`)

**Funcionalidades**:
- Gera splash screens para iOS em 14 tamanhos diferentes
- Centraliza o logo na tela (ocupando até 40% da menor dimensão)
- Mantém proporção original do logo
- Fundo branco para splash screens

**Uso**:
```bash
python3 scripts/generate-splash-screens.py
```

**Tecnologias**:
- Python 3
- PIL/Pillow para processamento de imagens

## Arquivos Gerados

### Pasta `public/icons/`:
- `icon-192x192.png` - Ícone padrão 192x192px
- `icon-512x512.png` - Ícone padrão 512x512px
- `icon-maskable-192x192.png` - Ícone maskable 192x192px
- `icon-maskable-512x512.png` - Ícone maskable 512x512px

### Pasta `public/splash/`:
- `apple-splash-640-1136.png` até `apple-splash-2048-2732.png` (14 arquivos)

### Pasta `public/`:
- `logo-no-bg.png` - Versão do logo sem fundo branco (para referência)

## Processo de Remoção de Fundo Branco

O script `process-logo.py` utiliza uma técnica simples mas eficaz:

1. **Conversão para RGBA**: Converte a imagem para modo RGBA para suportar transparência
2. **Threshold de branco**: Pixels com valores RGB acima de 240 são considerados brancos
3. **Transparência**: Pixels brancos são convertidos para transparentes (alpha = 0)
4. **Preservação**: Pixels não brancos mantêm suas cores originais

**Limitações**:
- A técnica funciona bem para fundos brancos puros
- Pode não funcionar perfeitamente para fundos com gradientes ou brancos sujos
- Para resultados mais precisos, pode ser necessário usar ferramentas especializadas como GIMP, Photoshop ou APIs de remoção de fundo

## Ícones Maskable

Os ícones maskable são uma especificação PWA que permite que o sistema operacional aplique máscaras personalizadas aos ícones. Eles são criados com:

- **Área segura**: 80% do tamanho total do ícone
- **Padding**: 10% em cada lado (totalizando 20% de padding)
- Isso garante que elementos importantes do logo não sejam cortados quando o sistema aplicar máscaras

## Splash Screens iOS

Os splash screens são gerados automaticamente para diferentes dispositivos iOS:

- **iPhone**: 9 tamanhos diferentes cobrindo desde iPhone SE até iPhone 15 Pro Max
- **iPad**: 3 tamanhos diferentes para iPad padrão e iPad Pro

Cada splash screen:
- Tem fundo branco
- Centraliza o logo
- Mantém proporção do logo original
- Ocupa até 40% da menor dimensão da tela

## Próximos Passos (Opcional)

1. **Otimização do logo**: Considerar criar versão SVG do logo para melhor qualidade em diferentes resoluções
2. **Dark mode**: Criar versão do logo adaptada para dark mode (se necessário)
3. **Favicon**: Adicionar favicon.ico na raiz do projeto
4. **Remoção de fundo avançada**: Se necessário, usar ferramentas mais avançadas para remoção de fundo com melhor precisão

## Notas Técnicas

- O logo original (`logo.png`) permanece na pasta `public/` com fundo branco
- A versão sem fundo (`logo-no-bg.png`) é gerada automaticamente pelo script
- Os ícones são otimizados com `optimize=True` no PIL para reduzir tamanho de arquivo
- Todos os ícones e splash screens são salvos em formato PNG com suporte a transparência

## Comandos Úteis

**Regenerar ícones**:
```bash
python3 scripts/process-logo.py
```

**Regenerar splash screens**:
```bash
python3 scripts/generate-splash-screens.py
```

**Regenerar tudo**:
```bash
python3 scripts/process-logo.py && python3 scripts/generate-splash-screens.py
```

