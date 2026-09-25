export type Offer = {
  market: string;
  distance: string;
  price: number;
  reportedAt: string; // ISO date
  confirmations: number;
};

export type HistoryPoint = {
  label: string;
  price: number;
};

export type Product = {
  ean: string;
  name: string;
  brand: string;
  qty: string;
  category: CategoryId;
  offers: Offer[];
  history: HistoryPoint[];
};

export type CategoryId =
  | "merc"
  | "beb"
  | "lim"
  | "hig"
  | "fri"
  | "pad";

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: "merc", label: "Mercearia", icon: "ShoppingBasket" },
  { id: "beb", label: "Bebidas", icon: "Wine" },
  { id: "lim", label: "Limpeza", icon: "SprayCan" },
  { id: "hig", label: "Higiene", icon: "Droplet" },
  { id: "fri", label: "Frios", icon: "Milk" },
  { id: "pad", label: "Padaria", icon: "Croissant" },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const PRODUCTS: Product[] = [
  {
    ean: "7891234567890",
    name: "Arroz Camil Tipo 1",
    brand: "Camil",
    qty: "5kg",
    category: "merc",
    offers: [
      { market: "Mercado B", distance: "2,3 km", price: 25.9, reportedAt: daysAgo(0), confirmations: 8 },
      { market: "Mercado A", distance: "1,4 km", price: 27.9, reportedAt: daysAgo(0), confirmations: 5 },
      { market: "Mercado X", distance: "0,8 km", price: 28.9, reportedAt: daysAgo(5), confirmations: 2 },
      { market: "Mercado C", distance: "3,1 km", price: 29.9, reportedAt: daysAgo(12), confirmations: 1 },
    ],
    history: [
      { label: "jul 1", price: 29.9 },
      { label: "jul 2", price: 28.9 },
      { label: "ago 1", price: 27.9 },
      { label: "ago 2", price: 26.9 },
      { label: "set 1", price: 25.9 },
      { label: "set 2", price: 25.9 },
    ],
  },
  {
    ean: "7899876543210",
    name: "Feijão Carioca Camil",
    brand: "Camil",
    qty: "1kg",
    category: "merc",
    offers: [
      { market: "Mercado A", distance: "1,4 km", price: 7.49, reportedAt: daysAgo(0), confirmations: 6 },
      { market: "Mercado B", distance: "2,3 km", price: 8.2, reportedAt: daysAgo(2), confirmations: 3 },
      { market: "Mercado X", distance: "0,8 km", price: 8.9, reportedAt: daysAgo(9), confirmations: 1 },
    ],
    history: [
      { label: "jul 2", price: 8.9 },
      { label: "ago 1", price: 8.9 },
      { label: "ago 2", price: 8.2 },
      { label: "set 1", price: 7.49 },
      { label: "set 2", price: 7.49 },
    ],
  },
  {
    ean: "7896543219870",
    name: "Leite Italac Integral",
    brand: "Italac",
    qty: "1L",
    category: "fri",
    offers: [
      { market: "Mercado X", distance: "0,8 km", price: 5.19, reportedAt: daysAgo(3), confirmations: 4 },
      { market: "Mercado A", distance: "1,4 km", price: 5.49, reportedAt: daysAgo(1), confirmations: 5 },
      { market: "Mercado C", distance: "3,1 km", price: 5.79, reportedAt: daysAgo(15), confirmations: 1 },
    ],
    history: [
      { label: "jul 2", price: 5.79 },
      { label: "ago 1", price: 5.79 },
      { label: "ago 2", price: 5.49 },
      { label: "set 1", price: 5.19 },
      { label: "set 2", price: 5.19 },
    ],
  },
  {
    ean: "7891112223330",
    name: "Café Pilão Torrado e Moído",
    brand: "Pilão",
    qty: "500g",
    category: "merc",
    offers: [
      { market: "Mercado A", distance: "1,4 km", price: 12.9, reportedAt: daysAgo(0), confirmations: 7 },
      { market: "Mercado B", distance: "2,3 km", price: 13.5, reportedAt: daysAgo(4), confirmations: 2 },
      { market: "Mercado X", distance: "0,8 km", price: 15.9, reportedAt: daysAgo(20), confirmations: 1 },
    ],
    history: [
      { label: "jul 2", price: 15.9 },
      { label: "ago 1", price: 15.9 },
      { label: "ago 2", price: 13.5 },
      { label: "set 1", price: 12.9 },
      { label: "set 2", price: 12.9 },
    ],
  },
];

export const MARKETS = [
  { name: "Mercado X", address: "Av. Central, 900", distance: "0,8 km", count: 312 },
  { name: "Mercado A", address: "R. das Flores, 45", distance: "1,4 km", count: 245 },
  { name: "Mercado B", address: "Av. Brasil, 120", distance: "2,3 km", count: 198 },
  { name: "Mercado C", address: "R. 7 de Setembro, 88", distance: "3,1 km", count: 87 },
];

export function getProductByEan(ean: string): Product | undefined {
  return PRODUCTS.find((p) => p.ean === ean);
}

export function searchProducts(query: string, category?: string): Product[] {
  const q = query.trim().toLowerCase();
  return PRODUCTS.filter((p) => {
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q);
    const matchesCategory =
      !category || category === "all" || p.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS;
}

export function lowestOffer(product: Product): Offer {
  return [...product.offers].sort((a, b) => a.price - b.price)[0];
}
