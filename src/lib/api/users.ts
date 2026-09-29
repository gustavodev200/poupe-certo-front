import { z } from "zod";

import { api } from "@/lib/api/client";

export const profileSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  city: z.string().nullable(),
  uf: z.string().nullable(),
  // Default cobre o intervalo de deploy em que o front novo fala com um
  // back que ainda não devolve o campo — sem ele o parse do perfil inteiro
  // falharia. Só decide exibir o item "Admin"; a proteção é o OperatorGuard.
  isOperator: z.boolean().default(false),
  createdAt: z.string(),
});

export const locationSchema = z.object({
  city: z.string(),
  uf: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;
export type Location = z.infer<typeof locationSchema>;

export async function getMe(): Promise<Profile> {
  const { data } = await api.get("/users/me");
  return profileSchema.parse(data);
}

export async function updateMyLocation(input: Location): Promise<Location> {
  const { data } = await api.patch("/users/me/location", input);
  return locationSchema.parse(data);
}

export const profileStatsSchema = z.object({
  pricesReported: z.number(),
  productsCreated: z.number(),
  confirmationsGiven: z.number(),
  confidencePercent: z.number(),
  points: z.number(),
  level: z.number(),
  pointsToNextLevel: z.number(),
  progressPercent: z.number(),
  rankPosition: z.number(),
});

const contributionItemSchema = z.object({
  type: z.enum(["price_report", "product_created"]),
  product: z.object({ ean: z.string(), name: z.string() }),
  market: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  price: z.number().optional(),
  createdAt: z.string(),
});

export const contributionsResultSchema = z.object({
  items: z.array(contributionItemSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export type ProfileStats = z.infer<typeof profileStatsSchema>;
export type ContributionItem = z.infer<typeof contributionItemSchema>;
export type ContributionsResult = z.infer<typeof contributionsResultSchema>;

export async function getMyStats(): Promise<ProfileStats> {
  const { data } = await api.get("/users/me/stats");
  return profileStatsSchema.parse(data);
}

export interface ContributionsParams {
  page?: number;
  pageSize?: number;
}

export async function getMyContributions(
  params: ContributionsParams = {},
): Promise<ContributionsResult> {
  const { data } = await api.get("/users/me/contributions", { params });
  return contributionsResultSchema.parse(data);
}

export const PRODUCT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

const myProductSchema = z.object({
  ean: z.string(),
  name: z.string(),
  brand: z.string(),
  qty: z.string(),
  category: z.string(),
  imageUrl: z.string().nullable(),
  status: z.enum(PRODUCT_STATUSES),
  createdAt: z.string(),
  reviewedAt: z.string().nullable(),
});

export const myProductsResultSchema = z.object({
  items: z.array(myProductSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  counts: z.object({
    PENDING: z.number(),
    APPROVED: z.number(),
    REJECTED: z.number(),
  }),
});

export type MyProduct = z.infer<typeof myProductSchema>;
export type MyProductsResult = z.infer<typeof myProductsResultSchema>;

export interface MyProductsParams {
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
}

export async function getMyProducts(
  params: MyProductsParams = {},
): Promise<MyProductsResult> {
  const { data } = await api.get("/users/me/products", { params });
  return myProductsResultSchema.parse(data);
}
