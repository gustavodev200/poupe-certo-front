import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getMyProducts, type ProductStatus } from "@/lib/api/users";
import { useSession } from "@/hooks/use-session";

const PAGE_SIZE = 20;

export function useMyProducts(status: ProductStatus) {
  const { session } = useSession();
  return useInfiniteQuery({
    queryKey: ["users", "me", "products", status],
    queryFn: ({ pageParam }) =>
      getMyProducts({ status, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    enabled: !!session,
  });
}

// Contador do menu lateral: só lê `counts.PENDING`, então pede 1 item.
// Anônimo nunca chama (mesmo motivo de useMyProfile).
export function usePendingProductsCount() {
  const { session } = useSession();
  const query = useQuery({
    queryKey: ["users", "me", "products", "pending-count"],
    queryFn: () => getMyProducts({ status: "PENDING", pageSize: 1 }),
    enabled: !!session,
    select: (data) => data.counts.PENDING,
  });
  return query.data ?? 0;
}
