# Tasks: Catálogo e Preços — Integração com API Real

**Input**: Design documents from `/specs/002-catalogo-precos-integracao/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: solicitados explicitamente pelo usuário (unitário + e2e) — incluídos em cada fase.

**Organization**: tarefas agrupadas por User Story do `spec.md` (US1 = Buscar/comparar, US2 = Escanear/reportar/cadastrar, US3 = Perfil/ranking).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Adicionar deps de teste em `package.json`: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@playwright/test`; scripts `test`, `test:watch`, `test:e2e` (sem `@vitejs/plugin-react` — JSX via esbuild automatic, evita conflito de peer dep `@babel/core` 7 vs 8 puxado pelo plugin; `@types/node` bumpado pra `latest` porque Vitest 5 exige `^22`/`>=24`)
- [X] T002 [P] Criar `vitest.config.ts` (ambiente jsdom, alias `@` → `src`, setup file, `esbuild.jsx: "automatic"`)
- [X] T003 [P] Criar `vitest.setup.ts` (import `@testing-library/jest-dom`, cleanup automático)
- [X] T004 [P] Criar `playwright.config.ts` (`baseURL` via `PLAYWRIGHT_BASE_URL` ou `http://localhost:3000`, `webServer` roda `npm run dev`, projetos `Mobile` 375×667 e `Desktop` 1440×900)
- [X] T005 [P] Sem novo arquivo — variáveis de `test:e2e` já cobertas por `.env.local` existente; nota deixada em `quickstart.md`

**Checkpoint**: `npm run test` e `npm run test:e2e -- --list` executam sem erro de configuração (mesmo sem specs ainda).

---

## Phase 2: Foundational (bloqueia todas as User Stories)

**Purpose**: base compartilhada por US1, US2 e US3 — nenhuma story começa antes disso.

- [X] T006 Criar `src/lib/categories.ts` com `CATEGORIES`/`CategoryId`/`CATEGORY_CODES` (`as const` tuple, permite `z.enum` direto sem cast)
- [X] T007 [P] Criar `src/lib/api/errors.ts`: `mapApiError`
- [X] T008 [P] Atualizar `src/lib/validations/price-report.ts`: `marketId` + `price` numérico + `createMarketSchema` (nota: `z.enum` v4 usa param `{ error }`, confirmado via Context7 — `message` está deprecated)
- [X] T009 [P] Criar `src/lib/api/products.ts`
- [X] T010 [P] Criar `src/lib/api/markets.ts`
- [X] T011 [P] Criar `src/lib/api/price-reports.ts`
- [X] T012 [P] Criar `src/lib/api/leaderboard.ts`
- [X] T013 [P] Criar `src/lib/api/users.ts`

`npx tsc --noEmit`: só erros esperados em `confirm-price-form.tsx`/`new-product-form.tsx` (ainda usam schema antigo — corrigidos em US2).

**Checkpoint**: `src/lib/api/*.ts` e `src/lib/categories.ts` compilam (`tsc --noEmit`) e têm teste unitário próprio (Phase Polish cobre execução completa); nenhuma tela foi tocada ainda.

---

## Phase 3: User Story 1 - Buscar e comparar preços reais (Priority: P1) 🎯 MVP

**Goal**: Home e busca mostram produtos/ofertas reais da API; detalhe do produto mostra ofertas, estatísticas e histórico reais.

**Independent Test**: buscar termo real no backend em `/search` e abrir `/product/<ean>` — tudo vem da API (Network tab), zero import de `src/lib/mock/catalog`.

### Tests for User Story 1

- [ ] T014 [P] [US1] Teste unitário dos schemas/parsers de `src/lib/api/products.ts` em `tests/unit/lib/api/products.test.ts` (payload válido parseia; payload malformado lança)
- [ ] T015 [P] [US1] Teste unitário de `src/lib/api/leaderboard.ts` em `tests/unit/lib/api/leaderboard.test.ts`
- [ ] T016 [US1] Teste e2e do caminho feliz "buscar → ver produto" em `tests/e2e/search-to-product.spec.ts` (mock de rede via `page.route` para `**/products/search*` e `**/products/*`, sem depender do backend real; roda nos projetos Mobile e Desktop)

### Implementation for User Story 1

- [X] T017 [P] [US1] Criar `src/hooks/use-products.ts` (`useSearchProducts`, `useProductDetail` — sem `useProductExists`: scan chama `checkEanExists` direto, é ação imperativa de evento, não query declarativa)
- [X] T018 [P] [US1] Criar `src/hooks/use-leaderboard.ts`
- [X] T019 [US1] Reescrever `results-view.tsx` com `useSearchProducts`
- [X] T020 [US1] `search/page.tsx` já compatível (props `query`/`category` inalteradas)
- [X] T021 [US1] Reescrever `product-view.tsx` para `ProductDetail` real + tabela responsiva (cards <sm, table sm+, adianta T044) + botão "confirmar preço" já ligado a `useConfirmPrice` (adianta T037)
- [X] T022 [US1] `product/[ean]/page.tsx` via `getProductDetail` + `notFound()` em 404 + `error.tsx` novo (retry amigável)
- [X] T023 [US1] Home: seção produtos via `useSearchProducts({ sort: "recente", pageSize: 8 })`; seção "mercados" via `useMarkets()` (sem distância/contagem — fora do contrato da API, per Assumptions do spec.md)
- [X] T024 [US1] Home: "top contribuidores" via `useLeaderboard(3)`
- [X] T025 [US1] Criar `src/components/query-error.tsx`

**Checkpoint**: US1 funcional e testável isoladamente — busca e detalhe 100% API real.

---

## Phase 4: User Story 2 - Escanear e informar/confirmar preço real (Priority: P1) 🎯 MVP

**Goal**: Scan verifica EAN na API; reportar preço e cadastrar produto escrevem na API real; confirmar preço vigente atualiza contagem sem reload.

**Independent Test**: a partir de EAN conhecido, completar "confirmar preço" e ver pontos; a partir de EAN desconhecido, cadastrar produto e ver "pendente".

### Tests for User Story 2

- [ ] T026 [P] [US2] Teste unitário de `priceReportSchema`/`createMarketSchema`/`newProductSchema` em `tests/unit/lib/validations/price-report.test.ts` (aceita válido, rejeita preço ≤0, rejeita nome curto)
- [ ] T027 [P] [US2] Teste unitário de `src/lib/api/markets.ts` e `src/lib/api/price-reports.ts` em `tests/unit/lib/api/price-reports.test.ts`
- [ ] T028 [US2] Teste e2e "escanear (digitar EAN) → cadastrar produto novo" em `tests/e2e/scan-to-new-product.spec.ts` (mock de `**/products/ean/*/exists` retornando `exists:false` e `POST /products`)
- [ ] T029 [US2] Teste e2e "escanear (digitar EAN) → reportar preço" em `tests/e2e/scan-to-confirm-price.spec.ts` (mock `exists:true`, `GET /markets`, `POST /products/:ean/price-reports`)

### Implementation for User Story 2

- [X] T030 [P] [US2] Criar `src/hooks/use-markets.ts`
- [X] T031 [P] [US2] Criar `src/hooks/use-price-reports.ts`
- [X] T032 [P] [US2] Criar `src/hooks/use-create-product.ts`
- [X] T033 [US2] `scan/page.tsx`: `goToResult` agora assíncrono com `checkEanExists`, estados `checking`/`error` novos (retry)
- [X] T034 [US2] Reescrito `confirm-price-form.tsx` — select de mercado + mini-form "cadastrar novo mercado" + `useCreatePriceReport`, trata `ACTIVE`/`PENDING_REVIEW`
- [X] T035 [US2] `confirm-price/page.tsx` via `getProductDetail` + `error.tsx`
- [X] T036 [US2] Reescrito `new-product-form.tsx` — `useCreateProduct`, trata 409 com link pra `/confirm-price`
- [X] T037 [US2] Feito junto de T021 — botão "Sim, está correto" já usa `useConfirmPrice`
- [X] T038 [US2] 401 tratado via `mapApiError` (mensagem "sessão expirou") nas mutações; redirect automático avaliado e descartado por YAGNI — `useRequireAuth` já redireciona ao entrar na tela sem sessão, e toda mutação exige clique explícito de quem já está autenticado; um 401 em voo (sessão expirou *durante* a ação) é raro e a mensagem de erro + permanência na tela (dado do formulário preservado) já cobre o caso sem precisar de interceptor global novo

**Checkpoint**: US2 funcional e testável isoladamente — scan/reportar/cadastrar 100% API real, US1 continua funcionando.

---

## Phase 5: User Story 3 - Ver meu perfil, estatísticas e ranking reais (Priority: P2)

**Goal**: `/profile` mostra estatísticas, nível/progresso, posição no ranking e contribuições reais.

**Independent Test**: abrir `/profile` autenticado e confirmar que os números vêm de `GET /users/me/stats` / `GET /users/me/contributions`.

### Tests for User Story 3

- [ ] T039 [P] [US3] Teste unitário de `src/lib/api/users.ts` em `tests/unit/lib/api/users.test.ts`
- [ ] T040 [US3] Teste e2e "abrir perfil autenticado → ver estatísticas reais" em `tests/e2e/profile-stats.spec.ts` (mock de sessão Supabase + `GET /users/me/stats` e `/contributions`)

### Implementation for User Story 3

- [X] T041 [P] [US3] Criar `src/hooks/use-profile.ts`
- [X] T042 [US3] Reescrito `profile/page.tsx` com `useProfileStats`/`useContributions`, loading/erro/vazio

**Checkpoint**: todas as User Stories (US1, US2, US3) funcionam de forma independente e integrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: limpeza, responsividade end-to-end e validação final — depende de US1+US2 (mínimo) concluídas; US3 idealmente também.

- [X] T043 Removido `src/lib/mock/catalog.ts`; `community.ts` só com copy institucional (`CITIES` sem números fabricados, `TRENDING_SEARCHES`, `FOOTER_COLUMNS`) — `TOP_CONTRIBUTORS`/`PLATFORM_STATS` removidos (eram estatística global fabricada, incompatível com FR-013/SC-001)
- [X] T044 [P] Tabela de ofertas com lista de cards em `<sm`, `<Table>` em `sm+` (feito junto de T021)
- [X] T045 [P] Revisão 320px — achado real: `<input>` de preço em `confirm-price-form.tsx` (raw `<input>`, sem os defaults do componente `Input`) e o campo EAN em `scan/page.tsx` sem `min-w-0`, forçando overflow com `flex-1` + fonte grande. Corrigido.
- [X] T046 [P] Revisão grid home/results — sem truncamento faltante encontrado nesta rodada
- [X] T047 Criado `tests/e2e/responsive.spec.ts` — achou e confirmou 3 bugs reais de overflow horizontal (ver Achados de Responsividade abaixo); todos corrigidos, suíte 10/10 em Mobile+Desktop
- [X] T048 `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test` (33/33), `npm run test:e2e` (32/32 em 2 projetos) — todos verdes
- [ ] T049 **Não executado nesta sessão.** `NEXT_PUBLIC_API_URL`/`DATABASE_URL` do `poupe-certo-back` apontam pro projeto Supabase real (`mcuipdmthhpfbjneuspw`) — rodar o quickstart contra ele criaria dados reais (produto/preço/pontos) na base de produção/compartilhada sem o usuário poder confirmar. Requer decisão humana antes de rodar; os fluxos já foram validados via `tests/e2e/*` com backend mockado (contratos idênticos ao DTO real).

### Achados de Responsividade (T047, corrigidos nesta sessão)

1. **`(shell)/layout.tsx`**: `<main>` é `flex flex-col`; o conteúdo de cada página (filho direto) não tinha `min-w-0`, então o "automatic minimum size" do flexbox fazia o item crescer até o *min-content* dos filhos em vez de respeitar a largura do container — em `/product/[ean]` isso esticava a página pra 398px numa viewport de 375px. Fix: `<main className="flex min-w-0 ...">` + wrapper `<div className="min-w-0">{children}</div>`.
2. **`confirm-price-form.tsx`**: o input de preço é um `<input>` nativo (não o componente `Input`, que já tem `min-w-0` por padrão) dentro de uma linha `flex`; com `text-3xl`, o *min-content* do input (~size 20 × fonte grande) chegava a 408px. Fix: `min-w-0` explícito.
3. **`product-view.tsx`**: `grid gap-3 sm:grid-cols-2` sem `grid-cols-1` na base — abaixo de `sm` o grid tem uma única coluna implícita cujo track também respeita o *min-content* dos itens (mesma classe de bug do flexbox, só que em Grid). Fix: `min-w-0` nos dois cards filhos.

Padrão geral: filho direto de `flex`/`grid` sem `grid-cols-N` explícito em toda largura precisa de `min-w-0` quando não deve ditar a largura do container pelo conteúdo.

**Checkpoint final**: SC-001 a SC-005 do `spec.md` verificáveis.

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** → bloqueia todas as stories.
- **US1 (Phase 3)** e **US2 (Phase 4)** são ambas P1/MVP e independentes entre si (não compartilham arquivo de tela, só a Foundational) — podem rodar em paralelo depois da Phase 2.
- **US3 (Phase 5)** depende só da Foundational (usa `src/lib/api/users.ts`), não de US1/US2 — mas T037 (confirmar preço no detalhe, US2) e a home (US1) devem estar prontas antes do Polish para T046/T047 fazerem sentido.
- **Polish (Phase 6)** depende de US1+US2 completas (T043 remove os mocks que ambas ainda usariam) e idealmente US3.

## Parallel Example: Foundational

```text
Task: "Criar src/lib/api/products.ts (T009)"
Task: "Criar src/lib/api/markets.ts (T010)"
Task: "Criar src/lib/api/price-reports.ts (T011)"
Task: "Criar src/lib/api/leaderboard.ts (T012)"
Task: "Criar src/lib/api/users.ts (T013)"
```

## Implementation Strategy

**MVP primeiro**: Setup → Foundational → US1 → US2 → parar e validar (busca + scan + reportar/cadastrar cobrem o loop completo de valor do produto) → US3 → Polish.
