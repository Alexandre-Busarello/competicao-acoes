# Processamento de Favicons com Fundo Transparente

## Objetivo
Remover os fundos dos favicons deixando-os com transparência:
- **favicon-claro.png**: Remover fundo escuro (borda escura), mantendo o fundo branco
- **favicon-escuro.svg**: Remover apenas o fundo branco fora do quadrado escuro, mantendo o fundo escuro e o logo

## Implementação

### Script Criado
Foi criado o script `scripts/process-favicons.py` baseado no script existente `process-logo.py`.

### Funcionalidades

#### 1. `remove_dark_background()`
- Remove pixels escuros (valores RGB abaixo do threshold)
- Mantém pixels brancos e coloridos
- Usado para `favicon-claro.png` para remover a borda escura

#### 2. `remove_white_background()`
- Remove pixels brancos (valores RGB acima do threshold)
- Mantém pixels escuros e coloridos
- Função já existente no script original

#### 3. `remove_dark_and_white_background()`
- Remove tanto pixels escuros quanto brancos
- Função disponível mas não utilizada no processamento atual

### Parâmetros
- `dark_threshold`: 100 (pixels abaixo deste valor são considerados escuros)
- `white_threshold`: 240 (pixels acima deste valor são considerados brancos)

## Como Usar

Execute o script:
```bash
python3 scripts/process-favicons.py
```

O script processa automaticamente:
- `public/favicon-claro.png` - Remove fundo escuro (borda escura)
- `public/favicon-escuro.svg` - Remove apenas fundo branco (mantém fundo escuro do quadrado)

Os arquivos são salvos no mesmo local, substituindo os originais.

## Resultado
- Favicons com fundo transparente
- Logo preservado com todas as cores originais
- Arquivos otimizados em formato PNG

