import { z } from "zod";

import { api } from "@/lib/api/client";

const productRefSchema = z.object({
  ean: z.string(),
  name: z.string(),
  brand: z.string(),
  qty: z.string(),
  imageUrl: z.string().nullable().default(null),
});

const marketRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const shoppingListItemSchema = z.object({
  id: z.string(),
  product: productRefSchema,
  market: marketRefSchema,
  price: z.number(),
  purchased: z.boolean(),
  createdAt: z.string(),
});

export type ShoppingListItem = z.infer<typeof shoppingListItemSchema>;

export async function getShoppingList(): Promise<ShoppingListItem[]> {
  const { data } = await api.get("/users/me/list");
  return z.array(shoppingListItemSchema).parse(data);
}

export async function addToList(productEan: string): Promise<ShoppingListItem> {
  const { data } = await api.post("/users/me/list", { productEan });
  return shoppingListItemSchema.parse(data);
}

export async function toggleListItem(
  id: string,
  purchased: boolean,
): Promise<ShoppingListItem> {
  const { data } = await api.patch(`/users/me/list/${encodeURIComponent(id)}`, {
    purchased,
  });
  return shoppingListItemSchema.parse(data);
}

export async function removeFromList(id: string): Promise<void> {
  await api.delete(`/users/me/list/${encodeURIComponent(id)}`);
}
