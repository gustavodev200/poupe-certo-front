# Implementation Plan: Meus produtos + navegação lateral

**Branch**: `006-meus-produtos-sidebar` (mesmo nome nos dois repos) | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-meus-produtos-sidebar/spec.md`

## Summary

Dar à pessoa que cadastra produtos visibilidade do status de moderação
(Pendentes/Aprovados/Rejeitados) numa página `/my-products`, e reorganizar a
navegação do app num menu lateral (trilho colapsável em `md+`, gaveta em
mobile) reaproveitando o padrão do `AdminSidebar`. Backend ganha um endpoint
de leitura `GET /users/me/products` (via `asUser`, RLS `products_select_own`
já existente — sem migration) e o `GET /users/me` passa a devolver
`isOperator` para o menu decidir se mostra "Admin".

## Technical Context

**Language/Version**: TypeScript 5 (front: Next 16.3.6 / React 19.2; back: NestJS 12)

**Primary Dependencies**: front — TanStack Query 5, Zustand 5 (persist), radix-ui Dialog, lucide-react, Zod 4, axios; back — Prisma 7.10, nestjs Swagger, Zod

**Storage**: Postgres (Supabase) via Prisma no back. Nenhuma tabela/coluna nova.

**Testing**: front — Vitest (unit) + Playwright (e2e com mock backend Node em `tests/e2e/fixtures/mock-backend.ts`); back — Jest unit + e2e sem DB real (401/validação)

**Target Platform**: navegadores modernos, 320–1920px; deploy Vercel

**Project Type**: web app em dois repositórios (`poupe-certo-front`, `poupe-certo-back`)

**Performance Goals**: página "Meus produtos" utilizável < 2s em 4G; contador do menu não bloqueia render

**Constraints**: sem rolagem horizontal 320–1920px; barra inferior mobile inalterada; contador de pendentes não pode gerar request por navegação (cache TanStack Query, `staleTime` global)

**Scale/Scope**: poucos produtos por pessoa (dezenas); 1 endpoint novo, 1 campo novo; ~6 arquivos novos no front

## Constitution Check

| Princípio | Status | Nota |
|---|---|---|
| I. Stack declarada | PASS | `project.config.json` preset `prisma-postgres` + desvio supabase-auth documentado. Skill prisma elegível (back). |
| II. Zod na borda | PASS | Query `status/page/pageSize` validada com Zod no back (`ZodValidationPipe`); resposta parseada com Zod no front. |
| III. Autorização no servidor | PASS | Filtro `createdBy = user.id` no service **e** RLS `products_select_own` via `asUser`. Item "Admin" escondido no front é só UX; `OperatorGuard` segue protegendo `/moderation/*`. |
| IV. RLS | PASS | Nenhuma tabela nova; leitura reusa policies existentes. |
| V. Segurança antes do review | APLICA | Toca dado de usuário (lista própria) e expõe `isOperator` → `/security` antes do `/review`. |
| VI. YAGNI | PASS | Sem motivo de rejeição, sem endpoint de contagem separado (contagens vêm junto na listagem), sem migration. |
| VII. Rastreabilidade | PASS | spec/plan/research/data-model/contracts/quickstart/tasks neste diretório. |

Re-check pós-design: PASS (nenhuma violação introduzida).

## Project Structure

### Documentation (this feature)

```text
specs/006-meus-produtos-sidebar/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── users-me-products.md
└── tasks.md
```

### Source Code

```text
poupe-certo-back/
├── src/users/
│   ├── dto/my-products-query.schema.ts      # NOVO — Zod status/page/pageSize
│   ├── dto/my-products.dto.ts               # NOVO — Swagger DTO da resposta
│   ├── users.controller.ts                  # + GET me/products
│   └── users.service.ts                     # + getMyProducts, findMe devolve isOperator
├── src/users/dto/my-products-query.schema.spec.ts  # NOVO — unit
└── test/users-stats.e2e-spec.ts             # + 401 / 400 do endpoint novo

poupe-certo-front/
├── src/components/sidebar/
│   ├── sidebar.tsx                          # NOVO — rail + drawer genéricos (extraído do AdminSidebar)
│   └── app-sidebar.tsx                      # NOVO — itens do app, contador, item Admin
├── src/components/admin/admin-sidebar.tsx   # passa a usar sidebar.tsx
├── src/components/site-header.tsx           # + botão menu (mobile), − ícone Minha Lista
├── src/stores/sidebar-store.ts              # NOVO — collapsed persistido + mobileOpen (substitui admin-sidebar-store)
├── src/app/(shell)/layout.tsx               # layout em linha: sidebar + coluna
├── src/app/(shell)/my-products/page.tsx     # NOVO
├── src/lib/api/users.ts                     # + isOperator, getMyProducts
├── src/hooks/use-my-products.ts             # NOVO — infinite query + contador pendentes
├── tests/unit/lib/…                         # schema do endpoint novo
└── tests/e2e/my-products.spec.ts, sidebar.spec.ts (+ mock-backend)
```

**Structure Decision**: dois repos existentes; back ganha só código no módulo
`users` (dado "meu"), front ganha pasta `components/sidebar/` compartilhada
entre shell e admin.

## Complexity Tracking

Nenhuma violação.
