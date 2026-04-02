# Monetização

## Modelo

**Freemium** com assinatura **PRO**.

### Grátis

- Participação na **competição** (rankings).
- Uso do **feed** e postagens em geral.
- **Restrição:** conteúdo que mostra **o que outros usuários estão comprando e vendendo** pode aparecer **borrado** para usuários não PRO.

### PRO (assinatura)

Benefícios documentados pelo produto:

- Visualização **completa** das **carteiras** no ranking (sem blur onde aplicável).
- **Premiação melhor** na competição anual (prêmio em dinheiro em dobro para top 3, sujeito à regra de elegibilidade PRO — ver [RANKING-COMPETICAO.md](../features/RANKING-COMPETICAO.md)).
- Acesso aos **rankings qualitativos** (ações e FIIs).
- Visualização de **períodos anteriores** (ranking/carteira) conforme regras da UI “Como funciona”.

## Pagamentos

- **Meio ativo:** **Cakto** (webhooks e fluxo de checkout em evolução no código).
- **Kiwify:** **descontinuado** como meio de pagamento; ainda pode existir **código e schema legados** (`kiwify*` no Prisma, filas, rotas) até remoção planejada — ver [CHECKOUT-E-CAKTO.md](../features/CHECKOUT-E-CAKTO.md).

## Documentação relacionada

- [../features/PRO-PREMIUM.md](../features/PRO-PREMIUM.md)
- [../features/CHECKOUT-E-CAKTO.md](../features/CHECKOUT-E-CAKTO.md)
