import { expect, test } from "@playwright/test";

import { mockAuthSession } from "./fixtures/auth";
import { mockLocation } from "./fixtures/location";
import { mockJson, resetMockRoutes, startMockBackend } from "./fixtures/mock-backend";

const NEW_EAN = "7899999999999";
const MARKET_ID = "b1e1b1e1-0000-0000-0000-000000000000";

test.beforeAll(() => startMockBackend());
test.beforeEach(() => resetMockRoutes());

test("escanear (digitar EAN) → cadastrar produto novo (US2)", async ({ page }) => {
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
  mockJson("GET", new RegExp(`^/products/ean/${NEW_EAN}/exists$`), {
    exists: false,
    approved: false,
  });
  mockJson("GET", /^\/markets$/, [
    { id: MARKET_ID, name: "Mercado B", address: null, city: null, uf: null },
  ]);

  await page.goto("/scan");
  await page.getByPlaceholder("Digitar EAN manualmente").fill(NEW_EAN);
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page).toHaveURL(new RegExp(`/new-product\\?ean=${NEW_EAN}$`));
  await expect(page.getByText(NEW_EAN)).toBeVisible();

  mockJson("POST", /^\/products$/, {
    ean: NEW_EAN,
    status: "PENDING",
    pointsAwarded: 5,
  }, 201);

  await page.getByLabel("Nome do produto").fill("Produto Teste E2E");
  await page.getByLabel("Marca").fill("Marca Teste");
  await page.getByLabel("Quantidade").fill("1kg");
  await page.getByLabel("Categoria").click();
  await page.getByRole("option", { name: "Mercearia" }).click();
  await page.getByLabel("Em qual mercado?").click();
  await page.getByRole("option", { name: "Mercado B" }).click();
  await page.getByLabel("Preço na etiqueta").fill("5,99");

  await page.getByRole("button", { name: /Enviar para aprovação/ }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/enviado para aprovação/i)).toBeVisible();
});

test("EAN conhecido no Open Food Facts chega ao cadastro pré-preenchido", async ({ page }) => {
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
  mockJson("GET", new RegExp(`^/products/ean/${NEW_EAN}/exists$`), {
    exists: false,
    approved: false,
  });
  mockJson("GET", new RegExp(`^/products/ean/${NEW_EAN}/lookup$`), {
    found: true,
    name: "Leite Condensado Moça",
    brand: "Nestlé",
    qty: "395 g",
    category: "fri",
    imageUrl: null,
  });
  mockJson("GET", /^\/markets$/, []);

  await page.goto(`/new-product?ean=${NEW_EAN}`);

  await expect(page.getByLabel("Nome do produto")).toHaveValue("Leite Condensado Moça");
  await expect(page.getByLabel("Marca")).toHaveValue("Nestlé");
  await expect(page.getByLabel("Quantidade")).toHaveValue("395 g");
  await expect(page.getByLabel("Categoria")).toContainText("Frios");
  await expect(page.getByText(/Preenchemos com dados do Open Food Facts/)).toBeVisible();
});
