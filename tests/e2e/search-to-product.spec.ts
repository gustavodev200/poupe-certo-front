import { expect, test } from "@playwright/test";

import { mockLocation } from "./fixtures/location";
import {
  mockJson,
  resetMockRoutes,
  startMockBackend,
} from "./fixtures/mock-backend";

const EAN = "7891234567890";

const searchResult = {
  items: [
    {
      ean: EAN,
      name: "Arroz Camil Tipo 1",
      brand: "Camil",
      qty: "5kg",
      category: "merc",
      lowestOffer: {
        market: { id: "b1e1b1e1-0000-0000-0000-000000000000", name: "Mercado B" },
        price: 25.9,
        reportedAt: new Date().toISOString(),
        confirmations: 8,
      },
      offerCount: 4,
    },
  ],
  page: 1,
  pageSize: 20,
  total: 1,
};

const productDetail = {
  ean: EAN,
  name: "Arroz Camil Tipo 1",
  brand: "Camil",
  qty: "5kg",
  category: "merc",
  offers: [
    {
      market: { id: "b1e1b1e1-0000-0000-0000-000000000000", name: "Mercado B" },
      price: 25.9,
      reportedAt: new Date().toISOString(),
      confirmations: 8,
      priceReportId: "c0ffee00-0000-0000-0000-000000000000",
    },
  ],
  stats: { lowest: 25.9, average: 25.9, highest: 25.9 },
  history: [{ period: "set 2", lowestPrice: 25.9 }],
};

test.beforeAll(() => startMockBackend());
test.beforeEach(() => resetMockRoutes());

test.describe("Buscar e comparar preços reais (US1)", () => {
  test("busca por termo mostra resultado real e abre o detalhe do produto", async ({
    page,
  }) => {
    await mockLocation(page);
    mockJson("GET", /^\/products\/search$/, searchResult);
    mockJson("GET", new RegExp(`^/products/${EAN}$`), productDetail);
    mockJson("GET", /^\/leaderboard$/, []);
    mockJson("GET", /^\/markets$/, []);

    await page.goto("/search?q=arroz");

    await expect(page.getByText("Arroz Camil Tipo 1")).toBeVisible();
    await expect(page.getByText("R$ 25,90")).toBeVisible();

    await page.getByText("Arroz Camil Tipo 1").click();

    await expect(page).toHaveURL(new RegExp(`/product/${EAN}$`));
    await expect(
      page.getByRole("heading", { name: "Arroz Camil Tipo 1" })
    ).toBeVisible();
    await expect(page.getByText("Mercado B").first()).toBeVisible();
  });

  test("busca sem resultado mostra estado vazio, sem crash", async ({ page }) => {
    await mockLocation(page);
    mockJson("GET", /^\/products\/search$/, {
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });

    await page.goto("/search?q=produto-inexistente-xyz");

    await expect(page.getByText("Nenhum produto encontrado")).toBeVisible();
  });
});
