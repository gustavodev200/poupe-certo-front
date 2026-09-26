# API Contracts: Onboarding com Localização Real (IBGE) e Mercados por Cidade

## 1. IBGE Localidades (externo, consumido só pelo frontend)

Base: `https://servicodados.ibge.gov.br/api/v1/localidades` — público, sem
autenticação, sem chave.

### `GET /estados?orderBy=nome`

Resposta (200), array de:

```json
{ "id": 52, "sigla": "GO", "nome": "Goiás" }
```

Front usa `sigla` (chip de UF) e `nome` (ordenação/exibição, se necessário).

### `GET /estados/{UF}/municipios`

`{UF}` = sigla de 2 letras (ex. `GO`). Resposta (200), array de:

```json
{ "id": 5208707, "nome": "Goiânia" }
```

Front usa `nome` (lista/busca de cidade). Sem paginação — resposta única por
UF.

**Erros**: qualquer falha de rede/HTTP não-2xx é tratada como erro genérico
de carregamento (FR-009) — mensagem + botão "tentar novamente" refazendo a
mesma chamada (React Query `refetch`).

---

## 2. Backend (`poupe-certo-back`) — endpoints alterados/novos

Convenção do projeto: DTO de classe só documenta o Swagger; validação real
em runtime é sempre via schema Zod + `ZodValidationPipe` (ver
`markets.controller.ts`/`market.schema.ts` como referência).

### `GET /users/me` (existente — resposta estendida)

Sem mudança de assinatura da rota. `ProfileResponse` passa a incluir:

```ts
{
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;   // NOVO
  uf: string | null;     // NOVO
  createdAt: string;
}
```

`city`/`uf` nulos = onboarding de localização incompleto.

### `PATCH /users/me/location` (NOVO)

Autenticação: `SupabaseJwtGuard` (mesma proteção de todo `/users/*`).

Body (validado por `updateLocationSchema`):

```ts
{
  city: string; // trim, 1–100 chars
  uf: string;   // trim, exatamente 2 chars, normalizado para maiúsculas
}
```

Resposta (200):

```ts
{ city: string; uf: string }
```

Erros: `400` (Zod) se `city`/`uf` ausentes/inválidos; `401` sem sessão
válida. Sempre grava na própria linha (`id = auth.uid()`, via
`PrismaService.asUser`) — nunca recebe `userId` no body.

### `GET /markets?city=&uf=` (query nova, endpoint existente)

Ambos os parâmetros são opcionais e validados por `marketsQuerySchema`
(Zod): `city` (trim, min 1) e `uf` (trim, 2 chars, maiúsculas). Continua
público (sem guard), mesmo comportamento de hoje quando nenhum parâmetro é
enviado (lista completa — mantido para não quebrar outros usos internos).

Resposta (200): mesmo shape de hoje (`MarketDto[]`), agora filtrado:
`city` comparado case-insensitive, `uf` comparado exato, ambos aplicados
como `AND` quando os dois são informados.

```http
GET /markets?city=Goi%C3%A2nia&uf=GO
```

### `POST /markets` (existente — sem mudança de contrato)

Continua igual; mencionado aqui só porque o cadastro de mercado novo
(FR-010) deve, no frontend, continuar preenchendo `city`/`uf` a partir da
localização atual da pessoa (agora vinda do `location-store` sincronizado
com o backend, não mais do mock).

---

## 3. Frontend — funções de API novas/alteradas (`poupe-certo-front`)

```ts
// src/lib/api/ibge.ts (NOVO)
fetchEstados(): Promise<{ sigla: string; nome: string }[]>
fetchMunicipios(uf: string): Promise<{ nome: string }[]>

// src/lib/api/users.ts (+)
getMe(): Promise<{ ...; city: string | null; uf: string | null }>
updateMyLocation(input: { city: string; uf: string }): Promise<{ city: string; uf: string }>

// src/lib/api/markets.ts (alterado)
listMarkets(params?: { city?: string; uf?: string }): Promise<Market[]>
```
