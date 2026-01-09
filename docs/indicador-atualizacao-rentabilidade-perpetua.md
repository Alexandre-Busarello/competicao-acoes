# Indicador de Atualização da Rentabilidade Perpétua

## Data
2024

## Objetivo
Adicionar um indicador discreto no perfil público que mostre quando a rentabilidade perpétua foi atualizada pela última vez e quando será a próxima atualização, melhorando a transparência sobre o processo de cálculo.

## Problema Identificado
Usuários não tinham visibilidade sobre:
- Quando a rentabilidade perpétua foi calculada pela última vez
- Com que frequência o cálculo é atualizado
- Quando será a próxima atualização

## Solução Implementada

### Componente `ProfitabilityUpdateIndicator`
Criado um componente discreto que exibe:
1. **Tempo desde a última atualização**: Mostra quantas horas se passaram desde o último cálculo
2. **Countdown para próxima atualização**: Exibe o tempo restante até o próximo cálculo (apenas no desktop)
3. **Frequência de atualização**: Indica que o cálculo acontece a cada 24 horas (apenas no desktop)

### Características do Componente

#### Mobile
- Ícone de relógio pequeno
- Texto pequeno (`text-[10px]`)
- Mostra apenas: "Atualizado há X horas"
- Design discreto e não intrusivo

#### Desktop
- Ícone de relógio ligeiramente maior
- Texto maior (`text-xs`)
- Mostra: "Atualizado há X horas • Próximo em Xh Xm"
- Inclui nota: "(a cada 24h)"
- Mais informações visíveis devido ao maior espaço

### Funcionalidades Técnicas

1. **Atualização em Tempo Real**: 
   - Atualiza automaticamente a cada minuto
   - Usa `setInterval` para manter as informações atualizadas
   - Limpa o intervalo quando o componente é desmontado

2. **Cálculo de Tempo**:
   - Calcula horas desde a última atualização
   - Calcula tempo restante até a próxima atualização (24 horas após a última)
   - Formatação amigável (ex: "2 horas", "1h 30m")

3. **Tratamento de Casos Especiais**:
   - Menos de 1 hora: mostra "menos de 1 hora"
   - Exatamente 1 hora: mostra "1 hora"
   - Múltiplas horas: mostra "X horas"
   - Próxima atualização já passou: mostra "em breve"

## Mudanças Técnicas

### Arquivos Criados
- `src/components/profile/ProfitabilityUpdateIndicator.tsx`: Componente que exibe as informações de atualização
- `src/components/profile/ProfitabilityUpdateBanner.tsx`: Componente wrapper que busca os dados e exibe o indicador em um banner

### Arquivos Modificados
- `src/components/profile/PublicProfileHeader.tsx`: Removido o indicador do header
- `src/app/perfil/[userId]/page.tsx`: Adicionado o banner no início da página

### Novos Imports
- `Clock` do `lucide-react` para o ícone
- `addHours` do `date-fns` para calcular a próxima atualização

### Integração no Perfil Público

O componente foi integrado como um banner discreto no início da página de perfil público, antes do header:
- Posicionado logo após o `PageHeader`
- Exibido em um Card com fundo sutil (`bg-muted/30`)
- Centralizado e discreto
- Visível apenas quando há dados de rentabilidade disponíveis

### Estrutura dos Componentes

#### ProfitabilityUpdateBanner
```tsx
<ProfitabilityUpdateBanner userId={userId} />
```

Este componente wrapper:
- Busca os dados de rentabilidade perpétua via API
- Renderiza o `ProfitabilityUpdateIndicator` dentro de um Card discreto
- Retorna `null` se não houver dados disponíveis

#### ProfitabilityUpdateIndicator
```tsx
<ProfitabilityUpdateIndicator lastUpdated={profitabilityData.lastUpdated} />
```

O componente recebe `lastUpdated` como prop, que é uma string ISO da data/hora da última atualização retornada pela API.

## Classes CSS Utilizadas

### Container Principal
- `flex items-center gap-1.5`: Layout flexível com espaçamento
- `text-[10px] sm:text-xs`: Tamanho de fonte responsivo
- `text-muted-foreground`: Cor discreta
- `mt-0.5`: Margem superior pequena

### Ícone
- `h-3 w-3 sm:h-3.5 sm:w-3.5`: Tamanho responsivo
- `flex-shrink-0`: Evita compressão

### Texto
- `leading-tight`: Altura de linha compacta
- `hidden sm:inline`: Esconde no mobile, mostra no desktop
- `text-[9px] opacity-75`: Estilo para nota adicional

## Benefícios

1. **Transparência**: Usuários sabem quando os dados foram atualizados
2. **Expectativa Clara**: Indicação de quando será a próxima atualização
3. **Confiança**: Mostra que o sistema está funcionando e atualizando regularmente
4. **UX Discreta**: Design não intrusivo que não interfere na experiência principal
5. **Informação Útil**: Ajuda usuários a entenderem a frequência de atualização

## Comportamento

### Mobile
- Mostra apenas o tempo desde a última atualização
- Design compacto e discreto
- Atualiza a cada minuto

### Desktop
- Mostra tempo desde última atualização
- Mostra countdown para próxima atualização
- Mostra frequência de atualização (24h)
- Mais informações visíveis

## Exemplo de Exibição

O indicador aparece em um banner discreto no topo da página:

### Mobile
```
┌─────────────────────────────────┐
│  🕐 Atualizado há 3 horas      │
└─────────────────────────────────┘
```

### Desktop
```
┌─────────────────────────────────────────────────────────────┐
│  🕐 Atualizado há 3 horas • Próximo em 21h 15m (a cada 24h) │
└─────────────────────────────────────────────────────────────┘
```

## Testes Recomendados

1. Verificar exibição no mobile e desktop
2. Testar atualização em tempo real (aguardar 1 minuto)
3. Verificar cálculo correto de horas
4. Testar com diferentes valores de `lastUpdated`
5. Verificar quando próxima atualização já passou
6. Validar responsividade em diferentes tamanhos de tela

## Notas Técnicas

- O componente utiliza `useEffect` com dependência em `lastUpdated`
- Atualiza a cada 60 segundos (60000ms)
- Limpa o intervalo corretamente no cleanup
- Usa cálculo manual de horas/minutos para melhor controle do formato
- A API já retorna `lastUpdated` como ISO string, facilitando o uso

## Considerações de Performance

- Atualização a cada minuto é leve e não impacta performance
- Cálculos são simples operações matemáticas
- Componente é pequeno e discreto
- Não adiciona requisições adicionais à API

