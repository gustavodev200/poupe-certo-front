import { useQuery } from "@tanstack/react-query";

import {
  getProductDetail,
  searchProducts,
  type SearchProductsParams,
} from "@/lib/api/products";

export function useSearchProducts(params: SearchProductsParams) {
  return useQuery({
    queryKey: ["products", "search", params],
    queryFn: () => searchProducts(params),
  });
}

export function useProductDetail(ean: string) {
  return useQuery({
    queryKey: ["products", "detail", ean],
    queryFn: () => getProductDetail(ean),
    enabled: ean.length > 0,
  });
}

