import { describe, expect, it } from "vitest";

import {
  contributionsResultSchema,
  myProductsResultSchema,
  profileSchema,
  profileStatsSchema,
} from "@/lib/api/users";

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

describe("profileSchema.isOperator", () => {
  const base = {
    id: "00000000-0000-4000-8000-000000000000",
    email: "e2e@poupecerto.test",
    displayName: null,
    avatarUrl: null,
    city: null,
    uf: null,
    createdAt: "2026-09-28T12:00:00.000Z",
  };

  it("defaults to false when the backend omits it", () => {
    expect(profileSchema.parse(base).isOperator).toBe(false);
  });

  it("keeps true when sent", () => {
    expect(profileSchema.parse({ ...base, isOperator: true }).isOperator).toBe(true);
  });
});

describe("myProductsResultSchema", () => {
  const item = {
    ean: "7891000100103",
    name: "Leite Condensado",
    brand: "Moça",
    qty: "395 g",
    category: "merc",
    imageUrl: null,
    status: "PENDING",
    createdAt: "2026-09-28T12:00:00.000Z",
    reviewedAt: null,
  };
  const counts = { PENDING: 1, APPROVED: 0, REJECTED: 0 };

  it("parses a page of own products with counts", () => {
    const parsed = myProductsResultSchema.parse({
      items: [item],
      page: 1,
      pageSize: 20,
      total: 1,
      counts,
    });
    expect(parsed.items[0].status).toBe("PENDING");
    expect(parsed.counts.PENDING).toBe(1);
  });

  it("rejects an unknown status", () => {
    expect(() =>
      myProductsResultSchema.parse({
        items: [{ ...item, status: "pending" }],
        page: 1,
        pageSize: 20,
        total: 1,
        counts,
      })
    ).toThrow();
  });

  it("rejects a response without counts", () => {
    expect(() =>
      myProductsResultSchema.parse({ items: [], page: 1, pageSize: 20, total: 0 })
    ).toThrow();
  });
});
