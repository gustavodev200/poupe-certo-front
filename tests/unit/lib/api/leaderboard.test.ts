import { describe, expect, it } from "vitest";
import { z } from "zod";

import { leaderboardEntrySchema } from "@/lib/api/leaderboard";

describe("leaderboardEntrySchema", () => {
  it("parses a public leaderboard entry", () => {
    const parsed = leaderboardEntrySchema.parse({
      displayName: "Marina Alves",
      avatarUrl: "https://example.com/avatar.png",
      level: 7,
      points: 780,
      pricesReported: 156,
    });
    expect(parsed.points).toBe(780);
  });

  it("accepts null displayName/avatarUrl", () => {
    const parsed = leaderboardEntrySchema.parse({
      displayName: null,
      avatarUrl: null,
      level: 1,
      points: 0,
      pricesReported: 0,
    });
    expect(parsed.displayName).toBeNull();
  });

  it("never carries an email field (public data only)", () => {
    expect(
      "email" in leaderboardEntrySchema.shape
    ).toBe(false);
  });

  it("rejects a malformed list", () => {
    const listSchema = z.array(leaderboardEntrySchema);
    expect(() => listSchema.parse([{ points: "not-a-number" }])).toThrow();
  });
});
