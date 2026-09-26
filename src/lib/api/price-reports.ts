import { z } from "zod";

import { api } from "@/lib/api/client";

export const priceReportResultSchema = z.object({
  id: z.string(),
  status: z.enum(["ACTIVE", "PENDING_REVIEW"]),
  pointsAwarded: z.number(),
  message: z.string().optional(),
});

export const confirmationResultSchema = z.object({
  priceReportId: z.string(),
  confirmations: z.number(),
});

export type PriceReportResult = z.infer<typeof priceReportResultSchema>;
export type ConfirmationResult = z.infer<typeof confirmationResultSchema>;

export interface CreatePriceReportInput {
  marketId: string;
  price: number;
}

export async function createPriceReport(
  ean: string,
  input: CreatePriceReportInput,
): Promise<PriceReportResult> {
  const { data } = await api.post(
    `/products/${encodeURIComponent(ean)}/price-reports`,
    input,
  );
  return priceReportResultSchema.parse(data);
}

export async function confirmPrice(
  priceReportId: string,
): Promise<ConfirmationResult> {
  const { data } = await api.post(
    `/price-reports/${encodeURIComponent(priceReportId)}/confirmations`,
  );
  return confirmationResultSchema.parse(data);
}
