# Otimização de Filtros no Mobile

## Data: 09/01/2026

## Problema Identificado

No mobile, os filtros de período (seletores de ano e mês) estavam sempre visíveis, ocupando muito espaço vertical e empurrando o conteúdo principal para baixo. Isso prejudicava a experiência do usuário em dispositivos móveis.

## Solução Implementada

Foi criado um novo componente `PeriodFilters` que agrupa o `PeriodIndicator` e o `PeriodSelector`, com comportamento responsivo:

- **Desktop (sm e acima)**: Mantém o comportamento original - filtros sempre visíveis
- **Mobile**: Mostra apenas o indicador de período e um botão "Filtros" que abre um Dialog com os seletores

## Componentes Criados/Modificados

### 1. Novo Componente: `PeriodFilters`

**Arquivo:** `src/components/ranking/PeriodFilters.tsx`

Este componente unifica a exibição dos filtros de período com comportamento responsivo:

```typescript
export function PeriodFilters({ period, year, month, basePath }: PeriodFiltersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      {/* Desktop: sempre visível */}
      <div className="hidden sm:flex ...">
        <PeriodIndicator period={period} year={year} month={month} />
        <PeriodSelector period={period} year={year} month={month} basePath={basePath} />
      </div>

      {/* Mobile: indicador + botão de filtro */}
      <div className="flex sm:hidden ...">
        <PeriodIndicator period={period} year={year} month={month} />
        <Dialog>
          <DialogTrigger>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </DialogTrigger>
          <DialogContent>
            <PeriodSelector ... />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
```

**Características:**
- Usa `hidden sm:flex` para desktop (visível apenas em telas >= 640px)
- Usa `flex sm:hidden` para mobile (visível apenas em telas < 640px)
- Dialog fecha automaticamente após seleção de período

### 2. Modificação: `PeriodSelector`

**Arquivo:** `src/components/ranking/PeriodSelector.tsx`

Foi adicionada uma prop opcional `onSelect` para permitir que o componente pai seja notificado quando uma seleção é feita:

```typescript
interface PeriodSelectorProps {
  // ... outras props
  onSelect?: () => void; // Callback opcional chamado quando uma seleção é feita
}

export function PeriodSelector({ ..., onSelect }: PeriodSelectorProps) {
  const handleYearChange = (newYear: string) => {
    // ... lógica de navegação
    onSelect?.(); // Chama callback se fornecido
  };

  const handleMonthChange = (newMonth: string) => {
    // ... lógica de navegação
    onSelect?.(); // Chama callback se fornecido
  };
}
```

## Páginas Atualizadas

Todas as páginas que usavam `PeriodSelector` e `PeriodIndicator` separadamente foram atualizadas para usar `PeriodFilters`:

1. **`src/app/(main)/ranking/mensal/[year]/[month]/page.tsx`**
   - Substituído uso de `PeriodSelector` + `PeriodIndicator` por `PeriodFilters`

2. **`src/app/(main)/ranking/anual/[year]/page.tsx`**
   - Substituído uso de `PeriodSelector` + `PeriodIndicator` por `PeriodFilters`

3. **`src/app/carteira/[id]/mensal/[year]/[month]/page.tsx`**
   - Substituído uso de `PeriodSelector` + `PeriodIndicator` por `PeriodFilters`

4. **`src/app/carteira/[id]/anual/[year]/page.tsx`**
   - Substituído uso de `PeriodSelector` + `PeriodIndicator` por `PeriodFilters`

## Comportamento

### Desktop (≥ 640px)
- Indicador de período e seletores sempre visíveis
- Layout horizontal com espaço entre elementos
- Comportamento idêntico ao anterior

### Mobile (< 640px)
- Apenas o indicador de período (badge) e botão "Filtros" visíveis
- Botão abre um Dialog com os seletores de ano e mês
- Dialog fecha automaticamente após seleção (com pequeno delay para permitir navegação)
- Economiza espaço vertical significativo

## Benefícios

1. **Economia de Espaço**: No mobile, os filtros ocupam apenas uma linha (indicador + botão) ao invés de múltiplas linhas
2. **Melhor UX Mobile**: Conteúdo principal fica mais próximo do topo, melhorando a navegação
3. **Consistência**: Mesmo componente usado em todas as páginas (ranking e carteira)
4. **Manutenibilidade**: Lógica de responsividade centralizada em um único componente
5. **Acessibilidade**: Dialog mantém foco e permite navegação por teclado

## Testes Recomendados

1. ✅ Verificar que no desktop os filtros continuam sempre visíveis
2. ✅ Verificar que no mobile aparece apenas indicador + botão "Filtros"
3. ✅ Testar abertura do Dialog ao clicar no botão "Filtros"
4. ✅ Testar seleção de ano/mês no Dialog e verificar que fecha automaticamente
5. ✅ Verificar navegação após seleção (URL deve mudar corretamente)
6. ✅ Testar em diferentes tamanhos de tela (breakpoint sm: 640px)

## Observações

- O breakpoint `sm` (640px) foi escolhido como ponto de corte entre mobile e desktop
- O Dialog usa o componente `Dialog` do shadcn/ui, que já é responsivo e acessível
- O delay de 100ms antes de fechar o Dialog garante que a navegação seja processada antes do fechamento
- O componente `PeriodSelector` mantém compatibilidade com código existente (prop `onSelect` é opcional)


