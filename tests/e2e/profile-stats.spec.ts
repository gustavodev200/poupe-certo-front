import { expect, test } from "@playwright/test";

import { mockAuthSession } from "./fixtures/auth";
import { mockLocation } from "./fixtures/location";
import { mockJson, resetMockRoutes, startMockBackend } from "./fixtures/mock-backend";

test.beforeAll(() => startMockBackend());
test.beforeEach(() => resetMockRoutes());

test("abrir perfil autenticado → ver estatísticas reais (US3)", async ({ page }) => {
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
  mockJson("GET", /^\/users\/me\/stats$/, {
    pricesReported: 87,
    productsCreated: 32,
    confirmationsGiven: 24,
    confidencePercent: 96,
    points: 132,
    level: 4,
    pointsToNextLevel: 68,
    progressPercent: 66,
    rankPosition: 8,
  });
  mockJson("GET", /^\/users\/me\/contributions$/, {
    items: [
      {
        type: "price_report",
        product: { ean: "7891234567890", name: "Arroz Camil 5kg" },
        market: { id: "b1e1b1e1-0000-0000-0000-000000000000", name: "Mercado B" },
        price: 25.9,
        createdAt: new Date().toISOString(),
      },
    ],
    page: 1,
    pageSize: 10,
    total: 1,
  });

  await page.goto("/profile");

  await expect(page.getByText("Nível 4 · 132 pts")).toBeVisible();
  await expect(page.getByText("68 pontos para o próximo nível")).toBeVisible();
  await expect(page.getByText("8º no ranking")).toBeVisible();
  await expect(page.getByText("87", { exact: true })).toBeVisible();
  await expect(page.getByText("Arroz Camil 5kg")).toBeVisible();
});

test("perfil sem sessão redireciona para login", async ({ page }) => {
  await mockLocation(page);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile$/);
});
