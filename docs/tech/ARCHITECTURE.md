# Arquitetura (estado atual no repositório)

Este documento descreve a **arquitetura real** do projeto **hoje**. Não impõe Clean Architecture; a **direção alvo** para refatoração está em [arch-reference.md](../arch-reference.md).

## Tipo de aplicação

- **Monólito Next.js 14** (App Router), **TypeScript**.
- **Frontend + BFF/API** no mesmo app: rotas em `src/app/`, handlers em `src/app/api/**/route.ts`.
- **Deploy:** Vercel (informado pelo time).
- **Banco:** PostgreSQL no **Supabase**, acesso via **Prisma** (`prisma/schema.prisma`, `DIRECT_DATABASE_URL`).

## Organização de pastas (resumo)

| Caminho | Papel |
|---------|--------|
| `src/app/` | Rotas de páginas, layouts, route handlers (API). |
| `src/components/` | UI por domínio (ranking, portfolio, feed, etc.) + `components/ui` (primitivos estilo shadcn). |
| `src/lib/services/` | Lógica de negócio e orquestração (feed, ranking, push, notificações, etc.). |
| `src/lib/utils/` | Utilitários (datas, carteira, markdown, etc.). |
| `src/lib/prisma/` | Cliente Prisma. |
| `src/lib/supabase/` | Cliente Supabase (browser e server). |
| `src/lib/auth/` | Hooks e fluxo de auth no client. |
| `src/lib/store/` | Estado global (Zustand) onde usado. |
| `src/lib/queue/` | Handlers de fila de ações, quando aplicável. |
| `prisma/` | Schema e migrations. |

## Onde fica cada tipo de lógica

- **Regras de negócio e fluxos:** principalmente `src/lib/services/*` + trechos em route handlers quando ainda não extraídos.
- **HTTP / API:** `src/app/api/**/route.ts`.
- **Persistência:** Prisma nos serviços e nas rotas; sem camada de repositório formal em todo o código.
- **Auth:** Supabase Auth; sessão/usuário em `src/lib/supabase/server.ts`, `src/lib/auth/client.ts`, rotas `src/app/api/auth/*`.

## Padrão arquitetural (atual)

- **Não** é Clean Architecture completa: não há `domain/` / `application/` / `infrastructure/` separados em todo o código.
- Híbrido **feature-oriented nas rotas** + **serviços por domínio** em `lib/services`.

## Direção alvo (dívida técnica / roadmap)

O time pretende **refatorar** para **Clean Architecture + DDD** com **inversão de dependências**, alinhado ao guia [arch-reference.md](../arch-reference.md) (camadas Domain → Application → Infrastructure, dependências apontando para dentro).

Novas features grandes devem **preferir** aproximar-se desse modelo onde for viável, sem obrigar big-bang.

## PWA e push

- **next-pwa** (config em `next.config.js` e scripts pós-build).
- Push via **web-push** e endpoints em `src/app/api/push/*`.
