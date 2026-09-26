import { describe, expect, it } from "vitest";

import {
  createMarketSchema,
  newProductSchema,
  priceReportSchema,
} from "@/lib/validations/price-report";

describe("priceReportSchema", () => {
  it("accepts a valid marketId and price", () => {
    const parsed = priceReportSchema.parse({
      marketId: "b1e1b1e1-0000-0000-0000-000000000000",
      price: "25,90",
    });
    expect(parsed.price).toBe("25,90");
  });

  it("rejects an empty marketId", () => {
    const result = priceReportSchema.safeParse({ marketId: "", price: "10" });
    expect(result.success).toBe(false);
  });

  it("rejects a price of zero or negative", () => {
    expect(
      priceReportSchema.safeParse({ marketId: "m1", price: "0" }).success
    ).toBe(false);
    expect(
      priceReportSchema.safeParse({ marketId: "m1", price: "-5" }).success
    ).toBe(false);
  });

  it("rejects a non-numeric price", () => {
    expect(
      priceReportSchema.safeParse({ marketId: "m1", price: "abc" }).success
    ).toBe(false);
  });
});

describe("newProductSchema", () => {
  it("accepts a valid product with a known category", () => {
    const parsed = newProductSchema.parse({
      name: "Feijão Preto",
      brand: "Camil",
      qty: "1kg",
      category: "merc",
    });
    expect(parsed.category).toBe("merc");
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(
      newProductSchema.safeParse({
        name: "F",
        brand: "Camil",
        qty: "1kg",
        category: "merc",
      }).success
    ).toBe(false);
  });

  it("rejects a category outside the known set", () => {
    expect(
      newProductSchema.safeParse({
        name: "Feijão",
        brand: "Camil",
        qty: "1kg",
        category: "eletronicos",
      }).success
    ).toBe(false);
  });
});

describe("createMarketSchema", () => {
  it("accepts a market with just a name", () => {
    const parsed = createMarketSchema.parse({ name: "Mercado Novo" });
    expect(parsed.name).toBe("Mercado Novo");
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(createMarketSchema.safeParse({ name: "M" }).success).toBe(false);
  });
});
