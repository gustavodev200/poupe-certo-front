# Data Model — 006

Sem mudanças de schema/migration. Entidades lidas:

## Product (existente — `products`)

| Campo | Uso nesta feature |
|---|---|
| `ean` | chave, exibido |
| `name`, `brand`, `qty`, `category`, `imageUrl` | exibidos no card |
| `status` (`PENDING` \| `APPROVED` \| `REJECTED`) | aba; link só se `APPROVED` |
| `createdBy` | filtro obrigatório = pessoa logada |
| `createdAt` | ordenação desc + "enviado em" |
| `reviewedAt` | "revisado em" (aprovado/rejeitado) |

Transições (fora desta feature, só leitura aqui): `PENDING → APPROVED | REJECTED` via `PATCH /moderation/products/:ean` (operador).

Acesso: RLS `products_select_own` (created_by = auth.uid()) + `where createdBy` no service.

## Profile (existente — `profiles`)

Campo novo **na resposta** de `GET /users/me`: `isOperator: boolean` (coluna `is_operator` já existe; leitura own-row pela role `authenticated`).
