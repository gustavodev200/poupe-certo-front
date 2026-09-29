import { z } from "zod";

import { CATEGORY_CODES } from "@/lib/categories";
import { parseBRL } from "@/lib/money";

export const priceReportSchema = z.object({
  marketId: z.string().min(1, "Escolha um mercado"),
  price: z
    .string()
    .min(1, "Informe o preço")
    .refine((v) => parseBRL(v) > 0, "Preço inválido"),
});

export type PriceReportInput = z.infer<typeof priceReportSchema>;

export const newProductSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  brand: z.string().min(2, "Marca deve ter no mínimo 2 caracteres"),
  qty: z.string().min(1, "Informe a quantidade"),
  category: z.enum(CATEGORY_CODES, { error: "Escolha uma categoria" }),
  marketId: z.string().min(1, "Escolha um mercado"),
  price: z
    .string()
    .min(1, "Informe o preço")
    .refine((v) => parseBRL(v) > 0, "Preço inválido"),
});

export type NewProductInput = z.infer<typeof newProductSchema>;

export const createMarketSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  address: z.string().optional(),
  city: z.string().optional(),
  uf: z.string().optional(),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;
