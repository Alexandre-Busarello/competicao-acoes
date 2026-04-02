# Feature: Perfil público e relacionamentos

## Comportamento

- Perfil por usuário (slug/ID), carteiras públicas, medalhas, timeline.
- **Seguir** e **bloquear** outros usuários.
- Estatísticas agregadas (`UserStats`).

## Implementação (pistas)

- Rotas: `src/app/perfil/[userId]/*`, APIs `users/[userId]/*`, `user/name`, `user/avatar`, etc.
- Modelos: `UserFollow`, `UserBlock`, `UserMedal`, etc.
