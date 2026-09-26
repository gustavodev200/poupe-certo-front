import { describe, expect, it } from "vitest";

import { contributionsResultSchema, profileStatsSchema } from "@/lib/api/users";

describe("profileStatsSchema", () => {
  it("parses full profile stats", () => {
    const parsed = profileStatsSchema.parse({
      pricesReported: 87,
      productsCreated: 32,
      confirmationsGiven: 24,
      confidencePercent: 96,
      points: 132,
      level: 2,
      pointsToNextLevel: 68,
      progressPercent: 32,
      rankPosition: 8,
    });
    expect(parsed.rankPosition).toBe(8);
  });
});

describe("contributionsResultSchema", () => {
  it("parses a price_report contribution", () => {
    const parsed = contributionsResultSchema.parse({
      items: [
        {
          type: "price_report",
          product: { ean: "7891234567890", name: "Arroz Camil" },
          market: { id: "b1e1b1e1-0000-0000-0000-000000000000", name: "Mercado B" },
          price: 25.9,
          createdAt: "2026-09-25T00:00:00.000Z",
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    expect(parsed.items[0].price).toBe(25.9);
  });

  it("parses a product_created contribution without market/price", () => {
    const parsed = contributionsResultSchema.parse({
      items: [
        {
          type: "product_created",
          product: { ean: "7891234567891", name: "Feijão Preto" },
          createdAt: "2026-09-25T00:00:00.000Z",
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    expect(parsed.items[0].market).toBeUndefined();
    expect(parsed.items[0].type).toBe("product_created");
  });

  it("rejects an unknown contribution type", () => {
    expect(() =>
      contributionsResultSchema.parse({
        items: [
          {
            type: "unknown_type",
            product: { ean: "7891234567891", name: "Feijão Preto" },
            createdAt: "2026-09-25T00:00:00.000Z",
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      })
    ).toThrow();
  });
});
