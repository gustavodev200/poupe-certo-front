import { expect, test } from "@playwright/test";

import { mockAuthSession } from "./fixtures/auth";
import { mockLocation } from "./fixtures/location";
import { mockJson, resetMockRoutes, startMockBackend } from "./fixtures/mock-backend";

const EAN = "7891234567890";
const MARKET_ID = "b1e1b1e1-0000-0000-0000-000000000000";

const productDetail = {
  ean: EAN,
  name: "Arroz Camil Tipo 1",
  brand: "Camil",
  qty: "5kg",
  category: "merc",
  offers: [
    {
      market: { id: MARKET_ID, name: "Mercado B" },
      price: 25.9,
      reportedAt: new Date().toISOString(),
      confirmations: 8,
      priceReportId: "c0ffee00-0000-0000-0000-000000000000",
    },
  ],
  stats: { lowest: 25.9, average: 25.9, highest: 25.9 },
  history: [],
};

test.beforeAll(() => startMockBackend());
test.beforeEach(() => resetMockRoutes());

test("escanear (digitar EAN) → reportar preço (US2)", async ({ page }) => {
  await mockAuthSession(page);
  await mockLocation(page);
  mockJson("GET", /^\/users\/me$/, {
    id: "00000000-0000-4000-8000-000000000000",
    email: "e2e@poupecerto.test",
    displayName: "E2E Test",
    avatarUrl: null,
    city: "Goianésia",
    uf: "GO",
    createdAt: new Date().toISOString(),
  });
  mockJson("GET", new RegExp(`^/products/ean/${EAN}/exists$`), {
    exists: true,
    approved: true,
  });
  mockJson("GET", new RegExp(`^/products/${EAN}$`), productDetail);
  mockJson("GET", /^\/markets$/, [{ id: MARKET_ID, name: "Mercado B", address: null, city: null, uf: null }]);

  await page.goto("/scan");
  await page.getByPlaceholder("Digitar EAN manualmente").fill(EAN);
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page).toHaveURL(new RegExp(`/confirm-price\\?ean=${EAN}$`));
  await expect(page.getByText("Arroz Camil Tipo 1")).toBeVisible();

  mockJson("POST", new RegExp(`^/products/${EAN}/price-reports$`), {
    id: "d0ffee00-0000-0000-0000-000000000000",
    status: "ACTIVE",
    pointsAwarded: 2,
  }, 201);

  await page.getByLabel("Em qual mercado?").click();
  await page.getByRole("option", { name: "Mercado B" }).click();
  await page.getByLabel("Preço na etiqueta").fill("24,90");
  await page.getByRole("button", { name: /Registrar preço/ }).click();

  await expect(page).toHaveURL(new RegExp(`/product/${EAN}$`));
  await expect(page.getByText(/\+2 pontos/i)).toBeVisible();
});
