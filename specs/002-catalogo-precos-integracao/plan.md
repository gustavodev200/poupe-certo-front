# Implementation Plan: Catálogo e Preços — Integração com API Real

**Branch**: `002-catalogo-precos-integracao` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-catalogo-precos-integracao/spec.md`

## Summary

Substituir todo dado mock de catálogo (`src/lib/mock/catalog.ts`,
`src/lib/mock/community.ts`) por chamadas reais à API já existente em
`poupe-certo-back` (products, markets, price-reports, leaderboard,
users), reaproveitando o client axios com Bearer já configurado
(`src/lib/api/client.ts`) e o TanStack Query já provido em
`providers.tsx`. Abordagem: uma camada `src/lib/api/*.ts` fina (funções
tipadas por recurso, com parsing/validação Zod da resposta) + hooks
`useQuery`/`useMutation` por tela, sem introduzir um cliente HTTP novo
nem um state manager novo. Junto: passe de responsividade mobile-first
em todas as telas afetadas, e introdução de testes (Vitest + Testing
Library para unidade, Playwright para e2e) — nenhum dos dois existe
ainda no projeto.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16.3.6 (App Router), React 19.2

**Primary Dependencies**: axios (client já existente), @tanstack/react-query 5,
zod 4, react-hook-form + @hookform/resolvers, @supabase/supabase-js
(sessão/Bearer, já provido pela feature 001), Tailwind CSS 4, shadcn/ui
(radix-ui)

**Storage**: N/A neste repositório — todo dado vem via REST de
`poupe-certo-back` (Nest.js + Prisma sobre Postgres do Supabase); este
frontend não acessa banco.

**Testing**: Vitest + @testing-library/react (unitário/componente,
jsdom) — novo; Playwright (e2e, incl. viewports mobile→desktop) — novo.
Ambos adicionados nesta feature, sem duplicar framework (regra YAGNI da
skill `testing`).

**Target Platform**: Navegador (mobile e desktop), deploy Vercel free
tier (per memória do projeto)

**Project Type**: Web app — frontend puro (Next.js) consumindo API
externa já implementada; não há alteração de backend nesta feature.

**Performance Goals**: Percepção padrão de SPA/SSR Next.js — sem meta
numérica própria desta feature; herda staleTime de 60s já configurado
no QueryClient.

**Constraints**: Nenhuma escrita direta a banco/Supabase tables neste
repo (só Auth); toda leitura/escrita de catálogo passa pela API Nest.js
via Bearer token; contrato de API é fixo (não pode ser alterado por
esta feature).

**Scale/Scope**: 7 telas afetadas (home, busca, detalhe de produto,
scan, cadastrar produto, confirmar preço, perfil) + 5 recursos de API
(products, markets, price-reports, leaderboard, users).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Aplica? | Como esta feature cumpre |
|---|---|---|
| I. Stack Declarada | Sim | `project.config.json` já lido: preset `prisma-postgres`, backend Nest+Prisma vive em outro repo; aqui só se consome REST — nenhuma skill Prisma/Supabase-DB é carregada neste repo. |
| II. Zod na Borda | Sim | Toda escrita (price-report, novo produto, novo mercado) valida com Zod no cliente antes do envio (FR-010); toda leitura da API é parseada com schema Zod antes de entrar em componente. |
| III. Autorização Explícita no Servidor | Sim (mas não é desta feature) | Backend já faz a checagem (guards); frontend só reflete 401/403 — não implementa autorização própria. |
| IV. RLS em Tabelas Supabase | N/A | Este repo não acessa tabela via `supabase-js`; só Auth. Sem migration/tabela nova aqui. |
| V. Segurança Antes do Code Review | Sim | Feature toca dado de usuário (perfil, contribuições) e integração externa (API) → `/security` roda antes do `/review` final. |
| VI. YAGNI | Sim | Reaproveita axios + TanStack Query já existentes; não introduz cliente HTTP, state manager ou camada de cache paralela. Um único runner unitário (Vitest) + um e2e (Playwright), nada duplicado. |
| VII. Rastreabilidade Spec→Review | Sim | `spec.md`, este `plan.md`, `tasks.md` (a seguir), `security-review.md` e `code-review.md` — todos em `specs/002-catalogo-precos-integracao/`. |

Nenhuma violação — sem entradas em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          # já existe — axios + interceptor Bearer
│   │   ├── products.ts        # NOVO — search/detail/exists/create + schemas Zod
│   │   ├── markets.ts         # NOVO — list/create + schema Zod
│   │   ├── price-reports.ts   # NOVO — create/confirm + schema Zod
│   │   ├── leaderboard.ts     # NOVO — getTop + schema Zod
│   │   └── users.ts           # NOVO — me/stats/contributions + schema Zod
│   ├── validations/
│   │   └── price-report.ts    # ajustar para price numérico + market por id
│   └── mock/                  # REMOVIDO ao final (catalog.ts, community.ts)
├── hooks/
│   ├── use-products.ts        # NOVO — useSearchProducts, useProductDetail, useProductExists
│   ├── use-markets.ts         # NOVO — useMarkets, useCreateMarket
│   ├── use-price-reports.ts   # NOVO — useCreatePriceReport, useConfirmPrice
│   └── use-profile.ts         # NOVO — useProfileStats, useContributions
├── app/
│   ├── (shell)/page.tsx                       # home — trocar mock por hooks reais
│   ├── (shell)/search/results-view.tsx         # busca — trocar mock por useSearchProducts
│   ├── (shell)/product/[ean]/{page,product-view}.tsx  # detalhe — useProductDetail + confirmações
│   ├── (shell)/new-product/new-product-form.tsx        # cadastro — useCreateProduct
│   ├── (shell)/confirm-price/confirm-price-form.tsx     # reporte — useMarkets + useCreatePriceReport
│   ├── (shell)/profile/page.tsx                # perfil — useProfileStats + useContributions
│   └── scan/page.tsx                           # scan — useProductExists (troca lookup síncrono)
└── components/                 # ajustes de responsividade pontuais (ex.: Table→cards no mobile)

tests/
├── unit/            # NOVO — Vitest: schemas/validations/mappers puros
└── e2e/             # NOVO — Playwright: busca→produto, scan→reportar preço/cadastrar produto
```

**Structure Decision**: Projeto único (frontend puro, App Router do
Next.js) — sem pasta `backend/` porque `poupe-certo-back` é outro
repositório e não faz parte deste plano. Camada de API nova vive em
`src/lib/api/<recurso>.ts` (um arquivo por recurso REST, mesma
convenção dos módulos do backend) e cada tela ganha hook(s) próprio(s)
em `src/hooks/`, mantendo Server/Client Components como já estruturado.

## Complexity Tracking

Sem violações da constituição — seção não aplicável a este plano.
