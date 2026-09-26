# Implementation Plan: Onboarding com Localização Real (IBGE) e Mercados por Cidade

**Branch**: `003-onboarding-cidade-ibge` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-onboarding-cidade-ibge/spec.md`

## Summary

Trocar a lista mock de estados/cidades do onboarding (`src/lib/mock/community.ts#CITIES`)
por dados reais da API pública de Localidades do IBGE, mantendo o layout atual
da tela. A cidade/UF escolhida passa a ser persistida no backend
(`Profile.city`/`Profile.uf`, poupe-certo-back) em vez de só no
`localStorage` do zustand, e `GET /markets` passa a filtrar pela cidade/UF do
perfil autenticado. Como o backend vive num repositório-irmão
(`poupe-certo-back`), esta feature toca dois repositórios: front (Next.js,
onboarding + hooks/lib de API) e back (Nest + Prisma, migration + endpoints).

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16 (App Router) no front; TypeScript + NestJS 12 + Prisma 7 no back (`poupe-certo-back`, `preset: prisma-postgres`)

**Primary Dependencies**: front: `@tanstack/react-query` 5, `zustand` (+ `persist`), `zod`, `axios` (`src/lib/api/client.ts`, injeta Bearer do Supabase Auth); back: `@nestjs/*`, `zod` + `ZodValidationPipe` (nunca `class-validator` para runtime), `PrismaService.asUser/asPublic`

**Storage**: PostgreSQL gerenciado pelo Supabase, acessado via Prisma no back; front não acessa banco diretamente (proxy sempre via API Nest)

**Testing**: `vitest` no front (`npm test` → `vitest run`); suíte e2e Nest (`test/*.e2e-spec.ts`) no back

**Target Platform**: Web (Vercel) para o front; Node.js (mesma infra do back atual) para a API

**Project Type**: Web application — dois repositórios (frontend Next.js + backend Nest/Prisma), integrados via `NEXT_PUBLIC_API_URL`

**Performance Goals**: Carregar estados/municípios do IBGE sem regressão perceptível vs. a lista mock atual (onboarding completável em menos de 1 minuto, ver SC-002); listas de UF (27 itens) e municípios por UF (≤ ~650 itens, SP é o maior estado) cabem numa única resposta, sem paginação

**Constraints**: Dependência de uma API pública externa sem SLA (IBGE) — precisa de estado de erro + retry (FR-009); alterações de RLS/grants no Postgres devem manter o princípio de menor privilégio já em vigor (colunas liberadas por `GRANT` explícito, nunca `USING (true)` por conveniência)

**Scale/Scope**: 27 UFs fixas; até ~5.570 municípios no total, carregados sob demanda por UF (não de uma vez); escopo não inclui código IBGE de município como identificador — cidade continua sendo texto (nome + UF), como já é hoje em `Market`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Stack Declarada, Não Assumida** — ✅ `project.config.json` confirmado: `preset: "prisma-postgres"`, `frontend: "nextjs"`, `backend: "nestjs"`, `auth: "supabase-auth"`. Nenhuma skill Supabase-específica (client-side) é usada; o front nunca acessa tabelas Supabase diretamente (nota do config), só a API Nest.
- **II. Zod na Borda, Sempre** — ✅ Todo dado externo novo passa por Zod: resposta da API do IBGE (front), body de `PATCH /users/me/location` e query de `GET /markets` (back, via `ZodValidationPipe`, mesmo padrão de `createMarketSchema`).
- **III. Autorização Explícita no Servidor** — ✅ `PATCH /users/me/location` exige `SupabaseJwtGuard` e escreve sempre em `id = auth.uid()` (via `asUser`), nunca recebendo `userId` do body. Filtro de `GET /markets` por cidade não expõe dado de outra pessoa (mercado já é público).
- **IV. RLS Obrigatória em Tabelas Supabase** — ✅ Não cria tabela nova. Só adiciona colunas (`city`, `uf`) a `profiles` (já tem RLS habilitada) e um `GRANT UPDATE ("city", "uf")` reaproveitando a policy já existente `profiles_update_own_points` (`USING/WITH CHECK id = auth.uid()`) — mesmo padrão column-level já usado para `points`. Nenhuma policy nova é necessária; nenhum `USING (true)` introduzido.
- **V. Segurança Antes do Code Review** — ⚠️ Aplicável: a feature grava dado de usuário (localização) — `/security` deve rodar antes do `/review`, focando em: (a) o novo endpoint só grava a própria linha; (b) `city`/`uf` do body são validados e truncados (tamanho máximo) antes de tocar o banco; (c) filtro de `GET /markets` não permite injeção via query (Zod + Prisma parametrizado).
- **VI. YAGNI** — ✅ Sem código IBGE de município, sem geocoding, sem nova tabela de "Cidade"/"Estado" — cidade continua texto simples, comparação por igualdade (mesma fonte IBGE dos dois lados). Sem introduzir cache/Redis para a lista do IBGE — `staleTime` do React Query já é suficiente (dado quase estático).
- **VII. Rastreabilidade Spec → Review** — ✅ Em andamento: `spec.md` ✅, `plan.md` (este arquivo), `tasks.md` (próximo comando), `security-review.md` e `code-review.md` a produzir depois do `/speckit-implement`.

**Gate result**: PASS. Nenhuma violação — item V é uma obrigação de processo (rodar `/security`), não uma violação a justificar em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-onboarding-cidade-ibge/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── api.md           # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Esta feature atravessa dois repositórios-irmãos (não um monorepo): o `plan.md`
vive em `poupe-certo-front` (onde a feature nasce, na tela de onboarding),
mas cobre mudanças em ambos.

```text
poupe-certo-front/                          # este repo (frontend Next.js)
└── src/
    ├── app/
    │   ├── onboarding/page.tsx             # troca CITIES mock por hooks IBGE + salva no backend
    │   └── (shell)/layout.tsx              # sincroniza location-store com Profile.city/uf do backend
    ├── lib/
    │   ├── api/
    │   │   ├── ibge.ts                     # NOVO: fetchEstados(), fetchMunicipios(uf)
    │   │   ├── users.ts                    # + getMe(), updateMyLocation()
    │   │   └── markets.ts                  # listMarkets() aceita { city?, uf? }
    │   └── mock/community.ts               # CITIES deixa de ser usado pelo onboarding (avaliar remoção)
    ├── hooks/
    │   ├── use-ibge-locations.ts           # NOVO: useEstados(), useMunicipios(uf)
    │   ├── use-profile-location.ts         # NOVO: sincroniza store <-> Profile.city/uf
    │   └── use-markets.ts                  # passa filtro de cidade/UF vindo do location-store
    └── stores/location-store.ts            # passa a ser espelho do backend, não fonte de verdade

poupe-certo-back/                           # repo-irmão (backend Nest + Prisma)
├── prisma/
│   ├── schema.prisma                       # Profile.city / Profile.uf (String?, uf Char(2))
│   └── migrations/<timestamp>_profile_location/migration.sql
└── src/
    ├── users/
    │   ├── users.controller.ts             # + PATCH me/location
    │   ├── users.service.ts                # findMe() inclui city/uf; + setLocation()
    │   └── dto/location.schema.ts          # NOVO: updateLocationSchema (Zod)
    └── markets/
        ├── markets.controller.ts           # GET aceita ?city=&uf= (ApiQuery + ZodValidationPipe)
        ├── markets.service.ts              # list() filtra where city/uf quando informados
        └── dto/market.schema.ts            # + marketsQuerySchema
```

**Structure Decision**: Reaproveita a estrutura já existente em ambos os
repos (nenhuma pasta nova de alto nível). No front, a única novidade
estrutural é `lib/api/ibge.ts` + `hooks/use-ibge-locations.ts` (fonte de
dados externa isolada, fácil de trocar/mockar em teste). No back, a feature
segue o padrão já usado por `markets` (DTO Swagger + schema Zod + service
com `asUser`/`asPublic`) — sem módulo novo, só extensão de `users` e
`markets`.

## Complexity Tracking

*Nenhuma violação da Constitution exige justificativa — tabela omitida.*
