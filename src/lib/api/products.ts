import { z } from "zod";

import { api } from "@/lib/api/client";
import { CATEGORY_CODES } from "@/lib/categories";

const categorySchema = z.enum(CATEGORY_CODES);

const marketRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const offerSummarySchema = z.object({
  market: marketRefSchema,
  price: z.number(),
  reportedAt: z.string(),
  confirmations: z.number(),
});

const offerDetailSchema = offerSummarySchema.extend({
  priceReportId: z.string(),
});

const productStatsSchema = z.object({
  lowest: z.number().nullable(),
  average: z.number().nullable(),
  highest: z.number().nullable(),
});

const historyPointSchema = z.object({
  period: z.string(),
  lowestPrice: z.number(),
});

export const productSummarySchema = z.object({
  ean: z.string(),
  name: z.string(),
  brand: z.string(),
  qty: z.string(),
  category: categorySchema,
  lowestOffer: offerSummarySchema.nullable(),
  offerCount: z.number(),
});

export const productDetailSchema = z.object({
  ean: z.string(),
  name: z.string(),
  brand: z.string(),
  qty: z.string(),
  category: categorySchema,
  offers: z.array(offerDetailSchema),
  stats: productStatsSchema,
  history: z.array(historyPointSchema),
});

export const searchProductsResultSchema = z.object({
  items: z.array(productSummarySchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const productExistsSchema = z.object({
  exists: z.boolean(),
  approved: z.boolean(),
});

export const createProductResponseSchema = z.object({
  ean: z.string(),
  status: z.literal("PENDING"),
  pointsAwarded: z.number(),
});

export type OfferSummary = z.infer<typeof offerSummarySchema>;
export type OfferDetail = z.infer<typeof offerDetailSchema>;
export type ProductSummary = z.infer<typeof productSummarySchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type SearchProductsResult = z.infer<typeof searchProductsResultSchema>;
export type ProductExists = z.infer<typeof productExistsSchema>;
export type CreateProductResponse = z.infer<typeof createProductResponseSchema>;

export interface SearchProductsParams {
  q?: string;
  category?: string;
  sort?: "preco" | "recente";
  page?: number;
  pageSize?: number;
}

export async function searchProducts(
  params: SearchProductsParams,
): Promise<SearchProductsResult> {
  const { data } = await api.get("/products/search", { params });
  return searchProductsResultSchema.parse(data);
}

export async function getProductDetail(ean: string): Promise<ProductDetail> {
  const { data } = await api.get(`/products/${encodeURIComponent(ean)}`);
  return productDetailSchema.parse(data);
}

export async function checkEanExists(ean: string): Promise<ProductExists> {
  const { data } = await api.get(
    `/products/ean/${encodeURIComponent(ean)}/exists`,
  );
  return productExistsSchema.parse(data);
}

export interface CreateProductInput {
  ean: string;
  name: string;
  brand: string;
  qty: string;
  category: string;
  imageUrl?: string;
  marketId: string;
  price: number;
}

export async function createProduct(
  input: CreateProductInput,
): Promise<CreateProductResponse> {
  const { data } = await api.post("/products", input);
  return createProductResponseSchema.parse(data);
}
