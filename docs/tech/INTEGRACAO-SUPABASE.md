# Integração Supabase

## Uso no produto

1. **Autenticação** — Supabase Auth (magic link, Google conforme rotas implementadas).
2. **Banco de dados** — PostgreSQL hospedado no Supabase; a aplicação usa **Prisma** com URL direta (`DIRECT_DATABASE_URL`).

## Variáveis de ambiente (conceituais)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — operações server-side privilegiadas quando necessário.

Não commitar valores reais; usar apenas `.env` local / secrets da Vercel.

## Código relevante

- `src/lib/supabase/client.ts` — cliente browser.
- `src/lib/supabase/server.ts` — sessão e usuário no servidor.
- `src/lib/auth/client.ts` — React Query + fluxo de sessão no client.
- Rotas `src/app/api/auth/*` e páginas `src/app/auth/*`.

## Row Level Security (RLS)

Documentação histórica do projeto pode existir em `docs/` (ex.: `rls-setup.md`). Políticas no painel Supabase devem estar alinhadas ao modelo Prisma e às rotas da API.
