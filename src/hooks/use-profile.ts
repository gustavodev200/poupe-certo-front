import { useQuery } from "@tanstack/react-query";

import {
  getMyContributions,
  getMyStats,
  type ContributionsParams,
} from "@/lib/api/users";

export function useProfileStats() {
  return useQuery({
    queryKey: ["users", "me", "stats"],
    queryFn: getMyStats,
  });
}

export function useContributions(params: ContributionsParams = {}) {
  return useQuery({
    queryKey: ["users", "me", "contributions", params],
    queryFn: () => getMyContributions(params),
  });
}
