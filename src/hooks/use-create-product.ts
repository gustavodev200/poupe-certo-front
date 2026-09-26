import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createProduct, type CreateProductInput } from "@/lib/api/products";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "search"] });
    },
  });
}
