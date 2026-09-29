# Tasks: Preenchimento automático de produto pelo EAN

**Input**: Design documents from `/specs/005-preenchimento-ean/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

Caminhos `back/` = `../poupe-certo-back/`; sem prefixo = este repo (front).

## Phase 1: Setup

- [X] T001 Adicionar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `OFF_USER_AGENT` (todas opcionais) em back/src/common/config/env.schema.ts e placeholders em back/.env.example; valores reais só em back/.env (gitignored)
- [X] T002 [P] Documentar `storage: "cloudinary"` em back/project.config.json (campo `storage` + `notes`)

## Phase 2: Foundational

- [X] T003 [P] Parser puro da resposta OFF (Zod, limites de tamanho, primeira marca, domínio da foto, mapeamento de categoria) em back/src/products/open-food-facts.parse.ts
- [X] T004 [P] Testes do parser em back/src/products/open-food-facts.parse.spec.ts
- [X] T005 `OpenFoodFactsService.lookup(ean)` com cache TTL (24 h/1 h/1 min, máx 1000), dedupe em voo, timeout 4 s, User-Agent em back/src/products/open-food-facts.service.ts
- [X] T006 Testes de cache/dedupe/timeout com `fetch` mockado em back/src/products/open-food-facts.service.spec.ts
- [X] T007 Registrar service em back/src/products/products.module.ts

## Phase 3: User Story 1 - Cadastro pré-preenchido (P1) 🎯 MVP

**Independent Test**: digitar 7891000100103 no /scan → /new-product com nome/marca/quantidade preenchidos.

- [X] T008 [US1] Endpoint `GET /products/ean/:ean/lookup` (SupabaseJwtGuard, throttle 20/min, eanSchema) + `EanLookupDto` em back/src/products/products.controller.ts e back/src/products/dto/product.dto.ts
- [X] T009 [P] [US1] e2e 401 sem token / 400 EAN inválido em back/test/products.e2e-spec.ts
- [X] T010 [P] [US1] `lookupEan()` + `eanLookupSchema` em src/lib/api/products.ts
- [X] T011 [P] [US1] Hook `useEanLookup(ean)` (staleTime Infinity, retry false, enabled só com EAN válido) em src/hooks/use-ean-lookup.ts
- [X] T012 [P] [US1] Helper puro `pickPrefill(lookup, dirtyFields)` em src/lib/ean-prefill.ts + teste em tests/unit/lib/ean-prefill.test.ts
- [X] T013 [US1] Aplicar sugestões só em campos não editados + aviso "buscando"/"não encontramos" em src/app/(shell)/new-product/new-product-form.tsx
- [X] T014 [P] [US1] Trava (ref) para `onDetected`/`goToResult` rodarem uma vez por leitura em src/app/scan/page.tsx
- [X] T015 [US1] Cenário pré-preenchido no e2e em tests/e2e/scan-to-new-product.spec.ts

## Phase 4: User Story 2 - Foto salva e exibida (P2)

**Independent Test**: cadastrar EAN com foto → asset `poupe-certo/products/<ean>` no Cloudinary; página do produto exibe a foto.

- [X] T016 [US2] `CloudinaryService.uploadRemote(url, publicId)` (assinatura SHA-1, `overwrite=false`, timeout 8 s, Zod na resposta, desligado sem env) em back/src/products/cloudinary.service.ts
- [X] T017 [P] [US2] Teste da assinatura/params em back/src/products/cloudinary.service.spec.ts
- [X] T018 [US2] Remover `imageUrl` de `createProductSchema`/`CreateProductDto`; `create()` deriva foto via lookup + upload best-effort antes da transação em back/src/products/products.service.ts e back/src/products/dto/
- [X] T019 [US2] `findDetail` devolve `imageUrl`; `ProductDetailDto.imageUrl` em back/src/products/products.service.ts e back/src/products/dto/product.dto.ts
- [X] T020 [P] [US2] Remover `imageUrl` de `CreateProductInput`, adicionar `imageUrl` ao `productDetailSchema` em src/lib/api/products.ts
- [X] T021 [US2] Prévia da foto no formulário em src/app/(shell)/new-product/new-product-form.tsx
- [X] T022 [US2] Exibir foto na página do produto em src/app/(shell)/product/[ean]/product-view.tsx; ajustar fixtures e2e que mockam detalhe

## Phase 5: Polish

- [X] T023 Rodar lint + `npm test` + `npm run test:e2e` (back) e lint + `npm test` + `npx playwright test` (front)
- [X] T024 Atualizar back/README (ou .env.example) com instruções das novas envs e da Vercel

## Dependencies

- Phase 1 → Phase 2 → US1 → US2 (US2 reutiliza o lookup do US1 no `create`).
- [P] dentro de cada fase: arquivos diferentes, sem dependência.

## Implementation Strategy

MVP = Phases 1–3 (pré-preenchimento). US2 entrega foto em cima.
