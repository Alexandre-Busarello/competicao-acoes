# Feature: Autenticação

## Provedor

- **Supabase Auth** — magic link, Google (conforme rotas), callback em `src/app/auth/callback`.

## Fluxo resumido

- Client: `src/lib/auth/client.ts` (React Query + Supabase).
- Server: `src/lib/supabase/server.ts` — sessão/usuário em route handlers.
- APIs: `src/app/api/auth/*` (me, signup, sync-session, etc.).

## Usuário no banco de aplicação

- Tabela `User` ligada a `authUserId` (Supabase).
