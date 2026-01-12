# Processamento de Logos com Fundo Transparente e Padding Uniforme

## Objetivo
Processar todos os logos da aplicação:
- Remover fundos (escuro para logos claros, branco para logos escuros)
- Adicionar padding uniforme em todos os lados (10% da menor dimensão)
- Garantir que logos com texto sejam usados na aplicação

## Implementação

### Script Criado
Foi criado o script `scripts/process-logos.py` baseado no script `process-favicons.py`.

### Funcionalidades

#### 1. `remove_dark_background()`
- Remove pixels escuros (valores RGB abaixo do threshold)
- Mantém pixels brancos e coloridos
- Usado para logos claros

#### 2. `remove_white_background()`
- Remove pixels brancos (valores RGB acima do threshold)
- Mantém pixels escuros e coloridos
- Usado para logos escuros

#### 3. `add_uniform_padding()`
- Adiciona padding uniforme em todos os lados
- Padding calculado como 10% da menor dimensão da imagem
- Mantém proporção e centraliza o conteúdo

### Logos Processados

#### Logos com Texto (usados na aplicação)
- `holdareana-logo-texto-claro.png` - Remove fundo escuro, adiciona padding
- `holdareana-logo-texto-escuro.png` - Remove fundo branco, adiciona padding

#### Logos sem Texto (backup/alternativos)
- `holdarena-logo-semfundo-claro.png` - Remove fundo escuro, adiciona padding
- `holdarena-logo-semfundo-escuro.png` - Remove fundo branco, adiciona padding

### Parâmetros
- `dark_threshold`: 100 (pixels abaixo deste valor são considerados escuros)
- `white_threshold`: 240 (pixels acima deste valor são considerados brancos)
- `padding_percent`: 10% (padding uniforme baseado na menor dimensão)

## Como Usar

Execute o script:
```bash
python3 scripts/process-logos.py
```

O script processa automaticamente todos os logos:
- Remove fundos apropriados
- Adiciona padding uniforme
- Salva no mesmo local, substituindo os originais

## Resultado
- Logos com fundo transparente
- Padding uniforme em todos os lados (10% da menor dimensão)
- Conteúdo centralizado
- Arquivos otimizados em formato PNG

## Uso na Aplicação

O `UserHeader` foi atualizado para usar os logos com texto:
- Tema claro: `holdareana-logo-texto-claro.png`
- Tema escuro: `holdareana-logo-texto-escuro.png`

Os logos são exibidos dinamicamente baseados no tema selecionado pelo usuário.



