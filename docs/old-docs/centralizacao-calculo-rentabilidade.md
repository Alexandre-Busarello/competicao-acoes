# Centralização do Cálculo de Rentabilidade

## Data: 08/01/2026

## Problema Identificado

O cálculo de rentabilidade estava duplicado em múltiplos lugares do código:
- No método `calculateRanking()` do `ranking-service.ts`
- No método `calculateUserPortfolio()` do `ranking-service.ts`

Isso gerava:
1. **Duplicação de código**: Mesma lógica repetida em dois lugares
2. **Risco de inconsistência**: Mudanças em um lugar não eram refletidas no outro
3. **Dificuldade de manutenção**: Correções precisavam ser feitas em múltiplos lugares
4. **Dificuldade de testes**: Lógica espalhada dificulta testes unitários

## Solução Implementada

Foi criada uma camada de funções utilitárias centralizadas no arquivo `portfolio-calculator.ts` que contém toda a lógica de cálculo de rentabilidade.

### Funções Criadas

#### 1. `calculateMonthlyReturn(currentValue, totalInvested)`

Calcula o retorno mensal percentual baseado no valor investido e valor atual.

```typescript
export function calculateMonthlyReturn(
  currentValue: number,
  totalInvested: number
): number
```

**Parâmetros**:
- `currentValue`: Valor atual da carteira
- `totalInvested`: Valor total investido

**Retorna**: Retorno percentual (ex: 5.5 para 5,5%)

#### 2. `calculateAnnualizedReturn(totalReturnPercent, firstTransactionDate)`

Calcula o retorno anualizado usando fórmula de juros compostos baseado no período real desde a primeira transação.

```typescript
export function calculateAnnualizedReturn(
  totalReturnPercent: number,
  firstTransactionDate: Date
): number
```

**Parâmetros**:
- `totalReturnPercent`: Retorno total percentual desde o início
- `firstTransactionDate`: Data da primeira transação

**Retorna**: Retorno anualizado percentual

**Fórmula utilizada**:
```
Retorno Anualizado = (1 + Retorno Percentual/100)^(365/Dias Decorridos) - 1
```

#### 3. `calculateReturns(currentValue, totalInvested, firstTransactionDate)`

Função principal que calcula ambos os retornos (mensal e anualizado) de forma centralizada.

```typescript
export function calculateReturns(
  currentValue: number,
  totalInvested: number,
  firstTransactionDate: Date
): {
  monthlyReturn: number;
  annualReturn: number;
}
```

**Parâmetros**:
- `currentValue`: Valor atual da carteira
- `totalInvested`: Valor total investido
- `firstTransactionDate`: Data da primeira transação

**Retorna**: Objeto com `monthlyReturn` e `annualReturn` já formatados (2 casas decimais)

## Arquivos Modificados

### 1. `src/lib/utils/portfolio-calculator.ts`

**Adicionadas 3 novas funções**:
- `calculateMonthlyReturn()`
- `calculateAnnualizedReturn()`
- `calculateReturns()`

**Localização**: Arquivo já existente que contém outras funções de cálculo de portfolio, mantendo organização lógica.

### 2. `src/lib/services/ranking-service.ts`

**Método `calculateRanking()`**:
- Removido código duplicado de cálculo de retorno (linhas 178-206)
- Substituído por chamada à função `calculateReturns()`
- Código reduzido de ~30 linhas para ~10 linhas

**Método `calculateUserPortfolio()`**:
- Removido código duplicado de cálculo de retorno (linhas 367-393)
- Substituído por chamada à função `calculateReturns()`
- Código reduzido de ~30 linhas para ~10 linhas

**Import atualizado**:
```typescript
import { calculatePortfolio, calculateReturns } from '@/lib/utils/portfolio-calculator';
```

## Benefícios da Centralização

### 1. **Consistência**
- Todos os cálculos de rentabilidade usam a mesma lógica
- Impossível ter valores diferentes em diferentes partes do sistema
- Garante que correções sejam aplicadas universalmente

### 2. **Manutenibilidade**
- Mudanças na lógica de cálculo precisam ser feitas em um único lugar
- Facilita correção de bugs e implementação de melhorias
- Código mais fácil de entender e navegar

### 3. **Testabilidade**
- Funções isoladas são mais fáceis de testar
- Pode-se criar testes unitários específicos para cada função
- Testes podem ser executados independentemente

### 4. **Reutilização**
- Funções podem ser facilmente reutilizadas em outros lugares do código
- Novos recursos podem usar as mesmas funções sem duplicar código
- Reduz tamanho total do código

### 5. **Documentação**
- Funções centralizadas podem ter documentação JSDoc completa
- Fica claro o propósito e uso de cada função
- Facilita onboarding de novos desenvolvedores

## Exemplo de Uso

### Antes (Código Duplicado)

```typescript
// No método calculateRanking
const monthlyReturn = totalInvested > 0 
  ? ((currentValue - totalInvested) / totalInvested) * 100 
  : 0;

const firstTransactionDate = userTransactions.length > 0
  ? new Date(Math.min(...userTransactions.map(tx => tx.date.getTime())))
  : new Date();
const daysSinceFirstTransaction = Math.max(
  1,
  Math.floor((Date.now() - firstTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
);

let annualReturn = 0;
if (monthlyReturn > 0 && daysSinceFirstTransaction > 0) {
  const returnMultiplier = 1 + (monthlyReturn / 100);
  const annualizedMultiplier = Math.pow(returnMultiplier, 365 / daysSinceFirstTransaction);
  annualReturn = (annualizedMultiplier - 1) * 100;
}
// ... mais código duplicado no método calculateUserPortfolio
```

### Depois (Código Centralizado)

```typescript
// Em qualquer lugar do código
import { calculateReturns } from '@/lib/utils/portfolio-calculator';

const firstTransactionDate = userTransactions.length > 0
  ? new Date(Math.min(...userTransactions.map(tx => tx.date.getTime())))
  : new Date();

const { monthlyReturn, annualReturn } = calculateReturns(
  currentValue,
  totalInvested,
  firstTransactionDate
);
```

## Testes Recomendados

1. **Teste unitário de `calculateMonthlyReturn`**:
   - Retorno positivo
   - Retorno negativo
   - Valor investido zero (deve retornar 0)
   - Valores extremos

2. **Teste unitário de `calculateAnnualizedReturn`**:
   - Investimento de 1 dia
   - Investimento de 30 dias
   - Investimento de 365 dias
   - Retorno zero
   - Retornos positivos e negativos

3. **Teste unitário de `calculateReturns`**:
   - Verificar que retorna ambos os valores corretamente
   - Verificar formatação (2 casas decimais)
   - Verificar consistência entre os valores

4. **Teste de integração**:
   - Verificar que `calculateRanking()` e `calculateUserPortfolio()` retornam valores consistentes
   - Verificar que mudanças nas funções centralizadas afetam ambos os métodos

## Próximos Passos Sugeridos

1. **Adicionar testes unitários** para as novas funções
2. **Criar testes de integração** para garantir consistência
3. **Adicionar validações** nas funções (ex: valores negativos, datas inválidas)
4. **Considerar adicionar logging** para debug em produção
5. **Documentar casos de borda** (ex: investimentos muito recentes)

## Observações Importantes

- As funções são **puras** (não têm efeitos colaterais)
- As funções são **síncronas** (não fazem chamadas assíncronas)
- A formatação (2 casas decimais) é feita dentro de `calculateReturns()`
- O cálculo considera sempre a **primeira transação** como ponto de partida
- Para investimentos muito recentes (< 1 dia), o retorno anualizado pode parecer extremo, mas é matematicamente correto

## Conclusão

A centralização do cálculo de rentabilidade elimina duplicação de código, garante consistência e facilita manutenção futura. Todas as partes do sistema que precisam calcular rentabilidade agora usam as mesmas funções centralizadas, garantindo que os valores sejam sempre consistentes e corretos.

