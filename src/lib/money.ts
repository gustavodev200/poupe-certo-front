// Máscara de Reais estilo "caixa registradora": os dígitos entram pela
// direita como centavos — "7" → "0,07", "749" → "7,49", "123456" → "1.234,56".
// Limite de 8 dígitos (R$ 999.999,99) evita número absurdo por dedo pesado.
const MAX_DIGITS = 8;

const BRL = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function maskBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS);
  if (!digits) return "";
  return BRL.format(Number(digits) / 100);
}

// "1.234,56" → 1234.56. Aceita também valor sem máscara ("7,49", "7.49").
export function parseBRL(value: string): number {
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  return Number(normalized);
}
