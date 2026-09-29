---

description: "Task list for 006 Meus produtos + navegação lateral"
---

# Tasks: Meus produtos + navegação lateral

**Input**: Design documents from `specs/006-meus-produtos-sidebar/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/users-me-products.md

**Tests**: incluídos — SC-002/SC-005 pedem verificação automatizada e o projeto já tem Vitest/Playwright/Jest.

Caminhos: `back/` = `poupe-certo-back/`, `front/` = `poupe-certo-front/`.

## Phase 1: Setup

- [X] T001 Criar branch `006-meus-produtos-sidebar` nos dois repos a partir de `main`

## Phase 2: Foundational (bloqueia US1 e US2)

- [X] T002 [P] Criar `myProductsQuerySchema` (status opcional enum, page ≥1 default 1, pageSize 1–50 default 20) em back/src/users/dto/my-products-query.schema.ts
- [X] T003 [P] Teste unit do schema (defaults, status inválido, pageSize > 50) em back/src/users/dto/my-products-query.schema.spec.ts
- [X] T004 Implementar `UsersService.getMyProducts(userId, query)` via `asUser` com `where createdBy` + filtro status, `orderBy createdAt desc, ean asc`, `count` e `groupBy status` → `{items,page,pageSize,total,counts}` em back/src/users/users.service.ts
- [X] T005 Adicionar `GET me/products` (Swagger DTO + `ZodValidationPipe`) em back/src/users/users.controller.ts e back/src/users/dto/my-products.dto.ts
- [X] T006 `findMe` passa a selecionar e devolver `isOperator` em back/src/users/users.service.ts
- [X] T007 e2e: 401 sem token em `/users/me/products` em back/test/users-stats.e2e-spec.ts
- [X] T008 [P] Front: `profileSchema` ganha `isOperator`; `myProductsResultSchema` + `getMyProducts(params)` em front/src/lib/api/users.ts
- [X] T009 [P] Teste unit dos schemas novos em front/tests/unit/lib/my-products-schema.test.ts
- [X] T010 [P] Mock backend: `GET /users/me/products` (filtra por status, pagina, counts) e `isOperator` em `/users/me` em front/tests/e2e/fixtures/mock-backend.ts

## Phase 3: User Story 1 — Acompanhar produtos que cadastrei (P1) 🎯 MVP

**Goal**: página `/my-products` com abas Pendentes/Aprovados/Rejeitados.

**Independent Test**: logado, abrir `/my-products` → ver itens por aba, contadores, "Carregar mais", aprovado linka para `/product/<ean>`.

- [X] T011 [US1] Hooks `useMyProducts(status)` (useInfiniteQuery) e `usePendingProductsCount()` (pageSize 1, `enabled: !!session`) em front/src/hooks/use-my-products.ts
- [X] T012 [US1] Página com `useRequireAuth("/my-products")`, abas com contagem, cards (foto/placeholder, nome truncado, marca·qty, EAN, datas), link só se APPROVED, estado vazio com CTA escanear, erro com retry, "Carregar mais" em front/src/app/(shell)/my-products/page.tsx
- [X] T013 [US1] Invalidar `["users","me","products"]` após criar produto em front/src/hooks/use-create-product.ts
- [X] T014 [US1] e2e: abas, link aprovado, estado vazio, redirect login anônimo em front/tests/e2e/my-products.spec.ts

## Phase 4: User Story 2 — Navegar por menu lateral (P2)

**Goal**: sidebar colapsável (md+) / gaveta (mobile) com todos os destinos.

**Independent Test**: desktop mostra rail com itens + ativo destacado + recolher persiste; mobile abre gaveta pelo botão do header e fecha ao navegar.

- [X] T015 [US2] Store factory `createSidebarStore(name)` (persist só `collapsed`; `mobileOpen` efêmero) exportando `useAppSidebarStore` e `useAdminSidebarStore`; remover front/src/stores/admin-sidebar-store.ts — em front/src/stores/sidebar-store.ts
- [X] T016 [US2] Componente genérico `Sidebar` (rail + drawer radix, `items` com `badge`, `brand`, `footer`, ativo por prefixo de rota) extraído de admin-sidebar em front/src/components/sidebar/sidebar.tsx
- [X] T017 [US2] `AdminSidebar` refeito sobre `Sidebar` mantendo topbar mobile própria em front/src/components/admin/admin-sidebar.tsx
- [X] T018 [US2] `AppSidebar`: itens Início/Buscar/Escanear/Minha Lista/Meus produtos(badge pendentes, 99+)/Perfil + Admin se `isOperator` em front/src/components/sidebar/app-sidebar.tsx
- [X] T019 [US2] Shell layout em linha (sidebar + coluna `min-w-0 flex-1`) em front/src/app/(shell)/layout.tsx
- [X] T020 [US2] Botão menu `md:hidden` no header abrindo a gaveta em front/src/components/site-header.tsx
- [X] T021 [US2] e2e: rail desktop, recolher persiste, gaveta mobile, badge, Admin só operador em front/tests/e2e/sidebar.spec.ts

## Phase 5: User Story 3 — Topo mais enxuto (P3)

- [X] T022 [US3] Remover ícone "Minha Lista" do header (mantém Escanear/tema/avatar) em front/src/components/site-header.tsx
- [X] T023 [US3] Incluir `/my-products` e rail/gaveta no teste de overflow 320–1920 em front/tests/e2e/responsive.spec.ts

## Phase 6: Polish

- [X] T024 Rodar lint + build + vitest + playwright no front; lint + unit + e2e + build no back; corrigir quebras da suíte existente
- [X] T025 Verificação visual (screenshots 320/375/768/1280/1920) do shell, `/my-products`, `/admin`

## Dependencies

- Phase 2 → US1 e US2. US1 e US2 independentes entre si (US2 usa `usePendingProductsCount` de T011 — se US2 vier antes, criar o hook em T018).
- US3 depende de US2 (menu precisa existir antes de remover atalho).

## Parallel Examples

- Phase 2: T002/T003 (back) ∥ T008/T009/T010 (front).
- US2: T016 ∥ T015; T017 e T018 depois de T016.

## Implementation Strategy

MVP = Phase 2 + US1 (página acessível por URL). Depois US2 (menu), US3 (limpeza), Polish.
