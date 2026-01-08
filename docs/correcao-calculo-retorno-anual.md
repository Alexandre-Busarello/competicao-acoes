# Correção do Cálculo do Retorno Anual

## Data: 08/01/2026

## Problema Identificado

O cálculo do retorno anual no ranking estava incorreto. O sistema estava multiplicando o retorno mensal por 12, o que gerava resultados absurdos para investimentos recentes.

### Exemplo do Problema

- Usuário comprou Petrobras ontem (07/01/2026)
- Retorno mensal: 0,1%
- Retorno anual calculado (incorreto): 0,1% × 12 = 1,21%

Isso não faz sentido porque:
1. O investimento tem apenas 1 dia, não 1 mês
2. Multiplicar por 12 assume que o retorno mensal se manterá constante por 12 meses
3. Para investimentos recentes, isso gera valores completamente irreais

## Solução Implementada

Foi implementado o cálculo correto do retorno anualizado usando a fórmula de juros compostos, considerando o período real desde a primeira transação do usuário.

### Fórmula Utilizada

```
Retorno Anualizado = (1 + Retorno Percentual/100)^(365/Dias Decorridos) - 1
```

Onde:
- **Retorno Percentual**: Retorno total desde a primeira transação até hoje
- **Dias Decorridos**: Número de dias desde a primeira transação até hoje
- **365**: Número de dias em um ano (base para anualização)

### Lógica de Cálculo

1. **Identificar a primeira transação**: Busca a data da primeira transação do usuário
2. **Calcular dias decorridos**: Diferença em dias entre a primeira transação e hoje
3. **Calcular retorno total**: Retorno percentual desde o início até hoje
4. **Anualizar o retorno**: Aplicar fórmula de juros compostos para projetar o retorno anualizado

### Casos Especiais

- **Retorno zero**: Se o retorno é zero, o retorno anualizado também é zero
- **Investimentos muito recentes (< 30 dias)**: Usa abordagem conservadora com limites progressivos:
  - **1-2 dias**: Limite máximo de 15% ao ano (evita distorções extremas)
  - **3-6 dias**: Limite máximo de 25% ao ano
  - **7-13 dias**: Limite máximo de 50% ao ano
  - **14-29 dias**: Limite máximo de 100% ao ano
- **30+ dias**: Usa fórmula completa de juros compostos (limite máximo de 500% ao ano)
- **Retornos negativos**: A fórmula funciona tanto para retornos positivos quanto negativos

## Arquivos Modificados

### 1. `src/lib/utils/portfolio-calculator.ts`

**Novas funções centralizadas criadas**:
- `calculateMonthlyReturn()`: Calcula retorno mensal percentual
- `calculateAnnualizedReturn()`: Calcula retorno anualizado usando fórmula de juros compostos
- `calculateReturns()`: Função principal que calcula ambos os retornos de forma centralizada

**Benefícios da centralização**:
- Elimina duplicação de código
- Garante consistência em todos os cálculos
- Facilita manutenção e testes
- Único ponto de verdade para cálculos de rentabilidade

### 2. `src/lib/services/ranking-service.ts`

**Método `calculateRanking`**:
- Substituído cálculo duplicado por chamada à função centralizada `calculateReturns()`
- Código mais limpo e manutenível

**Método `calculateUserPortfolio`**:
- Substituído cálculo duplicado por chamada à função centralizada `calculateReturns()`
- Garante consistência entre ambos os métodos

### 3. `src/app/(main)/ranking/page.tsx`

**Fallback removido**:
- Removido fallback `c.monthlyReturn * 12` que ainda estava presente
- Agora usa `annualReturn` diretamente quando disponível

## Benefícios da Correção

1. **Precisão**: Retorno anualizado reflete a realidade do investimento
2. **Justiça**: Investimentos recentes não são penalizados com retornos anuais irreais
3. **Transparência**: Usuários veem retornos que fazem sentido matemático
4. **Comparabilidade**: Permite comparação justa entre investimentos de diferentes períodos

## Exemplo de Cálculo Correto

**Cenário**: Usuário comprou ação há 30 dias com retorno de 1%

**Cálculo antigo (incorreto)**:
- Retorno anual = 1% × 12 = 12%

**Cálculo novo (correto)**:
- Dias decorridos = 30
- Retorno anualizado = (1 + 0.01)^(365/30) - 1 = 1.01^12.17 - 1 ≈ 12.95%

**Cenário**: Usuário comprou ação há 1 dia com retorno de 0,13%

**Cálculo antigo (incorreto)**:
- Retorno anual = 0,13% × 12 = 1,56%

**Cálculo novo (correto com limites conservadores)**:
- Dias decorridos = 1
- Projeção simples: (0.13 / 1) × 30 × 12 = 46,8%
- **Limitado a 15% ao ano** para períodos muito curtos (< 3 dias)
- Retorno anualizado = **15%** (ao invés de 63% que seria sem limite)

**Nota importante**: Para investimentos muito recentes (< 30 dias), aplicamos limites conservadores para evitar valores extremos e irreais. Isso garante que o ranking anual seja justo e não distorcido por investimentos muito recentes com pequenas variações de preço.

## Testes Recomendados

1. **Investimento de 1 dia**: Verificar se o cálculo não gera valores absurdos
2. **Investimento de 30 dias**: Verificar se o cálculo está próximo do esperado
3. **Investimento de 365 dias**: Verificar se o retorno anualizado está próximo do retorno real
4. **Retornos negativos**: Verificar se a fórmula funciona corretamente para perdas
5. **Múltiplas transações**: Verificar se a primeira transação é identificada corretamente

## Observações Importantes

- O cálculo considera a **primeira transação** do usuário como ponto de partida
- Para investimentos muito recentes (< 30 dias), aplicamos **limites conservadores** para evitar valores extremos:
  - Investimentos de 1-2 dias: máximo 15% ao ano
  - Investimentos de 3-6 dias: máximo 25% ao ano
  - Investimentos de 7-13 dias: máximo 50% ao ano
  - Investimentos de 14-29 dias: máximo 100% ao ano
- Para investimentos com 30+ dias, usa fórmula completa de juros compostos (limite máximo de 500%)
- O cálculo é atualizado a cada atualização de preços (a cada 15 minutos)
- O retorno anualizado é uma **projeção**, não uma garantia de retorno futuro
- **Todos os cálculos de rentabilidade agora são centralizados** em `portfolio-calculator.ts` para garantir consistência

## Próximos Passos Sugeridos

1. Adicionar validação para evitar retornos anuais extremos (ex: > 1000%)
2. Considerar adicionar um período mínimo (ex: 7 dias) antes de calcular retorno anualizado
3. Adicionar tooltip/explicação na UI sobre o que significa "retorno anualizado"
4. Considerar mostrar também o retorno desde o início (não anualizado) como informação adicional

