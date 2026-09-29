# Implementation Plan: Preenchimento automático de produto pelo EAN

**Branch**: `005-preenchimento-ean` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-preenchimento-ean/spec.md`

## Summary

Novo endpoint autenticado `GET /products/ean/:ean/lookup` no Nest consulta o
Open Food Facts (OFF) com cache em memória (positivo e negativo, TTL),
deduplicação de requisições em voo por EAN, timeout e validação Zod da resposta.
O formulário `/new-product` chama esse endpoint uma vez por EAN (react-query,
sem retry) e preenche só campos ainda não tocados, com prévia da foto.
No `POST /products`, o servidor ignora `imageUrl` do cliente, reconsulta o
lookup (normalmente cache hit) e, se houver foto, faz upload assinado ao
Cloudinary por URL remota com `public_id` determinístico (`poupe-certo/products/<ean>`,
`overwrite=false`) — best-effort, nunca bloqueia o cadastro. `GET /products/:ean`
passa a devolver `imageUrl`, exibida na página do produto. A página `/scan`
ganha trava para disparar a navegação só uma vez por leitura.

## Technical Context

**Language/Version**: TypeScript; Next.js 16 (front), NestJS 11 + Prisma 7.10 (back)

**Primary Dependencies**: back: `fetch` nativo do Node (≥20) + `node:crypto` (sem SDK Cloudinary, sem lib de cache), `zod`, `@nestjs/throttler`; front: `@tanstack/react-query`, `react-hook-form`, `zod`, `axios`

**Storage**: nenhuma tabela nova — usa coluna existente `products.image_url` (nunca preenchida até hoje). Imagens no Cloudinary.

**Testing**: back: Jest unit (`*.spec.ts`) para cache/dedupe, parser OFF, mapeamento de categoria e assinatura Cloudinary com `fetch` mockado; e2e para 401/400 do lookup. front: Vitest para helper de merge de sugestões; Playwright `scan-to-new-product` estendido com lookup mockado.

**Target Platform**: Vercel (serverless) nos dois repos

**Project Type**: Web application — dois repositórios (front Next.js + back Nest)

**Performance Goals**: lookup com cache hit < 50 ms; miss limitado por timeout OFF de 4 s (SC-002 ≤ 6 s)

**Constraints**: credenciais Cloudinary só no back (env); OFF exige `User-Agent` identificando app/contato e pede ≤ 100 req/min de leitura de produto; serverless → cache é por instância e volátil (aceito na spec)

**Scale/Scope**: 1 endpoint novo, 1 alterado (`POST /products`), 1 campo novo na resposta de detalhe; 2 services novos no back (`OpenFoodFactsService`, `CloudinaryService`); front: 1 função API + 1 hook, form e product-view alterados, trava no scan

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Stack Declarada** — ✅ `preset: prisma-postgres` nos dois repos. `project.config.json` do back ganha `storage: "cloudinary"` documentado (desvio pontual, igual ao de auth).
- **II. Zod na Borda** — ✅ `eanSchema` no param; resposta do OFF (entrada externa) validada por Zod com limites de tamanho; resposta do Cloudinary validada por Zod; front parseia resposta do lookup com Zod.
- **III. Autorização Explícita no Servidor** — ✅ lookup exige `SupabaseJwtGuard`; `imageUrl` passa a ser derivada no servidor (cliente não controla URL gravada).
- **IV. RLS** — ✅ N/A: nenhuma tabela nova; escrita em `products.image_url` acontece no mesmo `asUser` do INSERT já coberto pela policy existente.
- **V. Segurança Antes do Code Review** — ⚠️ Aplicável (integração externa + credenciais + URL remota). Foco do `/security`: SSRF (upload só de URL em `images.openfoodfacts.org`/`static.openfoodfacts.org`, https), vazamento de secret (logs, respostas de erro, bundle front), abuso de cota (throttle + cache + dedupe), injeção via texto externo (React escapa; tamanho limitado).
- **VI. YAGNI** — ✅ Sem Redis/tabela de cache, sem SDK Cloudinary, sem transformações de imagem, sem foto na listagem de busca.
- **VII. Rastreabilidade** — ✅ spec → plan → tasks → implement → security → review.

**Gate result**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/005-preenchimento-ean/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
└── tasks.md
```

### Source Code

```text
poupe-certo-back/
├── .env.example                                   # + CLOUDINARY_*, OFF_USER_AGENT
├── src/common/config/env.schema.ts                # + CLOUDINARY_* (opcionais)
├── src/products/
│   ├── open-food-facts.service.ts                 # NOVO: fetch + cache TTL + dedupe + parse
│   ├── open-food-facts.parse.ts                   # NOVO: Zod da resposta OFF + mapeamento categoria (puro)
│   ├── open-food-facts.parse.spec.ts              # NOVO
│   ├── open-food-facts.service.spec.ts            # NOVO: cache/dedupe/timeout
│   ├── cloudinary.service.ts                      # NOVO: upload assinado por URL remota
│   ├── cloudinary.service.spec.ts                 # NOVO: assinatura
│   ├── products.controller.ts                     # + GET ean/:ean/lookup
│   ├── products.service.ts                        # create() deriva imageUrl; findDetail devolve imageUrl
│   ├── products.module.ts                         # registra services
│   └── dto/product.{schema,dto}.ts                # remove imageUrl do input; DTO de lookup
└── test/products.e2e-spec.ts                      # + 401/400 do lookup

poupe-certo-front/
├── src/lib/api/products.ts                        # + lookupEan, imageUrl no detalhe, remove imageUrl do input
├── src/hooks/use-ean-lookup.ts                    # NOVO
├── src/lib/ean-prefill.ts                         # NOVO: merge só de campos não tocados (puro)
├── src/app/(shell)/new-product/new-product-form.tsx  # prefill + prévia
├── src/app/(shell)/product/[ean]/product-view.tsx    # exibe foto
├── src/app/scan/page.tsx                          # trava contra navegação duplicada
├── tests/unit/lib/ean-prefill.test.ts             # NOVO
└── tests/e2e/scan-to-new-product.spec.ts          # + cenário pré-preenchido
```

**Structure Decision**: mesma divisão das features 002–004; lógica e segredos no back, front só consome.

## Complexity Tracking

Nenhuma violação.
