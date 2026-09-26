import { useQuery } from "@tanstack/react-query";

import {
  getProductDetail,
  searchProducts,
  type SearchProductsParams,
} from "@/lib/api/products";
import { useLocationStore } from "@/stores/location-store";

export function useSearchProducts(params: SearchProductsParams) {
  const uf = useLocationStore((s) => s.uf);
  const city = useLocationStore((s) => s.city);
  const scoped = { ...params, city: city ?? undefined, uf: uf ?? undefined };

  return useQuery({
    queryKey: ["products", "search", scoped],
    queryFn: () => searchProducts(scoped),
  });
}

export function useProductDetail(ean: string) {
  const uf = useLocationStore((s) => s.uf);
  const city = useLocationStore((s) => s.city);

  return useQuery({
    queryKey: ["products", "detail", ean, { city, uf }],
    queryFn: () =>
      getProductDetail(ean, { city: city ?? undefined, uf: uf ?? undefined }),
    enabled: ean.length > 0,
  });
}

