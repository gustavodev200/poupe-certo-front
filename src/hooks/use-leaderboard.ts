import { useQuery } from "@tanstack/react-query";

import { getLeaderboard } from "@/lib/api/leaderboard";

export function useLeaderboard(limit?: number) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: () => getLeaderboard(limit),
  });
}
