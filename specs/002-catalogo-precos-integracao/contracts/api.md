# Contracts: API consumida (poupe-certo-back)

Este projeto não expõe API própria — ele **consome** os endpoints REST
abaixo, já implementados e estáveis em `poupe-certo-back`. Formas de
request/response detalhadas em [data-model.md](../data-model.md). Toda
rota autenticada envia `Authorization: Bearer <supabase access_token>`
(já resolvido por `src/lib/api/client.ts`).

| Recurso | Método + Rota | Auth | Usado em | Sucesso | Erros tratados na UI |
|---|---|---|---|---|---|
| Produtos | `GET /products/search?q&category&sort&page&pageSize` | Público | Home, Busca | 200 `SearchProductsResult` | rede/timeout → estado de erro + retry |
| Produtos | `GET /products/ean/:ean/exists` | Público | Scan | 200 `ProductExists` | rede/timeout → estado de erro + retry |
| Produtos | `GET /products/:ean` | Público | Detalhe do produto | 200 `ProductDetail` | 404 → `notFound()` (já existente) |
| Produtos | `POST /products` | Bearer | Cadastrar produto | 201 `CreateProductResponse` | 401 → redirect `/login?next=`; 409 (EAN já existe) → mensagem + link para "confirmar preço"; 400 (Zod) → erro de campo |
| Mercados | `GET /markets` | Público | Confirmar preço (select) | 200 `Market[]` | rede/timeout → estado de erro + retry |
| Mercados | `POST /markets` | Bearer | Confirmar preço ("novo mercado") | 200/201 `Market` | 401 → redirect login; 400 → erro de campo |
| Preços | `POST /products/:ean/price-reports` | Bearer | Confirmar preço | 201/202 `PriceReportResult` | 401 → redirect login; 404 (produto não aprovado) → mensagem; 400 → erro de campo |
| Preços | `POST /price-reports/:id/confirmations` | Bearer | Detalhe do produto ("ainda está correto?") | 200/201 `ConfirmationResult` | 401 → redirect login; 404 → mensagem "preço não está mais ativo" |
| Ranking | `GET /leaderboard?limit` | Público | Home (top contribuidores) | 200 `LeaderboardEntry[]` | rede/timeout → oculta seção com fallback silencioso (não crítico) |
| Perfil | `GET /users/me/stats` | Bearer | Perfil | 200 `ProfileStats` | 401 → redirect login (já coberto por `useRequireAuth`) |
| Perfil | `GET /users/me/contributions?page&pageSize` | Bearer | Perfil | 200 `ContributionsResult` | 401 → idem; vazio → mensagem "nenhuma contribuição ainda" |

## Fora de escopo (existem na API, não consumidos por esta feature)

- `GET /users/me` — já resolvido no cliente pela sessão Supabase
  (`getDisplayUser`); não precisa de chamada extra.
- `GET /moderation/queue`, `PATCH /moderation/products/:ean`,
  `PATCH /moderation/price-reports/:id` — tela de operador, fora do
  público-alvo desta feature (ver Assumptions no spec.md).

## Convenção de erro adotada no frontend

Toda função em `src/lib/api/*.ts` deixa o `AxiosError` propagar; cada
hook (`useQuery`/`useMutation`) expõe `error` para a tela decidir a
mensagem. Regra única: nunca renderizar `error.message`/corpo bruto do
backend diretamente no DOM — sempre mapear para uma mensagem
pré-definida por status (400/401/404/409/5xx/rede), evitando eco de
conteúdo não controlado (ver nota de segurança em `research.md#8`).
