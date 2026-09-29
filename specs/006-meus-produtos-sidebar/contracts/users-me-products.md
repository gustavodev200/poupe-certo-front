# Contracts — 006

## `GET /users/me/products`

Auth: `Authorization: Bearer <supabase access_token>` (obrigatório → 401 sem token).

Query (Zod, `ZodValidationPipe` → 400 se inválido):

| Param | Tipo | Default | Regra |
|---|---|---|---|
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` | — (todos) | opcional |
| `page` | int ≥ 1 | 1 | |
| `pageSize` | int 1–50 | 20 | |

200:

```json
{
  "items": [
    {
      "ean": "7891000100103",
      "name": "Leite Condensado",
      "brand": "Moça",
      "qty": "395 g",
      "category": "merc",
      "imageUrl": "https://res.cloudinary.com/…",
      "status": "PENDING",
      "createdAt": "2026-09-28T12:00:00.000Z",
      "reviewedAt": null
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 3,
  "counts": { "PENDING": 3, "APPROVED": 5, "REJECTED": 1 }
}
```

- `total` = total do filtro aplicado (`status` ou todos).
- `counts` sempre traz os três status (0 quando vazio), independente do filtro.
- Ordenação: `createdAt desc, ean asc`.
- Só produtos com `createdBy = <usuário do token>`.

## `GET /users/me` (alterado)

Resposta ganha campo:

```json
{ "…": "…", "isOperator": false }
```
