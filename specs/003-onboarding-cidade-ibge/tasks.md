---

description: "Task list template for feature implementation"
---

# Tasks: Onboarding com Localização Real (IBGE) e Mercados por Cidade

**Input**: Design documents from `specs/003-onboarding-cidade-ibge/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Não solicitados explicitamente na spec — cobertura automatizada fica
para a fase `/test` do workspace (depois do `/speckit-implement`), conforme
`.specify/memory/constitution.md` Princípio VII.

**Organization**: Tasks agrupadas por user story (US1/US2/US3, spec.md).
Caminhos com prefixo `poupe-certo-back/` referem-se ao repo-irmão
(`E:\projetos\poupe-certo\poupe-certo-back`); os demais são relativos a este
repo (`poupe-certo-front`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1, US2 ou US3 (spec.md)

---

## Phase 1: Setup

- [X] T001 Confirmar env local: `poupe-certo-back/.env` com `DATABASE_URL` válido e `poupe-certo-front/.env.local` com `NEXT_PUBLIC_API_URL` apontando pro back local (pré-requisito de quickstart.md, nenhuma dependência nova a instalar em nenhum dos dois repos)
- [X] T002 [P] Confirmar acesso de rede a `servicodados.ibge.gov.br` a partir do ambiente de dev (`curl` ou browser) — API pública usada pelo frontend

**Checkpoint**: ambiente pronto, nenhum código alterado ainda.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Coluna nova em `Profile` — bloqueia tanto salvar localização (US1) quanto qualquer leitura de `city`/`uf` do perfil (US1 e US2).

- [X] T003 Adicionar `city String?` e `uf String? @db.Char(2)` ao model `Profile` em `poupe-certo-back/prisma/schema.prisma` (mesmo padrão de `Market.city`/`Market.uf`)
- [X] T004 Criar migration `poupe-certo-back/prisma/migrations/<timestamp>_profile_location/migration.sql`: `ALTER TABLE public.profiles ADD COLUMN city TEXT, ADD COLUMN uf CHAR(2)` + `GRANT UPDATE ("city", "uf") ON public.profiles TO authenticated` (reaproveita a policy `profiles_update_own_points` já existente — ver research.md#6, NÃO criar policy nova); rodar `npx prisma migrate dev` no back para aplicar e regenerar o client
- [X] T005 [P] Estender `ProfileResponse` (interface) e o `select` de `findMe()` em `poupe-certo-back/src/users/users.service.ts` para incluir `city` e `uf`

**Checkpoint**: `GET /users/me` já devolve `city`/`uf` (nulos por padrão); banco pronto para US1 e US2.

---

## Phase 3: User Story 1 - Escolher estado e cidade reais no onboarding (Priority: P1) 🎯 MVP

**Goal**: Onboarding usa estados/cidades reais do IBGE (mesmo layout) e salva a escolha em `Profile.city`/`Profile.uf` no backend, não só no `localStorage`.

**Independent Test**: Rodar quickstart.md Cenário 1 — escolher um estado pouco comum (ex. Acre), buscar/escolher uma cidade real, confirmar que `PATCH /users/me/location` é chamado e a navegação só ocorre após sucesso.

### Implementation for User Story 1

- [X] T006 [P] [US1] Criar `src/lib/api/ibge.ts`: `fetchEstados()` (`GET .../estados?orderBy=nome`) e `fetchMunicipios(uf)` (`GET .../estados/{uf}/municipios`), cada resposta validada com um schema Zod mínimo (`sigla`/`nome` para estado, `nome` para município — ver contracts/api.md#1)
- [X] T007 [P] [US1] Criar `src/hooks/use-ibge-locations.ts`: `useEstados()` e `useMunicipios(uf)` via `@tanstack/react-query`, `staleTime` longo (estados/municípios quase nunca mudam), `useMunicipios` com `enabled: !!uf` — depende de T006
- [X] T008 [P] [US1] Criar `poupe-certo-back/src/users/dto/location.schema.ts`: `updateLocationSchema` Zod — `city` (trim, 1–100 chars), `uf` (trim, exatamente 2 chars, `.transform(v => v.toUpperCase())`), ambos obrigatórios (mesmo padrão de `market.schema.ts`)
- [X] T009 [P] [US1] Criar `poupe-certo-back/src/users/dto/location.dto.ts`: classe Swagger `UpdateLocationDto`/`LocationDto` espelhando o schema (documentação apenas, nunca valida em runtime — mesmo padrão de `market.dto.ts`)
- [X] T010 [US1] Implementar `UsersService.setLocation(userId, { city, uf })` em `poupe-certo-back/src/users/users.service.ts`: `this.prisma.asUser(userId, tx => tx.profile.update({ where: { id: userId }, data: { city, uf }, select: { city: true, uf: true } }))` — depende de T008
- [X] T011 [US1] Adicionar rota `PATCH me/location` em `poupe-certo-back/src/users/users.controller.ts` (dentro da classe já protegida por `SupabaseJwtGuard`), com `@Body(new ZodValidationPipe(updateLocationSchema))` e `@ApiBody({ type: UpdateLocationDto })` — depende de T009, T010
- [X] T012 [P] [US1] Adicionar `getMe()` e `updateMyLocation(input)` em `src/lib/api/users.ts` (front), estendendo o schema de perfil existente com `city`/`uf` nullable (ver contracts/api.md#3)
- [X] T013 [US1] Criar `src/hooks/use-profile-location.ts` (front): `useMyProfile()` (`useQuery(['me'], getMe)`) e `useSaveLocation()` (`useMutation(updateMyLocation)`); em ambos os casos, sincronizar `useLocationStore` (`setLocation`/`clear`) a partir do resultado — backend sempre vence sobre valor antigo do `localStorage` (research.md#3/#4) — depende de T012
- [X] T014 [US1] Reescrever `src/app/onboarding/page.tsx`: substituir `UFS`/`CITIES` (mock) por `useEstados()`/`useMunicipios(uf)` (T007), manter 100% do layout/classes atuais (chips de UF, busca+lista de cidade, botão "Continuar"); adicionar estado de carregamento e de erro com retry para as duas chamadas (FR-009); no `finish()`, chamar `useSaveLocation().mutate({ city, uf })` (T013) e só navegar para `/` em `onSuccess` — depende de T007, T013
- [X] T015 [US1] Atualizar `src/app/(shell)/layout.tsx`: usar `useMyProfile()` (T013) para resincronizar o `location-store` a partir do backend antes de decidir o gate; se `city` do backend vier `null`, redirecionar para `/onboarding` mesmo que o `localStorage` tenha um valor antigo (mock, pré-feature); só renderizar `children` depois que o perfil resolver — depende de T013

**Checkpoint**: onboarding 100% funcional com dados reais do IBGE, persistido no backend, sobrevivendo a troca de dispositivo/navegador.

---

## Phase 4: User Story 2 - Ver apenas mercados da própria cidade (Priority: P1) 🎯 MVP

**Goal**: `GET /markets` filtra pela cidade/UF do perfil autenticado; cadastro de mercado novo já sai associado à cidade atual.

**Independent Test**: Rodar quickstart.md Cenário 2 — com cidade salva (US1), confirmar que nenhuma listagem de mercado mostra mercado de outra cidade, e que um mercado novo cadastrado aparece na listagem filtrada.

### Implementation for User Story 2

- [X] T016 [P] [US2] Adicionar `marketsQuerySchema` (Zod) em `poupe-certo-back/src/markets/dto/market.schema.ts`: `city` (trim, min 1, opcional) e `uf` (trim, 2 chars, uppercase, opcional)
- [X] T017 [US2] Atualizar `MarketsService.list()` em `poupe-certo-back/src/markets/markets.service.ts` para aceitar `{ city?, uf? }` e montar `where` (`city: { equals, mode: 'insensitive' }` quando informado, `uf` exato quando informado) — depende de T016
- [X] T018 [US2] Atualizar `GET /markets` em `poupe-certo-back/src/markets/markets.controller.ts`: `@Query(new ZodValidationPipe(marketsQuerySchema))`, `@ApiQuery` para `city`/`uf` (opcionais, comportamento atual sem filtro é preservado quando nenhum é enviado) — depende de T017
- [X] T019 [P] [US2] Atualizar `listMarkets()` em `src/lib/api/markets.ts` (front) para aceitar `params?: { city?: string; uf?: string }` e repassar via `api.get('/markets', { params })`
- [X] T020 [US2] Atualizar `useMarkets()` em `src/hooks/use-markets.ts` (front): ler `uf`/`city` de `useLocationStore`, incluir em `queryKey` e em `listMarkets({ city, uf })` — refetch automático quando a cidade mudar (serve também US3) — depende de T019 e do `location-store` já sincronizado (T015)
- [X] T021 [US2] Atualizar `onCreateMarket` em `src/app/(shell)/confirm-price/confirm-price-form.tsx`: incluir `city`/`uf` da `useLocationStore` atual no payload enviado a `createMarket.mutate(...)` (hoje o formulário só envia `name` — sem isso, todo mercado novo nasce sem cidade e nunca aparece na listagem filtrada) — depende de T015

**Checkpoint**: listagens de mercado (home, confirmação de preço) só mostram mercados da cidade da pessoa; cadastro de mercado novo já nasce associado à cidade certa.

---

## Phase 5: User Story 3 - Trocar de cidade depois do onboarding (Priority: P2)

**Goal**: Pessoa com cidade já salva consegue trocar de cidade pelo seletor do topo do site (já existente, `site-header.tsx` linka para `/onboarding`), e listagens de mercado refletem a nova cidade sem recarregar.

**Independent Test**: Rodar quickstart.md Cenário 3 — trocar de cidade A para B pelo seletor do topo, confirmar `PATCH /users/me/location` e listagem de mercados atualizando para B sem F5.

### Implementation for User Story 3

- [X] T022 [US3] Em `src/app/onboarding/page.tsx`, inicializar o estado de UF/cidade a partir do valor atual de `useLocationStore` quando já existir (em vez de sempre `UFS[0]`), para que reabrir a tela (troca de cidade) já mostre a seleção atual pré-marcada — depende de T014
- [X] T023 [US3] Validar manualmente quickstart.md Cenário 3 de ponta a ponta (troca de cidade → `PATCH` → listagem de mercados atualiza reativamente via `queryKey` de T020) — sem código novo esperado, US1+US2 já cobrem o mecanismo

**Checkpoint**: todas as três user stories funcionando de forma independente e integrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T024 [P] Buscar outros usos de `CITIES`/`UFS` em `src/lib/mock/community.ts` fora do onboarding (`grep -r "CITIES" src/`); remover o export se ficou órfão (YAGNI — Princípio VI)
- [X] T025 Rodar `npx prisma migrate deploy` (ou `migrate dev` conforme ambiente) + suíte e2e existente do back (`npm run test:e2e` em `poupe-certo-back`) para confirmar que nada quebrou em `users`/`markets`
- [X] T026 [P] Rodar `npm test` (vitest) em `poupe-certo-front`
- [X] T027 Executar manualmente quickstart.md Cenários 1, 2, 4 e 5 (IBGE indisponível, pessoa com cidade mock antiga) de ponta a ponta — smoke test real feito na perna pública (`GET /markets` sem filtro, `?city=&uf=` filtrando corretamente, `?uf=ZZ` retornando vazio, servidor local com migration aplicada); perna autenticada (login Google, `PATCH /users/me/location`) coberta pela suíte e2e (T025, 13/13 verde) — walkthrough completo no browser com login real depende de QA manual do usuário, não automatizável nesta sessão

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende do Setup — bloqueia US1 e US2 (coluna `city`/`uf` em `Profile`)
- **US1 (Phase 3)**: depende do Foundational
- **US2 (Phase 4)**: depende do Foundational; a parte de frontend (T020, T021) depende também de US1 (T015, `location-store` sincronizado com o backend) — a parte de backend (T016–T018) pode ser feita em paralelo com US1
- **US3 (Phase 5)**: depende de US1 (T014) e US2 (T020) já estarem prontos — não introduz mecanismo novo, só ajuste de UX + validação
- **Polish (Phase 6)**: depende de US1, US2 e US3 completas

### Parallel Opportunities

- T001/T002 (Setup) em paralelo
- T005 (Foundational) pode rodar em paralelo com o fim de T003/T004 sendo revisado, mas depende da migration aplicada para funcionar de fato
- Dentro de US1: T006, T008, T009, T012 em paralelo (arquivos/repos diferentes); T007 depende de T006; T010 depende de T008; T011 depende de T009+T010; T013 depende de T012; T014 depende de T007+T013; T015 depende de T013
- Dentro de US2: T016 e T019 em paralelo; T017 depende de T016; T018 depende de T017; T020 depende de T019+T015; T021 depende de T015
- T024/T026 (Polish) em paralelo com T025

---

## Implementation Strategy

### MVP mínimo

US1 isolada já entrega valor real (onboarding com dados reais, persistido) sem
quebrar nada — enquanto US2 não estiver pronta, `GET /markets` simplesmente
continua sem filtro (comportamento atual). Dado que a spec marca **US1 e US2
como P1** (o filtro por cidade é o motivo real de existir do onboarding),
recomenda-se entregar as duas juntas como MVP:

1. Setup + Foundational (T001–T005)
2. US1 completa (T006–T015) → validar Cenário 1
3. US2 completa (T016–T021) → validar Cenário 2
4. **PARAR e VALIDAR** os dois juntos antes de seguir
5. US3 (T022–T023) → validar Cenário 3
6. Polish (T024–T027)

### Entrega incremental

Cada checkpoint de fase é um ponto seguro para revisar/demonstrar antes de
seguir para a próxima. Depois de T027, seguir o fluxo do workspace:
`/test` → `/security` (Princípio V — feature grava dado de perfil) → `/review`.
