import { describe, expect, it } from "vitest";

import { eanLookupSchema, type EanLookup } from "@/lib/api/products";
import { pickPrefill } from "@/lib/ean-prefill";

const FOUND: EanLookup = {
  found: true,
  name: "Leite Condensado",
  brand: "Nestlé",
  qty: "395 g",
  category: "fri",
  imageUrl: "https://images.openfoodfacts.org/x.jpg",
};

describe("pickPrefill", () => {
  it("sugere todos os campos quando o formulário está intocado", () => {
    expect(pickPrefill(FOUND, {}, {})).toEqual({
      name: "Leite Condensado",
      brand: "Nestlé",
      qty: "395 g",
      category: "fri",
    });
  });

  it("não sobrescreve campo editado ou já preenchido", () => {
    expect(
      pickPrefill(FOUND, { brand: "Minha marca" }, { name: true })
    ).toEqual({ qty: "395 g", category: "fri" });
  });

  it("ignora nulos e resultado não encontrado", () => {
    expect(pickPrefill({ ...FOUND, qty: null, category: null }, {}, {})).toEqual(
      { name: "Leite Condensado", brand: "Nestlé" }
    );
    expect(pickPrefill({ ...FOUND, found: false }, {}, {})).toEqual({});
    expect(pickPrefill(undefined, {}, {})).toEqual({});
  });
});

describe("eanLookupSchema", () => {
  it("rejeita categoria desconhecida", () => {
    expect(() =>
      eanLookupSchema.parse({ ...FOUND, category: "xyz" })
    ).toThrow();
  });
});
