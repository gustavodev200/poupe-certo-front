---

description: "Task list template for feature implementation"
---

# Tasks: Minha Lista (lista de compras pessoal)

**Input**: Design documents from `specs/004-lista-compras/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Não solicitados explicitamente na spec — cobertura automatizada
fica para a fase `/test` do workspace (depois do `/speckit-implement`),
conforme `.specify/memory/constitution.md` Princípio VII.

**Organization**: Tasks agrupadas por user story (US1/US2/US3, spec.md).
Caminhos com prefixo `poupe-certo-back/` referem-se ao repo-irmão
(`E:\projetos\poupe-certo\poupe-certo-back`); os demais são relativos a este
repo (`poupe-certo-front`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1, US2 ou US3 (spec.md)

---

## Phase 1: Setup

- [ ] T001 Confirmar `poupe-certo-back` rodando localmente (`npm run start:dev`) e `poupe-certo-front` com `NEXT_PUBLIC_API_URL` apontando pra ele — nenhuma dependência nova a instalar em nenhum dos dois repos (reaproveita zod/react-query/prisma já presentes)

**Checkpoint**: ambiente pronto, nenhum código alterado ainda.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tabela nova com RLS + módulo Nest vazio — bloqueia as três user stories (todas leem/escrevem `shopping_list_items`).

- [ ] T002 Adicionar `model ShoppingListItem` a `poupe-certo-back/prisma/schema.prisma` (campos e relations conforme `data-model.md`) e o `shoppingListItems ShoppingListItem[]` correspondente em `Profile`, `Product` e `Market`
- [ ] T003 Criar migration `poupe-certo-back/prisma/migrations/<timestamp>_shopping_list/migration.sql`: tabela `shopping_list_items` (+ `CHECK (price > 0)`, `UNIQUE (user_id, product_ean)`), RLS `FOR ALL TO authenticated USING/WITH CHECK (user_id = auth.uid())`, `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` — sem policy pública (ver data-model.md); rodar `npx prisma migrate dev` no back para aplicar e regenerar o client (depende de T002)
- [ ] T004 [P] Criar esqueleto do módulo `poupe-certo-back/src/shopping-list/` (`shopping-list.module.ts` importando `AuthModule`, `shopping-list.controller.ts` e `shopping-list.service.ts` vazios, `dto/shopping-list.schema.ts` vazio) — mesmo padrão de `src/markets/` (depende de T003 pro client Prisma existir)
- [ ] T005 Registrar `ShoppingListModule` em `poupe-certo-back/src/app.module.ts` (depende de T004)

**Checkpoint**: banco e módulo prontos; nenhum endpoint funcional ainda.

---

## Phase 3: User Story 1 - Adicionar produto à lista (Priority: P1) 🎯 MVP

**Goal**: Pessoa logada adiciona um produto à lista a partir da página do produto e vê o item em "Minha Lista", com o preço/mercado do momento em que foi adicionado.

**Independent Test**: Abrir a página de um produto com oferta ativa, clicar em "Adicionar à lista", abrir "Minha Lista" e confirmar que o item aparece com o preço/mercado vistos na página do produto (quickstart.md Cenário 1).

### Implementation for User Story 1

- [ ] T006 [P] [US1] Extrair um helper `getBestActiveOffer(tx, ean)` reaproveitando a lógica de `latestActivePerMarket` + menor preço já existente em `poupe-certo-back/src/products/products.service.ts` (exportar a função ou movê-la pra um arquivo compartilhado, ver research.md#4) — retorna `{ marketId, price } | null`
- [ ] T007 [US1] Implementar `addToListSchema` (`{ productEan: string }`, reaproveitando `eanSchema` de `products/dto/product.schema.ts`) em `poupe-certo-back/src/shopping-list/dto/shopping-list.schema.ts` (depende de T004)
- [ ] T008 [US1] Implementar `ShoppingListService.add(userId, productEan)` em `poupe-certo-back/src/shopping-list/shopping-list.service.ts`: `asUser`, valida produto aprovado, chama `getBestActiveOffer` (404 `"Produto sem oferta ativa para adicionar à lista"` se `null`), `upsert` por `(userId, productEan)` com `update: {}` (idempotente, ver research.md#2) (depende de T006, T007)
- [ ] T009 [US1] Implementar `ShoppingListService.list(userId)` no mesmo arquivo: `asUser`, `findMany` ordenado por `purchased asc, createdAt desc`, incluindo `product` (`ean,name,brand,qty`) e `market` (`id,name`) (depende de T004)
- [ ] T010 [US1] Implementar `ShoppingListController` (`GET /me/list`, `POST /me/list`) em `poupe-certo-back/src/shopping-list/shopping-list.controller.ts` — `SupabaseJwtGuard` nas duas, `WriteThrottle` no POST, `ZodValidationPipe(addToListSchema)` no body (depende de T008, T009)
- [ ] T011 [P] [US1] Criar `poupe-certo-front/src/lib/api/shopping-list.ts`: `shoppingListItemSchema` (Zod), `getShoppingList()`, `addToList(productEan)`
- [ ] T012 [US1] Criar `poupe-certo-front/src/hooks/use-shopping-list.ts`: `useShoppingList()` (`queryKey: ["shopping-list"]`) e `useAddToList()` (invalida `["shopping-list"]` no sucesso) (depende de T011)
- [ ] T013 [US1] Criar `poupe-certo-front/src/app/(shell)/list/list-view.tsx`: client component que lista os itens (nome/qty/marca do produto, preço, mercado) e estado vazio convidando a escanear/buscar um produto (quickstart.md Cenário 5) — sem checkbox/remover ainda (depende de T012)
- [ ] T014 [US1] Criar `poupe-certo-front/src/app/(shell)/list/page.tsx` — rota fina delegando a `ListView` (depende de T013)
- [ ] T015 [P] [US1] Adicionar entrada "Minha Lista" em `poupe-certo-front/src/components/mobile-action-bar.tsx`
- [ ] T016 [P] [US1] Adicionar entrada "Minha Lista" em `poupe-certo-front/src/components/site-header.tsx`
- [ ] T017 [US1] Em `poupe-certo-front/src/app/(shell)/product/[ean]/product-view.tsx`: remover o `useState` de `favorite`/botão coração (stub sem persistência, FR-008); trocar o `onClick` do botão "Adicionar à lista" (hoje só `toast.success`) por `useAddToList()`; usar `useShoppingList()` pra saber se `product.ean` já está na lista e refletir isso no botão (desabilitado/"Já está na lista", FR-009) (depende de T012)

**Checkpoint**: US1 funcional de ponta a ponta — quickstart.md Cenário 1 deve passar.

---

## Phase 4: User Story 2 - Marcar item como comprado (Priority: P2)

**Goal**: Na tela "Minha Lista", marcar/desmarcar um item como comprado sem removê-lo.

**Independent Test**: Com um item pendente em "Minha Lista", marcar o checkbox e confirmar que ele aparece riscado mas continua na lista; desmarcar e confirmar que volta ao normal (quickstart.md Cenário 2).

### Implementation for User Story 2

- [ ] T018 [US2] Implementar `toggleListItemSchema` (`{ purchased: boolean }`) em `poupe-certo-back/src/shopping-list/dto/shopping-list.schema.ts` (depende de T004)
- [ ] T019 [US2] Implementar `ShoppingListService.setPurchased(userId, id, purchased)` em `shopping-list.service.ts`: `asUser`, `update({ where: { id, userId }, data: { purchased } })` — capturar `Prisma.PrismaClientKnownRequestError` código `P2025` e relançar `NotFoundException` (mesmo padrão de tratamento de erro Prisma de `products.service.ts#create`) (depende de T009)
- [ ] T020 [US2] Implementar `PATCH /me/list/:id` no controller, `ZodValidationPipe(toggleListItemSchema)` no body, `uuidParamSchema` no param (mesmo padrão de `price-reports.controller.ts#confirm`) (depende de T018, T019)
- [ ] T021 [US2] Adicionar `toggleListItem(id, purchased)` a `poupe-certo-front/src/lib/api/shopping-list.ts` (depende de T011)
- [ ] T022 [US2] Adicionar `useToggleListItem()` a `use-shopping-list.ts` (invalida `["shopping-list"]`) (depende de T021)
- [ ] T023 [US2] Em `list-view.tsx`, adicionar checkbox por item com estilo riscado quando `purchased` (depende de T013, T022)

**Checkpoint**: US1 + US2 funcionais — quickstart.md Cenários 1 e 2 devem passar.

---

## Phase 5: User Story 3 - Remover item da lista (Priority: P3)

**Goal**: Remover definitivamente um item (comprado ou pendente) de "Minha Lista".

**Independent Test**: Com um item em "Minha Lista", removê-lo e confirmar que some imediatamente e não retorna após recarregar a página (quickstart.md Cenário 3).

### Implementation for User Story 3

- [ ] T024 [US3] Implementar `ShoppingListService.remove(userId, id)` em `shopping-list.service.ts`: `asUser`, `delete({ where: { id, userId } })` — mesmo tratamento de `P2025` → `NotFoundException` de T019 (depende de T009)
- [ ] T025 [US3] Implementar `DELETE /me/list/:id` no controller, `@HttpCode(204)`, `SupabaseJwtGuard` + `WriteThrottle` (depende de T024)
- [ ] T026 [US3] Adicionar `removeFromList(id)` a `poupe-certo-front/src/lib/api/shopping-list.ts` (depende de T011)
- [ ] T027 [US3] Adicionar `useRemoveListItem()` a `use-shopping-list.ts` (invalida `["shopping-list"]`) (depende de T026)
- [ ] T028 [US3] Em `list-view.tsx`, adicionar botão de remover por item (depende de T013, T027)

**Checkpoint**: as três user stories funcionando de forma independente e integrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T029 [P] Rodar suíte e2e existente do back (`npm run test:e2e` em `poupe-certo-back`) para confirmar que nada quebrou em `products`/`price-reports`
- [ ] T030 [P] Rodar `npm test` (vitest) em `poupe-certo-front`
- [ ] T031 Buscar outros usos de `Heart`/`favorite` órfãos após a remoção do stub em `product-view.tsx` (`grep -rn "favorite" src/` em `poupe-certo-front`) — remover import/ícone não usado (YAGNI, Princípio VI)
- [ ] T032 Executar manualmente quickstart.md Cenários 1–5 de ponta a ponta, incluindo o Cenário 4 (isolamento entre contas — tentar `PATCH`/`DELETE` no item de outra conta via curl/Postman e confirmar 404)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende do Setup — bloqueia US1, US2 e US3 (tabela `shopping_list_items` não existe antes)
- **US1 (Phase 3)**: depende do Foundational
- **US2 (Phase 4)**: depende do Foundational; a parte de frontend (T023) depende também de US1 (T013, `list-view.tsx` já existir) — a parte de backend (T018–T020) pode ser feita em paralelo com US1
- **US3 (Phase 5)**: mesma relação de US2 — backend (T024–T025) paralelo a US1; frontend (T028) depende de T013
- **Polish (Phase 6)**: depende de US1, US2 e US3 completas

### Parallel Opportunities

- T004 (Foundational) já é `[P]` internamente (module/controller/service/dto são arquivos novos e distintos)
- Dentro de US1: T006 e T007 em paralelo; T008 depende de T006+T007; T009 pode rodar em paralelo com T006–T008 (métodos diferentes do mesmo service, sem conflito de lógica); T010 depende de T008+T009; T011 em paralelo com todo o backend de US1; T012 depende de T011; T013 depende de T012; T014 depende de T013; T015/T016 em paralelo entre si e com o resto; T017 depende de T012
- Dentro de US2: T018 e T019 podem ser feitos em sequência no mesmo arquivo; T020 depende dos dois; T021 depende de T011 (já pronto desde US1); T022 depende de T021; T023 depende de T013+T022
- Dentro de US3: mesma forma de US2 (T024→T025; T026→T027→T028)
- T029/T030/T031 (Polish) em paralelo entre si

---

## Implementation Strategy

### MVP mínimo

A spec já prioriza US1 como P1 isolado (P2 e P3 são incrementos independentes,
diferente da feature 003 onde duas stories dividiam P1). MVP real é só US1:

1. Setup + Foundational (T001–T005)
2. US1 completa (T006–T017) → validar quickstart.md Cenário 1
3. **PARAR e VALIDAR** — já é uma lista de compras utilizável (só falta marcar/remover)
4. US2 (T018–T023) → validar Cenário 2
5. US3 (T024–T028) → validar Cenário 3
6. Polish (T029–T032)

### Entrega incremental

Cada checkpoint de fase é um ponto seguro para revisar/demonstrar antes de
seguir para a próxima. Depois de T032, seguir o fluxo do workspace:
`/test` → `/security` (Princípio V — feature cria tabela nova de dado de
usuário) → `/review`.
