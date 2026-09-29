import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addToList,
  getShoppingList,
  removeFromList,
  toggleListItem,
} from "@/lib/api/shopping-list";
import { useSession } from "@/hooks/use-session";

const SHOPPING_LIST_KEY = ["shopping-list"];

export function useShoppingList() {
  const { session } = useSession();
  return useQuery({
    queryKey: SHOPPING_LIST_KEY,
    queryFn: getShoppingList,
    enabled: !!session,
  });
}

export function useAddToList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productEan: string) => addToList(productEan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}

export function useToggleListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, purchased }: { id: string; purchased: boolean }) =>
      toggleListItem(id, purchased),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}

export function useRemoveListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeFromList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}
