# Data Model: Catálogo e Preços — Integração com API Real

Tipos do lado do frontend, espelhando 1:1 os DTOs já expostos pelo
backend (`poupe-certo-back/src/**/dto/*.dto.ts`). Nenhuma tabela nova —
este documento descreve os tipos TypeScript + schemas Zod a criar em
`src/lib/api/*.ts`, não migrations.

## MarketRef

| Campo | Tipo | Notas |
|---|---|---|
| id | string (uuid) | |
| name | string | |

## OfferSummary

| Campo | Tipo | Notas |
|---|---|---|
| market | MarketRef | |
| price | number | reais, 2 decimais |
| reportedAt | string (ISO datetime) | usado por `trust.ts` (idade) |
| confirmations | number | |

## OfferDetail (extends OfferSummary)

| Campo | Tipo | Notas |
|---|---|---|
| priceReportId | string (uuid) | necessário para `POST /price-reports/:id/confirmations` |

## ProductStats

| Campo | Tipo | Notas |
|---|---|---|
| lowest | number \| null | null quando produto sem ofertas |
| average | number \| null | |
| highest | number \| null | |

## HistoryPoint

| Campo | Tipo | Notas |
|---|---|---|
| period | string | rótulo de quinzena/mês, já formatado pelo backend |
| lowestPrice | number | |

## ProductSummary (resultado de busca)

| Campo | Tipo | Notas |
|---|---|---|
| ean | string | chave |
| name | string | |
| brand | string | |
| qty | string | |
| category | CategoryCode | `"merc" \| "beb" \| "lim" \| "hig" \| "fri" \| "pad"` |
| lowestOffer | OfferSummary \| null | null quando ainda sem preço reportado |
| offerCount | number | |

## ProductDetail

| Campo | Tipo | Notas |
|---|---|---|
| ean, name, brand, qty, category | — | igual a ProductSummary |
| offers | OfferDetail[] | |
| stats | ProductStats | |
| history | HistoryPoint[] | |

## SearchProductsResult

| Campo | Tipo | Notas |
|---|---|---|
| items | ProductSummary[] | |
| page | number | |
| pageSize | number | |
| total | number | |

**Estado derivado na UI**: `results.length === 0` ⇒ estado vazio
("nenhum produto encontrado, cadastre você mesmo").

## ProductExists

| Campo | Tipo | Notas |
|---|---|---|
| exists | boolean | |
| approved | boolean | `exists && !approved` = pendente de outra pessoa; tratado como "não encontrado publicamente" no fluxo de scan |

## CreateProductInput (form → API)

| Campo | Tipo | Validação cliente |
|---|---|---|
| ean | string | vem da rota (query param), não editável no form |
| name | string | min 2 |
| brand | string | min 2 |
| qty | string | min 1 |
| category | CategoryCode | obrigatório, um dos 6 códigos |
| imageUrl | string? | opcional, fora de escopo de upload nesta feature (sem input de imagem real) |

## CreateProductResponse

| Campo | Tipo |
|---|---|
| ean | string |
| status | `"PENDING"` |
| pointsAwarded | number |

## Market (lista completa)

| Campo | Tipo |
|---|---|
| id | string (uuid) |
| name | string |
| address, city, uf | string \| null |

## CreateMarketInput (form inline → API)

| Campo | Tipo | Validação cliente |
|---|---|---|
| name | string | min 2 |
| address, city, uf | string? | opcionais |

## CreatePriceReportInput (form → API)

| Campo | Tipo | Validação cliente |
|---|---|---|
| marketId | string (uuid) | obrigatório — selecionado de `Market[]` |
| price | number | transformado de string do input; > 0 |

## PriceReportResult

| Campo | Tipo | Notas |
|---|---|---|
| id | string (uuid) | |
| status | `"ACTIVE" \| "PENDING_REVIEW"` | dirige a mensagem de sucesso exibida |
| pointsAwarded | number | |
| message | string? | exibido quando `PENDING_REVIEW` |

## ConfirmationResult

| Campo | Tipo |
|---|---|
| priceReportId | string (uuid) |
| confirmations | number |

## ProfileStats

| Campo | Tipo |
|---|---|
| pricesReported, productsCreated, confirmationsGiven | number |
| confidencePercent | number (0-100) |
| points, level, pointsToNextLevel, progressPercent | number |
| rankPosition | number |

## ContributionItem

| Campo | Tipo | Notas |
|---|---|---|
| type | `"price_report" \| "product_created"` | dirige o ícone/label na lista |
| product | `{ ean: string; name: string }` | |
| market | `{ id: string; name: string } \| null` | null quando `type === "product_created"` |
| price | number? | presente só quando `type === "price_report"` |
| createdAt | string (ISO datetime) | |

## ContributionsResult

| Campo | Tipo |
|---|---|
| items | ContributionItem[] |
| page, pageSize, total | number |

## LeaderboardEntry

| Campo | Tipo | Notas |
|---|---|---|
| displayName | string \| null | nunca inclui e-mail (dado restrito no backend) |
| avatarUrl | string \| null | |
| level | number | |
| points | number | |
| pricesReported | number | |

Sem `id`/posição explícita no DTO — a posição no ranking é o índice do
item na lista retornada por `GET /leaderboard?limit=`.

## Mapeamentos de UI que deixam de existir

- `trustLevel(reportedAt)` / `trustColorVar` / `formatAge` (`src/lib/trust.ts`):
  mantidos como estão — já operam sobre `reportedAt: string`, campo que
  a API real também fornece (`OfferSummary.reportedAt`). Sem mudança.
- `lowestOffer(product)` (mock): substituído por usar direto
  `ProductSummary.lowestOffer` (já calculado pelo backend) — remover a
  função local depois de migrar todos os usos.
