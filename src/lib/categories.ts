export const CATEGORY_CODES = [
  "merc",
  "beb",
  "lim",
  "hig",
  "fri",
  "pad",
] as const;

export type CategoryId = (typeof CATEGORY_CODES)[number];

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: "merc", label: "Mercearia", icon: "ShoppingBasket" },
  { id: "beb", label: "Bebidas", icon: "Wine" },
  { id: "lim", label: "Limpeza", icon: "SprayCan" },
  { id: "hig", label: "Higiene", icon: "Droplet" },
  { id: "fri", label: "Frios", icon: "Milk" },
  { id: "pad", label: "Padaria", icon: "Croissant" },
];

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_CODES as readonly string[]).includes(value);
}

export function categoryLabel(id: string | undefined): string | undefined {
  return CATEGORIES.find((c) => c.id === id)?.label;
}
