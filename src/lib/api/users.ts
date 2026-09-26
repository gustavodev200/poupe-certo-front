import { z } from "zod";

import { api } from "@/lib/api/client";

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
