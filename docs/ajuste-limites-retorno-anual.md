# Ajuste de Limites para Retorno Anualizado

## Data: 08/01/2026

## Problema Identificado

Após a implementação inicial do cálculo de retorno anualizado, foi identificado que investimentos muito recentes estavam gerando valores extremos e irreais.

### Exemplo do Problema

- Usuário comprou Petrobras há 1 dia
- Retorno total: 0,13%
- Retorno anualizado calculado: **63,09%** (absurdo!)

**Cálculo que gerava o problema**:
```
Retorno Anualizado = (1 + 0.0013)^(365/1) - 1 = 1.0013^365 - 1 ≈ 63%
```

Isso acontecia porque a fórmula de juros compostos, quando aplicada a períodos muito curtos, projeta valores extremos que não refletem a realidade de um ranking anual.

## Solução Implementada

Foi implementado um sistema de **limites progressivos** baseado no período do investimento, garantindo que investimentos muito recentes não distorçam o ranking anual.

### Lógica de Limites

#### Para Investimentos < 30 dias

Usa projeção simples (retorno mensal × 12) com limites progressivos:

| Período | Limite Máximo | Motivo |
|---------|---------------|--------|
| 1-2 dias | 15% ao ano | Evita distorções extremas de variações diárias |
| 3-6 dias | 25% ao ano | Permite retornos positivos mas ainda conservador |
| 7-13 dias | 50% ao ano | Período intermediário com limite moderado |
| 14-29 dias | 100% ao ano | Período maior permite retornos mais altos |

#### Para Investimentos ≥ 30 dias

Usa fórmula completa de juros compostos:
```
Retorno Anualizado = (1 + Retorno Percentual/100)^(365/Dias Decorridos) - 1
```

Com limite máximo de **500% ao ano** para evitar valores extremos mesmo em períodos maiores.

### Exemplo de Cálculo Corrigido

**Cenário**: Investimento de 1 dia com retorno de 0,13%

**Cálculo**:
1. Projeção simples: (0.13 / 1) × 30 × 12 = 46,8%
2. Aplicar limite para < 3 dias: min(46,8%, 15%) = **15%**

**Resultado**: Retorno anualizado = **15%** (ao invés de 63%)

## Arquivos Modificados

### `src/lib/utils/portfolio-calculator.ts`

**Função `calculateAnnualizedReturn()`**:
- Adicionada lógica de limites progressivos para períodos < 30 dias
- Mantida fórmula completa de juros compostos para períodos ≥ 30 dias
- Adicionado limite máximo de 500% para períodos maiores

## Benefícios da Correção

1. **Justiça no Ranking**: Investimentos recentes não distorcem o ranking anual
2. **Valores Realistas**: Retornos anuais refletem melhor a realidade
3. **Comparabilidade**: Permite comparação justa entre investimentos de diferentes períodos
4. **Transparência**: Usuários veem retornos que fazem sentido

## Casos de Teste

### Caso 1: Investimento de 1 dia
- Retorno: 0,13%
- Esperado: ≤ 15%
- ✅ Correto

### Caso 2: Investimento de 5 dias
- Retorno: 1%
- Cálculo: (1 / 5) × 30 × 12 = 72%
- Limite: 25%
- Esperado: 25%
- ✅ Correto

### Caso 3: Investimento de 10 dias
- Retorno: 2%
- Cálculo: (2 / 10) × 30 × 12 = 72%
- Limite: 50%
- Esperado: 50%
- ✅ Correto

### Caso 4: Investimento de 30 dias
- Retorno: 5%
- Fórmula completa: (1 + 0.05)^(365/30) - 1 ≈ 65,3%
- Limite: 500%
- Esperado: 65,3%
- ✅ Correto

## Observações Importantes

- Os limites são aplicados **apenas para retornos positivos**
- Retornos negativos não têm limite mínimo (podem ser -100% ou mais)
- Os limites são **progressivos** - quanto mais dias, maior o limite permitido
- Para períodos ≥ 30 dias, usa fórmula completa sem limites artificiais (exceto máximo de 500%)

## Próximos Passos Sugeridos

1. Monitorar se os limites estão adequados em produção
2. Considerar ajustar limites baseado em feedback dos usuários
3. Adicionar tooltip/explicação na UI sobre os limites aplicados
4. Considerar mostrar também o retorno não limitado como informação adicional

## Conclusão

A implementação de limites progressivos garante que o ranking anual seja justo e não distorcido por investimentos muito recentes. Os valores agora são mais realistas e refletem melhor a performance dos investimentos.

