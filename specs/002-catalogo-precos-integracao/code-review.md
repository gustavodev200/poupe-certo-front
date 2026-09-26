# Code Review: Catálogo e Preços — Integração com API Real

- **Spec**: `spec.md` | **Plan**: `plan.md` | **Security Review**:
  `security-review.md` (PASS WITH WARNINGS)
- **Status**: Aprovado

## Achados

| Arquivo:Linha | Severidade | Problema | Correção sugerida |
|---|---|---|---|
| `src/lib/api/leaderboard.ts` | baixa | `LeaderboardEntry` não tem campo `id`; a key usada em `page.tsx` (`${c.displayName}-${i}`) depende do índice — se a lista reordenar entre refetches o React pode reconciliar errado por 1 frame | Aceitável: lista é somente leitura, sem inputs internos por item; risco visual mínimo, não vale introduzir um id sintético só pra isso (YAGNI) |
| `tests/e2e/*` (execução local) | informacional | `next dev` reusado (`reuseExistingServer`) entre muitas execuções ao longo desta sessão ficou com estado stale (Turbopack/HMR) e causou falha intermitente em 4 specs até eu matar o processo e deixar o Playwright subir um `next dev` novo | Não é bug de código — registrado aqui pra quem rodar `test:e2e` depois: se a suíte ficar flakey após rodar por muito tempo com o dev server de pé, mate o processo na porta 3000 e rode de novo. Em CI (`reuseExistingServer:false`) isso não ocorre. |

Nenhum achado de severidade média/alta.

## Confirmação de escopo (FR-001 a FR-015 do `spec.md`)

- [x] FR-001/002/003: busca, detalhe e verificação de EAN via API real (`use-products.ts`, `results-view.tsx`, `product-view.tsx`, `scan/page.tsx`).
- [x] FR-004/005: cadastro de produto e reporte de preço com mercado real + cadastro de mercado inline (`use-create-product.ts`, `use-price-reports.ts`, `use-markets.ts`, `confirm-price-form.tsx`, `new-product-form.tsx`).
- [x] FR-006: confirmar preço sem reload (`useConfirmPrice` invalida a query do detalhe).
- [x] FR-007/008: estatísticas/nível/ranking + feed de contribuições paginado com "Carregar mais" (`use-profile.ts`, `profile/page.tsx`).
- [x] FR-009: ranking na home (`use-leaderboard.ts`).
- [x] FR-010: Zod em toda escrita (`price-report.ts` validations).
- [x] FR-011: Bearer via `client.ts` já existente, nenhuma duplicação.
- [x] FR-012: loading/vazio/erro em todas as telas afetadas (`query-error.tsx` + estados locais + `error.tsx` nas rotas com fetch server-side).
- [x] FR-013: `lib/mock/catalog.ts` removido; `community.ts` só com copy institucional.
- [x] FR-014/SC-003: sem overflow horizontal de 320px a 1920px — verificado por `tests/e2e/responsive.spec.ts` (36/36, Mobile+Desktop).
- [x] FR-015: 33 testes unitários (Vitest) + 5 arquivos e2e (Playwright, caminho feliz de US1/US2/US3 + estado vazio + redirect não-autenticado).
- [x] Nenhuma funcionalidade fora de escopo foi adicionada (sem tela de moderação/operador, sem geolocalização real — ambos explicitamente fora de escopo per Assumptions do `spec.md`).

## Confirmação de itens da Security Review

- [x] `security-review.md` está em **PASS WITH WARNINGS** — os 2 itens
  registrados (headers sitewide pré-existentes; refresh teórico de token
  fake em teste) foram aceitos explicitamente como risco, não bloqueiam.

## Simplicidade e reuso (YAGNI)

- Nenhum cliente HTTP novo, nenhum state manager novo — reaproveitado
  axios (`client.ts`) e TanStack Query (`providers.tsx`) já existentes.
- Um único runner unitário (Vitest) e um único e2e (Playwright) —
  nenhum framework de teste duplicado.
- `src/lib/api/*.ts` segue a mesma convenção de "um módulo por recurso
  REST" que o backend já usa (`products.dto.ts`, `market.dto.ts`, ...),
  sem introduzir uma camada de abstração genérica ("repository",
  "gateway") não pedida pela spec.

## Consistência com o preset

- `project.config.json` confirma preset `prisma-postgres` com backend em
  outro repositório; nenhum import de `@prisma/client`/Supabase-DB neste
  repositório — confirmado via `grep` (só `@supabase/supabase-js` para
  Auth, como já era em feature 001).

## Performance

- Nenhum N+1 introduzido (frontend puro consumindo REST, sem loop de
  chamadas — cada tela faz 1-3 chamadas fixas via React Query com cache).

## Conclusão

**Aprovado.** Todos os requisitos funcionais e critérios de sucesso do
`spec.md` foram implementados e verificados (build, lint, typecheck,
33 testes unitários e 36 testes e2e — todos verdes). Security Review em
PASS WITH WARNINGS sem bloqueio. Único item pendente fora do controle
desta feature: T049 (`quickstart.md` contra o backend real) não foi
executado nesta sessão porque apontaria para o projeto Supabase real
compartilhado — decisão que cabe ao usuário, registrada em `tasks.md`.
