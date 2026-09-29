import { mockRoute } from "./mock-backend";

type Status = "PENDING" | "APPROVED" | "REJECTED";

export interface MockMyProduct {
  ean: string;
  name: string;
  status: Status;
  imageUrl?: string | null;
}

/**
 * Registra `GET /users/me/products` filtrando por `status` e paginando
 * como o backend real (contrato em specs/006-meus-produtos-sidebar/contracts).
 */
export function mockMyProducts(products: MockMyProduct[]) {
  mockRoute("GET", /^\/users\/me\/products$/, (_match, _body, query) => {
    const status = query.get("status") as Status | null;
    const page = Number(query.get("page") ?? 1);
    const pageSize = Number(query.get("pageSize") ?? 20);
    const filtered = status ? products.filter((p) => p.status === status) : products;
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const p of products) counts[p.status] += 1;

    return {
      json: {
        items: filtered.slice((page - 1) * pageSize, page * pageSize).map((p) => ({
          ean: p.ean,
          name: p.name,
          brand: "Marca",
          qty: "1 un",
          category: "merc",
          imageUrl: p.imageUrl ?? null,
          status: p.status,
          createdAt: "2026-09-28T12:00:00.000Z",
          reviewedAt: p.status === "PENDING" ? null : "2026-09-28T13:00:00.000Z",
        })),
        page,
        pageSize,
        total: filtered.length,
        counts,
      },
    };
  });
}

export const ME = {
  id: "00000000-0000-4000-8000-000000000000",
  email: "e2e@poupecerto.test",
  displayName: "E2E Test",
  avatarUrl: null,
  city: "Goianésia",
  uf: "GO",
  createdAt: "2026-09-28T12:00:00.000Z",
};
