import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  confirmPrice,
  createPriceReport,
  type CreatePriceReportInput,
} from "@/lib/api/price-reports";

export function useCreatePriceReport(ean: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePriceReportInput) => createPriceReport(ean, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "detail", ean] });
      queryClient.invalidateQueries({ queryKey: ["products", "search"] });
    },
  });
}

export function useConfirmPrice(ean: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (priceReportId: string) => confirmPrice(priceReportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "detail", ean] });
    },
  });
}
