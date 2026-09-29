# Implementation Plan: Minha Lista (lista de compras pessoal)

**Branch**: `004-lista-compras` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-lista-compras/spec.md`

## Summary

Substituir os dois stubs sem persistência que já existem na página do
produto (coração de favoritar e botão "Adicionar à lista", ambos hoje só
`useState`/toast local) por um único conceito real: lista de compras por
conta, persistida no backend. Cada item guarda um snapshot imutável do
melhor preço/mercado vistos no momento em que foi adicionado, pode ser
marcado como comprado (sem remover) e removido definitivamente. Como o
backend vive no repositório-irmão `poupe-certo-back`, a feature toca dois
repositórios: front (Next.js — página `/list`, hook, botão do produto) e
back (Nest + Prisma — tabela nova com RLS, módulo `shopping-list`).

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16 (App Router) no front; TypeScript + NestJS 12 + Prisma 7 no back (`poupe-certo-back`, `preset: prisma-postgres`)

**Primary Dependencies**: front: `@tanstack/react-query` 5, `zod`, `axios` (`src/lib/api/client.ts`, injeta Bearer do Supabase Auth); back: `@nestjs/*`, `zod` + `ZodValidationPipe`, `PrismaService.asUser` (nunca `asPublic` — dado é sempre da própria conta)

**Storage**: PostgreSQL gerenciado pelo Supabase, acessado via Prisma no back; nova tabela `shopping_list_items` (RLS own-row, mesmo padrão de `price_confirmations`)

**Testing**: `vitest` no front (`npm test`); suíte e2e Nest (`test/*.e2e-spec.ts`) no back, seguindo `price-reports.e2e-spec.ts` como referência de teste de RLS/ownership

**Target Platform**: Web (Vercel) para o front; Node.js serverless (Vercel) para a API

**Project Type**: Web application — dois repositórios (frontend Next.js + backend Nest/Prisma), integrados via `NEXT_PUBLIC_API_URL`

**Performance Goals**: Lista pessoal tipicamente pequena (dezenas de itens) — sem paginação nem índice especial além da FK em `user_id`; listar/alterar um item responde na mesma faixa dos demais endpoints autenticados do produto (sem SLA numérico à parte definido para o produto)

**Constraints**: Snapshot de preço/mercado é imutável após criado (FR-002) — não pode ser um `include` dinâmico da oferta atual, tem que copiar os valores na hora do INSERT; um item por (usuário, produto) é reforçado por constraint única no banco, não só checagem na aplicação (evita corrida entre abas, ver Edge Cases da spec)

**Scale/Scope**: 3 endpoints novos (`GET/POST /users/me/list`, `PATCH /users/me/list/:id`, `DELETE /users/me/list/:id`), 1 tabela nova, 1 página nova no front, 2 pontos de navegação (mobile-action-bar, site-header), 1 botão reescrito (product-view.tsx) substituindo 2 stubs existentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Stack Declarada, Não Assumida** — ✅ `project.config.json` de ambos os repos confirma `preset: "prisma-postgres"`. Nenhuma skill Supabase client-side é usada; front continua sem acessar tabelas Supabase diretamente, só a API Nest.
- **II. Zod na Borda, Sempre** — ✅ Body de `POST /users/me/list` (`{ productEan }`) e de `PATCH /users/me/list/:id` (`{ purchased: boolean }`) validados com `ZodValidationPipe`, mesmo padrão de `price-report.schema.ts`.
- **III. Autorização Explícita no Servidor** — ✅ Todas as rotas exigem `SupabaseJwtGuard` e usam `asUser(userId, ...)` — toda query filtra `WHERE user_id = userId` (never confiar em id vindo do body); `PATCH`/`DELETE` primeiro confirmam `findFirst({ id, userId })` antes de alterar, então tentar mexer no item de outra conta sempre cai em `NotFoundException`, nunca em "sem permissão" que vazaria existência do id.
- **IV. RLS Obrigatória em Tabelas Supabase** — ✅ Tabela nova `shopping_list_items` nasce com RLS habilitada na mesma migration, com policies own-row (`SELECT/INSERT/UPDATE/DELETE ... USING (user_id = auth.uid())`), mesmo padrão de `price_confirmations`/`profiles`. Nenhum `USING (true)` — é dado 100% privado, sem leitura pública equivalente a `price_confirmations_select_for_active_reports`.
- **V. Segurança Antes do Code Review** — ⚠️ Aplicável: feature cria tabela nova de dado de usuário. `/security` roda antes do `/review`, focando em: (a) RLS realmente impede ver/alterar item de outra conta (teste com dois `userId` diferentes, não só revisão de policy); (b) `productEan` do body é validado (existe e está aprovado) antes de criar snapshot, evitando lista referenciar produto inexistente; (c) unicidade (usuário, produto) reforçada por constraint de banco, não só lógica da aplicação.
- **VI. YAGNI** — ✅ Sem quantidade por item, sem lista compartilhada, sem notificação de mudança de preço (todos fora de escopo explícito na spec). Sem soft-delete — remover é `DELETE` de verdade, já que não há necessidade de histórico de itens removidos.
- **VII. Rastreabilidade Spec → Review** — ✅ Em andamento: `spec.md` ✅, `plan.md` (este arquivo), `tasks.md` (próximo comando), `security-review.md` e `code-review.md` a produzir depois do `/speckit-implement`.

**Gate result**: PASS. Nenhuma violação — item V é obrigação de processo (rodar `/security`), não uma exceção a justificar em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-lista-compras/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── api.md           # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Feature atravessa dois repositórios-irmãos (não um monorepo): o `plan.md`
vive em `poupe-certo-front` (onde a feature aparece pra pessoa usuária),
mas cobre mudanças em ambos.

```text
poupe-certo-front/                          # este repo (frontend Next.js)
└── src/
    ├── app/
    │   └── (shell)/
    │       ├── list/
    │       │   ├── page.tsx                # NOVO: rota /list (server component fino, delega ao client)
    │       │   └── list-view.tsx           # NOVO: client component — lista, checkbox, remover, empty state
    │       └── product/[ean]/
    │           └── product-view.tsx        # remove Heart/favorite stub; botão "Adicionar à lista" usa useShoppingList
    ├── components/
    │   ├── site-header.tsx                 # + link "Minha Lista"
    │   └── mobile-action-bar.tsx           # + ícone "Minha Lista"
    ├── hooks/
    │   └── use-shopping-list.ts            # NOVO: useShoppingList(), useAddToList(), useToggleListItem(), useRemoveListItem()
    └── lib/api/
        └── shopping-list.ts                # NOVO: getShoppingList(), addToList(), toggleListItem(), removeFromList() (+ schemas Zod)

poupe-certo-back/                           # repo-irmão (backend Nest + Prisma)
├── prisma/
│   ├── schema.prisma                       # + model ShoppingListItem
│   └── migrations/<timestamp>_shopping_list/migration.sql   # tabela + RLS + policies own-row
└── src/
    └── shopping-list/                      # NOVO módulo (mesmo padrão de markets/)
        ├── shopping-list.module.ts
        ├── shopping-list.controller.ts     # GET/POST /users/me/list, PATCH+DELETE /users/me/list/:id
        ├── shopping-list.service.ts        # asUser em toda query; snapshot no INSERT
        └── dto/
            └── shopping-list.schema.ts     # Zod: addToListSchema, toggleListItemSchema
```

**Structure Decision**: Reaproveita a estrutura já existente em ambos os
repos — nenhuma pasta nova de alto nível além de `list/` (rota) no front e
`shopping-list/` (módulo) no back, ambas seguindo exatamente o padrão já
estabelecido por `product/[ean]` e `markets/` respectivamente. Nenhum
estado novo de UI global: a página de lista busca seu próprio estado via
`useShoppingList()` (React Query), igual a todas as outras telas do
produto.

## Complexity Tracking

*Nenhuma violação da Constitution exige justificativa — tabela omitida.*
