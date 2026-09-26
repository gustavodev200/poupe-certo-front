import { useQuery } from "@tanstack/react-query";

import { fetchEstados, fetchMunicipios } from "@/lib/api/ibge";

const DIA_EM_MS = 24 * 60 * 60 * 1000;

export function useEstados() {
  return useQuery({
    queryKey: ["ibge", "estados"],
    queryFn: fetchEstados,
    staleTime: Infinity,
  });
}

export function useMunicipios(uf: string | null) {
  return useQuery({
    queryKey: ["ibge", "municipios", uf],
    queryFn: () => fetchMunicipios(uf as string),
    enabled: !!uf,
    staleTime: DIA_EM_MS,
  });
}
