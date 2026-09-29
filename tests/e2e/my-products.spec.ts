import { expect, test } from "@playwright/test";

import { mockAuthSession } from "./fixtures/auth";
import { mockLocation } from "./fixtures/location";
import { mockJson, resetMockRoutes, startMockBackend } from "./fixtures/mock-backend";
import { ME, mockMyProducts } from "./fixtures/my-products";

test.beforeAll(() => startMockBackend());
test.beforeEach(() => resetMockRoutes());

test("abas por status e link só para aprovado (US1)", async ({ page }) => {
  await mockAuthSession(page);
  await mockLocation(page);
  mockJson("GET", /^\/users\/me$/, ME);
  mockMyProducts([
    { ean: "1111111111111", name: "Café Pendente", status: "PENDING" },
    { ean: "2222222222222", name: "Arroz Aprovado", status: "APPROVED" },
    { ean: "3333333333333", name: "Feijão Rejeitado", status: "REJECTED" },
  ]);

  await page.goto("/my-products");

  const main = page.getByRole("main");
  await expect(main.getByText("Café Pendente")).toBeVisible();
  await expect(main.getByRole("link", { name: /Café Pendente/ })).toHaveCount(0);

  await main.getByRole("tab", { name: /Aprovados/ }).click();
  const approved = main.getByRole("link", { name: /Arroz Aprovado/ });
  await expect(approved).toHaveAttribute("href", "/product/2222222222222");

  await main.getByRole("tab", { name: /Rejeitados/ }).click();
  await expect(main.getByText("Feijão Rejeitado")).toBeVisible();
  await expect(main.getByRole("link", { name: /Feijão Rejeitado/ })).toHaveCount(0);
});

test("carregar mais pagina a aba (US1)", async ({ page }) => {
  await mockAuthSession(page);
  await mockLocation(page);
  mockJson("GET", /^\/users\/me$/, ME);
  mockMyProducts(
    Array.from({ length: 25 }, (_, i) => ({
      ean: String(1000000000000 + i),
      name: `Produto ${i + 1}`,
      status: "PENDING" as const,
    }))
  );

  await page.goto("/my-products");
  const main = page.getByRole("main");
  await expect(main.getByText("Produto 20", { exact: true })).toBeVisible();
  await expect(main.getByText("Produto 21", { exact: true })).toHaveCount(0);

  await main.getByRole("button", { name: "Carregar mais" }).click();
  await expect(main.getByText("Produto 25", { exact: true })).toBeVisible();
  await expect(main.getByRole("button", { name: "Carregar mais" })).toHaveCount(0);
});

test("estado vazio convida a escanear (US1)", async ({ page }) => {
  await mockAuthSession(page);
  await mockLocation(page);
  mockJson("GET", /^\/users\/me$/, ME);
  mockMyProducts([]);

  await page.goto("/my-products");
  await expect(page.getByText("Nenhum produto aguardando aprovação.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "escaneie um código de barras" })
  ).toHaveAttribute("href", "/scan");
});

test("sem sessão redireciona para login (US1)", async ({ page }) => {
  await mockLocation(page);
  await page.goto("/my-products");
  await expect(page).toHaveURL(/\/login\?next=%2Fmy-products$/);
});
