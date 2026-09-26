import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  decidePriceReport,
  decideProduct,
  getModerationQueue,
  type ModerationDecision,
} from "@/lib/api/moderation";
import { mapApiError } from "@/lib/api/errors";

export const MODERATION_QUEUE_KEY = ["moderation", "queue"];

export function useModerationQueue() {
  return useQuery({
    queryKey: MODERATION_QUEUE_KEY,
    queryFn: getModerationQueue,
    retry: false,
  });
}

export function useDecideProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ean, decision }: { ean: string; decision: ModerationDecision }) =>
      decideProduct(ean, decision),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: MODERATION_QUEUE_KEY });
      toast.success(
        result.status === "APPROVED" ? "Produto aprovado." : "Produto rejeitado.",
      );
    },
    onError: (error) => toast.error(mapApiError(error)),
  });
}

export function useDecidePriceReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: ModerationDecision }) =>
      decidePriceReport(id, decision),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: MODERATION_QUEUE_KEY });
      toast.success(
        result.status === "ACTIVE" ? "Preço aprovado." : "Preço rejeitado.",
      );
    },
    onError: (error) => toast.error(mapApiError(error)),
  });
}
