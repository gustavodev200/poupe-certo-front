import { z } from "zod";

import { api } from "@/lib/api/client";

export const leaderboardEntrySchema = z.object({
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  level: z.number(),
  points: z.number(),
  pricesReported: z.number(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export async function getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
  const { data } = await api.get("/leaderboard", {
    params: limit ? { limit } : undefined,
  });
  return z.array(leaderboardEntrySchema).parse(data);
}
