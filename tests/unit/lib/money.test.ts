import { describe, expect, it } from "vitest";

import { maskBRL, parseBRL } from "@/lib/money";

describe("maskBRL", () => {
  it("preenche da direita para a esquerda como centavos", () => {
    expect(maskBRL("7")).toBe("0,07");
    expect(maskBRL("74")).toBe("0,74");
    expect(maskBRL("749")).toBe("7,49");
    expect(maskBRL("123456")).toBe("1.234,56");
  });

  it("ignora caracteres não numéricos e zeros à esquerda", () => {
    expect(maskBRL("R$ 7,49")).toBe("7,49");
    expect(maskBRL("0,07")).toBe("0,07");
    expect(maskBRL("abc")).toBe("");
    expect(maskBRL("000")).toBe("");
  });

  it("apagar um dígito do valor mascarado volta uma casa", () => {
    expect(maskBRL("7,4")).toBe("0,74");
  });

  it("limita a 8 dígitos", () => {
    expect(maskBRL("1234567890")).toBe("123.456,78");
  });
});

describe("parseBRL", () => {
  it("converte valor mascarado em número", () => {
    expect(parseBRL("1.234,56")).toBe(1234.56);
    expect(parseBRL("7,49")).toBe(7.49);
    expect(parseBRL("0,07")).toBe(0.07);
  });

  it("aceita ponto decimal sem vírgula", () => {
    expect(parseBRL("7.49")).toBe(7.49);
  });
});
