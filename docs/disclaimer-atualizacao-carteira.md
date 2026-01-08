# Adição de Disclaimer sobre Atualização da Carteira

## Data: 09/01/2026

## Problema Identificado

Usuários podem cadastrar transações e não entender por que essas transações ainda não aparecem refletidas no cálculo da carteira e rentabilidade exibidos no ranking. Isso pode causar confusão, pois o cálculo do ranking ocorre periodicamente (a cada 15 minutos), não em tempo real.

## Solução Implementada

Foi adicionado um disclaimer informativo em duas páginas relacionadas à visualização de carteiras:

1. **Página "Minha Carteira"** (`/minha-carteira`)
2. **Página de Detalhes da Carteira** (`/carteira/[id]`)

O disclaimer explica que:
- O cálculo da carteira e rentabilidade no ranking é atualizado automaticamente a cada 15 minutos
- Transações recém-cadastradas podem levar até 15 minutos para serem contabilizadas nas posições e rentabilidade exibidas

### Localização dos Disclaimers

#### Página "Minha Carteira"
O disclaimer foi adicionado logo após o componente `PortfolioSummary` e antes do componente `TransactionList`, garantindo que seja visível para o usuário ao visualizar sua carteira.

#### Página de Detalhes da Carteira
O disclaimer foi adicionado logo após o componente `PortfolioHeader` e antes do `AssetAllocationChart`, garantindo que seja visível logo no início da visualização da carteira de qualquer competidor.

### Estilo Visual

O disclaimer utiliza o mesmo estilo visual do disclaimer existente na página de ranking para manter consistência na interface:

- **Fundo**: Azul claro (`bg-blue-50`) com suporte a modo escuro (`dark:bg-blue-950/20`)
- **Borda**: Azul (`border-blue-200`) com suporte a modo escuro (`dark:border-blue-800`)
- **Ícone**: Ícone de informação (`Info`) do lucide-react
- **Texto**: Texto pequeno (`text-xs`) com cores apropriadas para modo claro e escuro

### Implementação Técnica

```typescript
{/* Disclaimer sobre delay de atualização */}
<div className="container mx-auto px-4 py-2">
  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
    <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>
        <strong>Atenção:</strong> O cálculo da carteira e rentabilidade no ranking é atualizado automaticamente a cada 15 minutos. 
        Transações recém-cadastradas podem levar até 15 minutos para serem contabilizadas nas posições e rentabilidade exibidas.
      </span>
    </p>
  </div>
</div>
```

## Benefícios

1. **Transparência**: Usuários são informados sobre o delay de atualização
2. **Redução de Confusão**: Evita que usuários pensem que há um erro quando suas transações não aparecem imediatamente
3. **Consistência**: Mantém o mesmo padrão visual do disclaimer do ranking
4. **Melhor UX**: Usuários sabem o que esperar em termos de tempo de atualização

## Arquivos Modificados

- `src/app/(main)/minha-carteira/page.tsx`
  - Adicionado import do ícone `Info` do lucide-react
  - Adicionado componente de disclaimer após `PortfolioSummary`

- `src/app/carteira/[id]/page.tsx`
  - Adicionado import do ícone `Info` do lucide-react
  - Adicionado componente de disclaimer após `PortfolioHeader`

## Observações

- O disclaimer é sempre exibido em ambas as páginas (não há condição para mostrá-lo)
- O texto é claro e direto, explicando tanto o período de atualização quanto o impacto nas transações
- O estilo é responsivo e funciona bem em dispositivos móveis e desktop
- Na página "Minha Carteira", o disclaimer está posicionado estrategicamente para ser visto antes do histórico de transações
- Na página de detalhes da carteira, o disclaimer está posicionado logo após o cabeçalho para ser visível imediatamente ao visualizar qualquer carteira

## Relação com Outros Disclaimers

Este disclaimer complementa o disclaimer existente na página de ranking (`/ranking`), que informa sobre o delay de atualização do ranking. Ambos seguem o mesmo padrão visual e de comunicação, garantindo uma experiência consistente para o usuário.

