# Data Model: Onboarding com Localização Real (IBGE) e Mercados por Cidade

## Entidades persistidas (alteradas)

### Profile (existente — `poupe-certo-back/prisma/schema.prisma`)

| Campo | Tipo | Novo? | Regras |
|---|---|---|---|
| `id` | `String @db.Uuid` | não | PK, = `auth.uid()` |
| `email` | `String` | não | — |
| `displayName` | `String?` | não | — |
| `avatarUrl` | `String?` | não | — |
| `points` | `Int` | não | — |
| `isOperator` | `Boolean` | não | — |
| **`city`** | `String?` | **sim** | Nome do município (grafia IBGE), `NULL` = onboarding incompleto |
| **`uf`** | `String? @db.Char(2)` | **sim** | Sigla da UF em maiúsculas, sempre presente junto com `city` (ambos ou nenhum) |
| `createdAt` | `DateTime` | não | — |

**Regras de escrita**: só a própria pessoa (`id = auth.uid()`) grava
`city`/`uf`, via `PATCH /users/me/location`. `city` e `uf` são escritos juntos
(nunca um sem o outro) — ver contrato do endpoint.

**Migration**: nova migration Prisma adiciona as duas colunas (nullable, sem
default) + `GRANT UPDATE ("city", "uf") ON public.profiles TO authenticated`
(reaproveita a policy `profiles_update_own_points` já existente — ver
research.md#6). Não altera `GRANT SELECT` (já é tabela inteira para
`authenticated`; para `anon` continua restrito às colunas do leaderboard,
sem `city`/`uf`).

### Market (existente — sem alteração de schema)

`city`/`uf` já existem em `Market` desde a feature 002. Esta feature não
muda o modelo, só passa a **filtrar** `GET /markets` por esses campos quando
`city`/`uf` são informados na query string.

## Dados externos (não persistidos)

### Estado (UF) — vindo da API do IBGE, consumido só no frontend

```ts
{ id: number; sigla: string; nome: string }
```

Usado apenas para renderizar os chips de UF do onboarding (hoje alimentados
por `Object.keys(CITIES)`). Não é salvo em nenhuma tabela — o que persiste é
`Profile.uf` (a sigla escolhida).

### Município (Cidade) — vindo da API do IBGE, consumido só no frontend

```ts
{ id: number; nome: string }
```

Usado para renderizar a lista/busca de cidade do onboarding para a UF
selecionada (hoje alimentado por `CITIES[uf]`). O que persiste é
`Profile.city` (o `nome` escolhido, como texto).

## Fluxo de estado (frontend)

```text
IBGE (estados) ──▶ chips de UF (onboarding)
                         │ seleciona UF
                         ▼
IBGE (municípios da UF) ──▶ lista/busca de cidade (onboarding)
                         │ seleciona cidade + confirma
                         ▼
PATCH /users/me/location {city, uf} ──▶ Profile.city/uf (backend, fonte de verdade)
                         │ sucesso
                         ▼
location-store (zustand) ──▶ espelho local/otimista, usado por:
                         │        - (shell)/layout.tsx (gate de onboarding)
                         │        - use-markets.ts (filtro city/uf)
                         ▼
GET /users/me (no load do shell) ──▶ resincroniza location-store com o backend
                                      (corrige/sobrescreve valor antigo do
                                      localStorage, inclusive de antes desta
                                      feature — ver research.md#4)
```

## Validação (Zod, "na borda")

- **Frontend → IBGE**: resposta de `estados` e `municípios` validada com
  schemas Zod mínimos (campos usados: `sigla`/`nome` para estado, `nome`
  para município) — protege contra mudança de formato da API externa.
- **Frontend → Backend**: `updateMyLocation({ city, uf })` validado antes de
  enviar (mesma forma exigida pelo backend) — feedback de erro imediato sem
  round-trip.
- **Backend `PATCH /users/me/location`**: `updateLocationSchema` (Zod) —
  `city`: string, trim, 1–100 chars; `uf`: string, trim, exatamente 2 chars,
  transformado para maiúsculas. Ambos obrigatórios juntos (não há "limpar
  cidade" nesta feature — fora de escopo).
- **Backend `GET /markets?city=&uf=`**: `marketsQuerySchema` (Zod) — `city` e
  `uf` opcionais (lista sem filtro continua existindo para outros usos
  internos/futuros), mesma normalização de `uf` (maiúsculas, 2 chars).
