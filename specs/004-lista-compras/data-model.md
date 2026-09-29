# Phase 1 Data Model: Minha Lista

## ShoppingListItem (`shopping_list_items`)

Vive em `poupe-certo-back` (Prisma + PostgreSQL/Supabase).

| Campo        | Tipo                | Notas |
|--------------|---------------------|-------|
| `id`         | `uuid`, PK          | `gen_random_uuid()` |
| `user_id`    | `uuid`, FK → `profiles.id` | dono do item; `ON DELETE CASCADE` |
| `product_ean`| `text`, FK → `products.ean` | `ON DELETE CASCADE` (se o produto sumir, o item some) |
| `market_id`  | `uuid`, FK → `markets.id` | `ON DELETE RESTRICT` (mesmo comportamento de `price_reports.market_id` — mercado nunca é apagado silenciosamente debaixo de um item) |
| `price`      | `decimal(10,2)`     | snapshot imutável, copiado no INSERT — ver research.md#1 |
| `purchased`  | `boolean`, default `false` | comprado/pendente (FR-005) |
| `created_at` | `timestamptz`, default `now()` | usado tanto como "adicionado em" quanto para ordenar a lista |

**Constraints**:
- `UNIQUE (user_id, product_ean)` — um item por produto por pessoa (FR-003).
- `CHECK (price > 0)` — mesmo padrão de `price_reports_price_positive`.

**Relationships**:
- `Profile` 1—N `ShoppingListItem` (via `user_id`)
- `Product` 1—N `ShoppingListItem` (via `product_ean`)
- `Market` 1—N `ShoppingListItem` (via `market_id`)

**State transitions**: `purchased` alterna `false ⇄ false/true` via
`PATCH /me/list/:id`; não há outros estados (sem soft-delete — remover é
`DELETE` de verdade, ver research.md e Constitution Check §VI).

## Prisma schema (adição a `schema.prisma`)

```prisma
model ShoppingListItem {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  productEan String   @map("product_ean")
  marketId   String   @map("market_id") @db.Uuid
  price      Decimal  @db.Decimal(10, 2)
  purchased  Boolean  @default(false)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user    Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productEan], references: [ean], onDelete: Cascade)
  market  Market  @relation(fields: [marketId], references: [id])

  @@unique([userId, productEan])
  @@map("shopping_list_items")
}
```

(`Profile`, `Product` e `Market` ganham o `ShoppingListItem[]` correspondente
no lado inverso da relação.)

## RLS (mesma migration que cria a tabela)

Dado 100% privado — diferente de `price_reports`/`price_confirmations`, não
existe policy pública nenhuma aqui:

```sql
ALTER TABLE "public"."shopping_list_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopping_list_items_own_row" ON "public"."shopping_list_items"
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."shopping_list_items" TO authenticated;
```

`FOR ALL` cobre SELECT/INSERT/UPDATE/DELETE com a mesma condição — não há
necessidade de policies separadas por comando já que a regra é idêntica nas
quatro (diferente de `price_reports`, que tem regras diferentes para
select-público vs. insert-próprio vs. update-operador).

## Frontend types (`src/lib/api/shopping-list.ts`)

```ts
const shoppingListItemSchema = z.object({
  id: z.string(),
  product: z.object({ ean: z.string(), name: z.string(), brand: z.string(), qty: z.string() }),
  market: z.object({ id: z.string(), name: z.string() }),
  price: z.number(),
  purchased: z.boolean(),
  createdAt: z.string(),
});
```

Espelha o `ConfirmationResultDto`/`OfferDetail` já existentes — mesmo estilo
de schema Zod por endpoint que o resto de `src/lib/api/`.
