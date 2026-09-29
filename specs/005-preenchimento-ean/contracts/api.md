# API Contract (poupe-certo-back)

## NOVO `GET /products/ean/:ean/lookup`

- Auth: Bearer (Supabase JWT) — 401 sem token.
- Throttle: 20 req/min.
- `:ean` — 8 a 14 dígitos, senão 400.

**200** (sempre, inclusive quando não encontrado ou OFF indisponível):

```json
{
  "found": true,
  "name": "Leite Condensado Integral moça",
  "brand": "Nestlé",
  "qty": "395 g",
  "category": "fri",
  "imageUrl": "https://images.openfoodfacts.org/images/products/789/100/010/0103/front_pt.34.400.jpg"
}
```

Não encontrado / indisponível: `{ "found": false, "name": null, "brand": null, "qty": null, "category": null, "imageUrl": null }`.

`imageUrl` aqui é a URL de origem (prévia). A cópia no Cloudinary só é feita no cadastro.

## ALTERADO `POST /products`

- Campo `imageUrl` removido do body (se enviado, é descartado).
- Servidor define `imageUrl` do produto (Cloudinary ou `null`). Resposta inalterada.

## ALTERADO `GET /products/:ean`

- Resposta ganha `"imageUrl": string | null`.
