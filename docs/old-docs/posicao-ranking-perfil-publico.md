# Posição no Ranking no Perfil Público

## Resumo

Foi implementada a exibição das posições do usuário nos rankings vigentes (mensal e anual) no perfil público. As posições são exibidas apenas se o usuário estiver classificado nos respectivos rankings.

## Implementação

### 1. API do Perfil Público

**Arquivo:** `src/app/api/users/[userId]/public/route.ts`

**Mudanças:**
- Adicionada importação de `rankingService` e `getCurrentPeriod`
- Busca das posições nos rankings vigentes (mensal e anual)
- Retorno das posições no objeto `rankings`:
  ```typescript
  rankings: {
    monthly: number | null,  // Posição no ranking mensal vigente
    annual: number | null,    // Posição no ranking anual vigente
  }
  ```

**Lógica:**
1. Obtém o período vigente usando `getCurrentPeriod()`
2. Busca o ranking mensal vigente usando `rankingService.getRanking('mensal', year, month)`
3. Busca o ranking anual vigente usando `rankingService.getRanking('anual', year)`
4. Encontra a entrada do usuário em cada ranking e extrai a posição (`rank`)
5. Retorna `null` se o usuário não estiver no ranking

**Tratamento de Erros:**
- Erros ao buscar rankings não fazem a requisição falhar
- Logs de erro são registrados no console
- Se houver erro, as posições retornam como `null`

### 2. Componente PublicProfileHeader

**Arquivo:** `src/components/profile/PublicProfileHeader.tsx`

**Mudanças:**
- Adicionada importação de `Trophy` do lucide-react e `Link` do Next.js
- Adicionada seção que exibe as posições nos rankings vigentes
- Badges clicáveis que redirecionam para os rankings correspondentes

**Visualização:**
- Exibe apenas se o usuário estiver em pelo menos um dos rankings
- Badges com ícone de troféu amarelo
- Formato: "Mensal: #X" ou "Anual: #X"
- Hover effect com mudança de cor de fundo
- Links para as páginas dos rankings vigentes

**Layout:**
- Posicionado entre "Membro desde..." e a grid de estatísticas
- Layout flexível que se adapta ao tamanho da tela
- Gap de 3 unidades entre badges
- Responsivo para mobile e desktop

## Comportamento

### Quando Exibe
- Exibe apenas se o usuário estiver classificado em pelo menos um dos rankings vigentes
- Se o usuário não estiver em nenhum ranking, a seção não é exibida

### Links
- **Ranking Mensal**: Redireciona para `/ranking/mensal/[ano]/[mês]` do período vigente
- **Ranking Anual**: Redireciona para `/ranking/anual/[ano]` do período vigente

### Performance
- Rankings são buscados em paralelo (mensal e anual)
- Cache do ranking service é utilizado quando disponível
- Erros não bloqueiam a exibição do perfil

## Exemplo de Uso

```typescript
// Resposta da API
{
  id: "user-id",
  name: "Nome do Usuário",
  // ... outros campos
  rankings: {
    monthly: 5,    // 5º lugar no ranking mensal vigente
    annual: 12,     // 12º lugar no ranking anual vigente
  }
}
```

## Considerações

- As posições são sempre dos rankings vigentes (período atual)
- Não exibe posições de períodos anteriores
- Se o usuário não estiver classificado, a seção não aparece
- Os badges são clicáveis e levam diretamente ao ranking correspondente

