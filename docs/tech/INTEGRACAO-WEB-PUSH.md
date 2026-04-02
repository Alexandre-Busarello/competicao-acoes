# Web Push (PWA)

## Uso

Notificações push no navegador para engajamento, ranking e preferências do usuário.

## Dependências

- `web-push` no servidor.
- VAPID — variáveis de ambiente e script `yarn generate-vapid-keys` (ver `package.json`).

## Código

- APIs: `src/app/api/push/*` (subscribe, unsubscribe, preferências, testes).
- Serviços: `src/lib/services/push-notification-service.ts` e correlatos.
- Modelos Prisma: `PushSubscription`, `PushNotificationLog`, `PushNotificationPreferences`.

## Documentação adicional no repo

- Arquivos na raiz ou `docs/` como `PUSH.md`, `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` — podem conter detalhes de implementação; este arquivo é o resumo para o hub Spec-Driven.
