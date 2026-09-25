import { z } from "zod";

export const priceReportSchema = z.object({
  market: z.string().min(1, "Escolha um mercado"),
  price: z
    .string()
    .min(1, "Informe o preço")
    .refine((v) => Number(v.replace(",", ".")) > 0, "Preço inválido"),
});

export type PriceReportInput = z.infer<typeof priceReportSchema>;

export const newProductSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  brand: z.string().min(2, "Marca deve ter no mínimo 2 caracteres"),
  qty: z.string().min(1, "Informe a quantidade"),
  category: z.string().min(1, "Escolha uma categoria"),
});

export type NewProductInput = z.infer<typeof newProductSchema>;
