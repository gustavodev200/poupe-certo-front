import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMarket, listMarkets, type CreateMarketInput } from "@/lib/api/markets";
import { useLocationStore } from "@/stores/location-store";

export function useMarkets() {
  const uf = useLocationStore((s) => s.uf);
  const city = useLocationStore((s) => s.city);

  return useQuery({
    queryKey: ["markets", { city, uf }],
    queryFn: () => listMarkets({ city: city ?? undefined, uf: uf ?? undefined }),
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
