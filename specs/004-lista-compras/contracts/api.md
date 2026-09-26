# API Contract: Minha Lista

Base URL: mesma dos demais endpoints (`NEXT_PUBLIC_API_URL`). Todas as rotas
abaixo exigem `Authorization: Bearer <supabase_access_token>` — não existe
versão pública/anônima de lista. Erros seguem `{ statusCode, message }`
(filtro global existente).

---

## `GET /users/me/list`

Lista todos os itens da conta autenticada, pendentes primeiro (mais
recentes primeiro dentro de cada grupo).

**Response 200**:
```json
[
  {
    "id": "uuid",
    "product": { "ean": "7891234567890", "name": "Arroz Camil Tipo 1", "brand": "Camil", "qty": "5kg" },
    "market": { "id": "uuid", "name": "Mercado B" },
    "price": 24.9,
    "purchased": false,
    "createdAt": "2026-09-26T00:00:00.000Z"
  }
]
```

Lista vazia → `[]` (nunca 404 — conta sem itens é um estado normal).

## `POST /users/me/list`

Adiciona um produto à lista, capturando a oferta vigente (menor preço entre
os reportes `ACTIVE` do produto) como snapshot. Idempotente por produto: se
o produto já está na lista da conta, retorna o item existente sem alterar o
snapshot (ver research.md#2).

**Body**:
```json
{ "productEan": "7891234567890" }
```

**Response 201** (item novo) ou **200** (já existia): mesmo formato de item
de `GET /users/me/list`.

**Response 404**: produto inexistente/não aprovado, ou sem nenhuma oferta
`ACTIVE` no momento (nada pra "capturar" como snapshot).
```json
{ "statusCode": 404, "message": "Produto sem oferta ativa para adicionar à lista" }
```

## `PATCH /users/me/list/:id`

Marca ou desmarca um item como comprado. Não remove o item.

**Body**:
```json
{ "purchased": true }
```

**Response 200**: item atualizado (mesmo formato de `GET /users/me/list`).

**Response 404**: item não existe **ou** não pertence à conta autenticada —
mesma resposta para os dois casos (não vaza se o id existe na conta de
outra pessoa).
```json
{ "statusCode": 404, "message": "Item não encontrado" }
```

## `DELETE /users/me/list/:id`

Remove definitivamente um item da lista.

**Response 204**: sem corpo.

**Response 404**: mesma regra de `PATCH` acima — item inexistente ou de
outra conta.
