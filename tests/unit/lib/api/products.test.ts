import { describe, expect, it } from "vitest";

import {
  createProductResponseSchema,
  productDetailSchema,
  productExistsSchema,
  productSummarySchema,
  searchProductsResultSchema,
} from "@/lib/api/products";

const validOffer = {
  market: { id: "b1e1b1e1-0000-0000-0000-000000000000", name: "Mercado B" },
  price: 25.9,
  reportedAt: "2026-09-25T00:00:00.000Z",
  confirmations: 8,
};

describe("productSummarySchema", () => {
  it("parses a valid product summary with an offer", () => {
    const parsed = productSummarySchema.parse({
      ean: "7891234567890",
      name: "Arroz Camil Tipo 1",
      brand: "Camil",
      qty: "5kg",
      category: "merc",
      lowestOffer: validOffer,
      offerCount: 4,
    });
    expect(parsed.lowestOffer?.price).toBe(25.9);
  });

  it("parses a product summary without offers yet", () => {
    const parsed = productSummarySchema.parse({
      ean: "7891234567891",
      name: "Produto novo",
      brand: "Marca",
      qty: "1kg",
      category: "merc",
      lowestOffer: null,
      offerCount: 0,
    });
    expect(parsed.lowestOffer).toBeNull();
  });

  it("rejects an unknown category code", () => {
    expect(() =>
      productSummarySchema.parse({
        ean: "7891234567890",
        name: "Arroz",
        brand: "Camil",
        qty: "5kg",
        category: "invalid-category",
        lowestOffer: null,
        offerCount: 0,
      })
    ).toThrow();
  });

  it("rejects a malformed payload (missing required fields)", () => {
    expect(() => productSummarySchema.parse({ ean: "123" })).toThrow();
  });
});

describe("searchProductsResultSchema", () => {
  it("parses a paginated search result", () => {
    const parsed = searchProductsResultSchema.parse({
      items: [
        {
          ean: "7891234567890",
          name: "Arroz",
          brand: "Camil",
          qty: "5kg",
          category: "merc",
          lowestOffer: validOffer,
          offerCount: 1,
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    expect(parsed.total).toBe(1);
    expect(parsed.items).toHaveLength(1);
  });
});

describe("productDetailSchema", () => {
  it("parses full product detail with offers/stats/history", () => {
    const parsed = productDetailSchema.parse({
      ean: "7891234567890",
      name: "Arroz Camil Tipo 1",
      brand: "Camil",
      qty: "5kg",
      category: "merc",
      offers: [
        { ...validOffer, priceReportId: "c0ffee00-0000-0000-0000-000000000000" },
      ],
      stats: { lowest: 25.9, average: 27.65, highest: 29.9 },
      history: [{ period: "2026-08-1", lowestPrice: 27.9 }],
    });
    expect(parsed.offers[0].priceReportId).toBe(
      "c0ffee00-0000-0000-0000-000000000000"
    );
  });

  it("accepts null stats when there is no offer yet", () => {
    const parsed = productDetailSchema.parse({
      ean: "7891234567890",
      name: "Arroz",
      brand: "Camil",
      qty: "5kg",
      category: "merc",
      offers: [],
      stats: { lowest: null, average: null, highest: null },
      history: [],
    });
    expect(parsed.stats.lowest).toBeNull();
  });
});

describe("productExistsSchema", () => {
  it("parses exists/approved booleans", () => {
    expect(
      productExistsSchema.parse({ exists: true, approved: false })
    ).toEqual({ exists: true, approved: false });
  });
});

describe("createProductResponseSchema", () => {
  it("parses the pending-approval response", () => {
    const parsed = createProductResponseSchema.parse({
      ean: "7891234567891",
      status: "PENDING",
      pointsAwarded: 5,
    });
    expect(parsed.status).toBe("PENDING");
  });

  it("rejects a status other than PENDING", () => {
    expect(() =>
      createProductResponseSchema.parse({
        ean: "7891234567891",
        status: "APPROVED",
        pointsAwarded: 5,
      })
    ).toThrow();
  });
});
