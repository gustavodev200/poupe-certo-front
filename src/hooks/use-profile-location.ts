import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, updateMyLocation, type Location } from "@/lib/api/users";
import { useLocationStore } from "@/stores/location-store";
import { useSession } from "@/hooks/use-session";

export function useMyProfile() {
  const setLocation = useLocationStore((s) => s.setLocation);
  const clear = useLocationStore((s) => s.clear);
  const { session } = useSession();

  // Visitante anônimo nunca chama /users/me — só quem já logou tem perfil
  // pra buscar. Sem esse gate, todo mundo que navega deslogado bate 401
  // (e fica preso nos retries do react-query) só pra descobrir que não tem
  // perfil nenhum.
  const query = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!session,
  });

  useEffect(() => {
    if (!query.data) return;
    if (query.data.city && query.data.uf) {
      setLocation(query.data.uf, query.data.city);
    } else {
      clear();
    }
  }, [query.data, setLocation, clear]);

  return query;
}

export function useSaveLocation() {
  const setLocation = useLocationStore((s) => s.setLocation);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Location) => updateMyLocation(input),
    onSuccess: (data) => {
      setLocation(data.uf, data.city);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}
