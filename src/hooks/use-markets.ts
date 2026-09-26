import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMarket, listMarkets, type CreateMarketInput } from "@/lib/api/markets";

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: listMarkets,
  });
}

export function useCreateMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMarketInput) => createMarket(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}
