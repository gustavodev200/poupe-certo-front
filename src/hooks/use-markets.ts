import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMarket,
  listMarkets,
  type CreateMarketInput,
  type Market,
} from "@/lib/api/markets";
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
    onSuccess: (market) => {
      // Já coloca o mercado na lista da cidade dele, pro combobox mostrar o
      // nome selecionado sem esperar o refetch.
      queryClient.setQueryData<Market[]>(
        ["markets", { city: market.city, uf: market.uf }],
        (old) =>
          old && !old.some((m) => m.id === market.id)
            ? [...old, market].sort((a, b) => a.name.localeCompare(b.name))
            : old
      );
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}
