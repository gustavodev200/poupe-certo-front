import { z } from "zod";

import { api } from "@/lib/api/client";

export const marketSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  uf: z.string().nullable(),
});

export type Market = z.infer<typeof marketSchema>;

export async function listMarkets(): Promise<Market[]> {
  const { data } = await api.get("/markets");
  return z.array(marketSchema).parse(data);
}

export interface CreateMarketInput {
  name: string;
  address?: string;
  city?: string;
  uf?: string;
}

export async function createMarket(input: CreateMarketInput): Promise<Market> {
  const { data } = await api.post("/markets", input);
  return marketSchema.parse(data);
}
