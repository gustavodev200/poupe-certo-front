import type { EanLookup } from "@/lib/api/products";
import type { NewProductInput } from "@/lib/validations/price-report";

type PrefillField = "name" | "brand" | "qty" | "category";

export type Prefill = Partial<Pick<NewProductInput, PrefillField>>;

const FIELDS: PrefillField[] = ["name", "brand", "qty", "category"];

// Só sugere campos que a pessoa ainda não tocou nem preencheu — o que ela
// digitou nunca é sobrescrito pela sugestão (FR-009).
export function pickPrefill(
  lookup: EanLookup | undefined,
  current: Partial<Record<PrefillField, unknown>>,
  dirty: Partial<Record<PrefillField, boolean | undefined>>,
): Prefill {
  if (!lookup?.found) return {};
  const prefill: Prefill = {};
  for (const field of FIELDS) {
    const value = lookup[field];
    if (!value || dirty[field] || current[field]) continue;
    Object.assign(prefill, { [field]: value });
  }
  return prefill;
}
