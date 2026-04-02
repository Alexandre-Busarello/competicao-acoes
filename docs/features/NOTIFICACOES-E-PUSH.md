# Feature: Notificações in-app e push

## Comportamento

- Notificações internas (likes, comentários, follows, etc.).
- Preferências por tipo; push via **Web Push** para PWA.

## Implementação (pistas)

- APIs: `src/app/api/notifications/*`, `src/app/api/push/*`, crons `engagement-notifications`, `reengagement-notifications`.
- Serviços: `internal-notification-service.ts`, `push-notification-service.ts`, `engagement-notification-service.ts`.
- Ver também [../tech/INTEGRACAO-WEB-PUSH.md](../tech/INTEGRACAO-WEB-PUSH.md).
