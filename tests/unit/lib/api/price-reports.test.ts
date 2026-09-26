import { describe, expect, it } from "vitest";

import { marketSchema } from "@/lib/api/markets";
import {
  confirmationResultSchema,
  priceReportResultSchema,
} from "@/lib/api/price-reports";

describe("marketSchema", () => {
  it("parses a market with optional fields present", () => {
    const parsed = marketSchema.parse({
      id: "b1e1b1e1-0000-0000-0000-000000000000",
      name: "Mercado B",
      address: "Av. Brasil, 120",
      city: "Goianésia",
      uf: "GO",
    });
    expect(parsed.city).toBe("Goianésia");
  });

  it("parses a market with null optional fields", () => {
    const parsed = marketSchema.parse({
      id: "b1e1b1e1-0000-0000-0000-000000000000",
      name: "Mercado Novo",
      address: null,
      city: null,
      uf: null,
    });
    expect(parsed.address).toBeNull();
  });
});

describe("priceReportResultSchema", () => {
  it("parses an accepted price report", () => {
    const parsed = priceReportResultSchema.parse({
      id: "c0ffee00-0000-0000-0000-000000000000",
      status: "ACTIVE",
      pointsAwarded: 2,
    });
    expect(parsed.status).toBe("ACTIVE");
  });

  it("parses a price report pending review with a message", () => {
    const parsed = priceReportResultSchema.parse({
      id: "c0ffee00-0000-0000-0000-000000000000",
      status: "PENDING_REVIEW",
      pointsAwarded: 2,
      message: "Preço fora do padrão, enviado para revisão",
    });
    expect(parsed.message).toContain("revisão");
  });

  it("rejects an unknown status", () => {
    expect(() =>
      priceReportResultSchema.parse({
        id: "c0ffee00-0000-0000-0000-000000000000",
        status: "REJECTED",
        pointsAwarded: 0,
      })
    ).toThrow();
  });
});

describe("confirmationResultSchema", () => {
  it("parses a confirmation count", () => {
    const parsed = confirmationResultSchema.parse({
      priceReportId: "c0ffee00-0000-0000-0000-000000000000",
      confirmations: 9,
    });
    expect(parsed.confirmations).toBe(9);
  });
});
