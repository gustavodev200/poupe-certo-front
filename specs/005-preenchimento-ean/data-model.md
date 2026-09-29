# Data Model: Preenchimento automático pelo EAN

Sem migração. Nenhuma tabela nova.

## Product (existente — `products`)

| Campo | Mudança |
|---|---|
| `image_url` | Passa a ser preenchida pelo servidor no cadastro com o `secure_url` do Cloudinary (`https://res.cloudinary.com/<cloud>/image/upload/.../poupe-certo/products/<ean>.<ext>`), ou `null`. Nunca vem do cliente. |

## EanLookup (transitório — só em memória no back)

| Campo | Tipo | Regra |
|---|---|---|
| `found` | boolean | `false` quando OFF não tem o EAN |
| `name` | string \| null | `product_name_pt` ∨ `product_name`, trim, ≤ 200 |
| `brand` | string \| null | primeira marca de `brands` (split `,`), trim, ≤ 120 |
| `qty` | string \| null | `quantity`, trim, ≤ 40 |
| `category` | `merc\|beb\|lim\|hig\|fri\|pad` \| null | mapeamento heurístico de `categories_tags` |
| `imageUrl` | string \| null | `image_front_url` só se https em domínio OFF |

Entrada de cache: `{ value: EanLookup | 'unavailable', expiresAt }` — TTL 24 h (found), 1 h (not found), 1 min (unavailable).
