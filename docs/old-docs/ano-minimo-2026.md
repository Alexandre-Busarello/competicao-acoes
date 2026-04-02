# Configuração do Ano Mínimo do Sistema (2026)

## Resumo

O sistema foi configurado para considerar apenas o ano de 2026 em diante, que é quando o sistema será lançado. Todas as validações e listas de anos disponíveis foram atualizadas para refletir essa mudança.

## Alterações Realizadas

### 1. Validação de Períodos

**Arquivo:** `src/lib/utils/period-utils.ts`

A função `isValidPeriod()` foi atualizada para validar apenas anos a partir de 2026:

```typescript
export function isValidPeriod(year: number, month?: number): boolean {
  const currentYear = new Date().getFullYear();
  const minYear = 2026; // Ano mínimo permitido (ano de lançamento)
  
  if (year < minYear || year > currentYear + 1) {
    return false;
  }
  // ... resto da validação
}
```

### 2. Lista de Anos Disponíveis

**Arquivo:** `src/lib/utils/period-utils.ts`

A função `getAvailableYears()` foi atualizada para gerar apenas anos a partir de 2026:

```typescript
export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = 2026; // Ano de lançamento do sistema
  const years: number[] = [];
  
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year);
  }
  
  return years.reverse(); // Mais recente primeiro
}
```

### 3. Validação na API de Ranking

**Arquivo:** `src/app/api/ranking/route.ts`

A validação de ano na API foi atualizada para retornar uma mensagem de erro mais clara:

```typescript
if (year && (isNaN(year) || year < 2026 || year > new Date().getFullYear() + 1)) {
  return NextResponse.json(
    { error: 'Ano inválido. O sistema está disponível apenas a partir de 2026.' },
    { status: 400 }
  );
}
```

### 4. Documentação

**Arquivo:** `docs/sistema-periodos-urls-navegacao.md`

A documentação foi atualizada para refletir o ano mínimo de 2026:

- Validação de parâmetros: Ano deve estar entre 2026 (ano de lançamento) e ano atual + 1
- Navegação: Dropdowns mostram apenas períodos disponíveis (desde lançamento do sistema em 2026)

## Impacto

### Componentes Afetados

1. **PeriodSelector**: Usa `getAvailableYears()` para popular o dropdown de anos, então automaticamente mostrará apenas anos a partir de 2026.

2. **Validações de URL**: Todas as rotas dinâmicas que recebem `year` como parâmetro agora validam contra o ano mínimo de 2026:
   - `/ranking/mensal/[year]/[month]`
   - `/ranking/anual/[year]`
   - `/carteira/[id]/mensal/[year]/[month]`
   - `/carteira/[id]/anual/[year]`

3. **API Endpoints**: O endpoint `/api/ranking` agora rejeita requisições com anos anteriores a 2026.

## Comportamento

- **Anos anteriores a 2026**: Serão rejeitados com erro 400 e mensagem explicativa.
- **Dropdowns de seleção**: Mostrarão apenas anos de 2026 em diante.
- **URLs inválidas**: Serão redirecionadas para o período vigente (atual).

## Testes Recomendados

1. Testar acesso a URLs com anos anteriores a 2026 (deve redirecionar ou mostrar erro).
2. Verificar que o dropdown de anos mostra apenas 2026 em diante.
3. Validar que transações com datas anteriores a 2026 não são consideradas nos rankings (já que o sistema só será lançado em 2026).

## Notas

- O ano 2026 foi escolhido como ano de lançamento do sistema.
- Anos futuros (até ano atual + 1) são permitidos para permitir planejamento.
- A validação de mês futuro já existente permanece inalterada.


