import { z } from "zod";

import { api } from "@/lib/api/client";
import { CATEGORY_CODES } from "@/lib/categories";

const categorySchema = z.enum(CATEGORY_CODES);

const marketRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const productRefSchema = z.object({
  ean: z.string(),
  name: z.string(),
});

const pendingProductPriceReportSchema = z.object({
  id: z.string(),
  market: marketRefSchema,
  price: z.number(),
});

export const pendingProductSchema = z.object({
  ean: z.string(),
  name: z.string(),
  brand: z.string(),
  qty: z.string(),
  category: categorySchema,
  createdBy: z.string(),
  createdAt: z.string(),
  priceReport: pendingProductPriceReportSchema.nullable(),
});

export const pendingPriceReportSchema = z.object({
  id: z.string(),
  product: productRefSchema,
  market: marketRefSchema,
  price: z.number(),
  reportedBy: z.string(),
  createdAt: z.string(),
});

export const moderationQueueSchema = z.object({
  products: z.array(pendingProductSchema),
  priceReports: z.array(pendingPriceReportSchema),
});

export type PendingProduct = z.infer<typeof pendingProductSchema>;
export type PendingPriceReport = z.infer<typeof pendingPriceReportSchema>;
export type ModerationQueue = z.infer<typeof moderationQueueSchema>;

export type ModerationDecision = "approve" | "reject";

const productDecisionResultSchema = z.object({
  ean: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  pointsReverted: z.number().optional(),
});

const priceReportDecisionResultSchema = z.object({
  id: z.string(),
  status: z.enum(["ACTIVE", "REJECTED"]),
});

export async function getModerationQueue(): Promise<ModerationQueue> {
  const { data } = await api.get("/moderation/queue");
  return moderationQueueSchema.parse(data);
}

export async function decideProduct(ean: string, decision: ModerationDecision) {
  const { data } = await api.patch(
    `/moderation/products/${encodeURIComponent(ean)}`,
    { decision },
  );
  return productDecisionResultSchema.parse(data);
}

export async function decidePriceReport(
  id: string,
  decision: ModerationDecision,
) {
  const { data } = await api.patch(`/moderation/price-reports/${id}`, {
    decision,
  });
  return priceReportDecisionResultSchema.parse(data);
}
