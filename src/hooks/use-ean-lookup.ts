import { useQuery } from "@tanstack/react-query";

import { lookupEan } from "@/lib/api/products";

const EAN_PATTERN = /^\d{8,14}$/;

// Uma consulta por EAN por sessão: sem refetch, sem retry — o backend já
// cacheia e deduplica, e falha aqui só significa "preencher na mão".
export function useEanLookup(ean: string, enabled = true) {
  return useQuery({
    queryKey: ["products", "ean-lookup", ean],
    queryFn: () => lookupEan(ean),
    enabled: enabled && EAN_PATTERN.test(ean),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
