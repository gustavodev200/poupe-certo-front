import { describe, expect, it } from "vitest";

import { pendingProductSchema } from "@/lib/api/moderation";

describe("pendingProductSchema", () => {
  const base = {
    ean: "7891234567890",
    name: "Feijão Preto",
    brand: "Camil",
    qty: "1kg",
    category: "merc",
    createdBy: "b1e1b1e1-0000-0000-0000-000000000000",
    createdAt: "2026-09-25T00:00:00.000Z",
  };

  it("parses a pending product with its bundled price report", () => {
    const parsed = pendingProductSchema.parse({
      ...base,
      priceReport: {
        id: "c0ffee00-0000-0000-0000-000000000000",
        market: { id: "b1e1b1e1-0000-0000-0000-000000000000", name: "Mercado B" },
        price: 5.99,
      },
    });
    expect(parsed.priceReport?.price).toBe(5.99);
  });

  it("parses a pending product without a price report yet", () => {
    const parsed = pendingProductSchema.parse({ ...base, priceReport: null });
    expect(parsed.priceReport).toBeNull();
  });
});
