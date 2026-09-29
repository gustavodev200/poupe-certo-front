import { expect, test } from "@playwright/test";

import { mockAuthSession } from "./fixtures/auth";
import { mockLocation } from "./fixtures/location";
import { mockJson, resetMockRoutes, startMockBackend } from "./fixtures/mock-backend";
import { ME, mockMyProducts } from "./fixtures/my-products";

test.beforeAll(() => startMockBackend());
test.beforeEach(() => {
  resetMockRoutes();
  mockJson("GET", /^\/leaderboard/, []);
  mockJson("GET", /^\/products\/search$/, { items: [], page: 1, pageSize: 20, total: 0 });
});

const ITEMS = ["Início", "Buscar", "Escanear", "Minha Lista", "Meus produtos", "Perfil"];

test("desktop: trilho com itens, ativo, contador e recolher persistente (US2)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "Desktop", "trilho só existe em md+");
  await mockAuthSession(page);
  await mockLocation(page);
  mockJson("GET", /^\/users\/me$/, ME);
  mockMyProducts([
    { ean: "1111111111111", name: "A", status: "PENDING" },
    { ean: "2222222222222", name: "B", status: "PENDING" },
    { ean: "3333333333333", name: "C", status: "APPROVED" },
  ]);

  await page.goto("/");
  const rail = page.locator("aside");
  for (const label of ITEMS) {
    await expect(rail.getByRole("link", { name: new RegExp(label) })).toBeVisible();
  }
  await expect(rail.getByRole("link", { name: /Início/ })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(rail.getByRole("link", { name: /Meus produtos/ })).toContainText("2");
  await expect(rail.getByRole("link", { name: /Admin/ })).toHaveCount(0);

  await rail.getByRole("button", { name: "Recolher menu" }).click();
  await expect(rail.getByText("Minha Lista")).toHaveCount(0);
  await page.reload();
  await expect(
    page.locator("aside").getByRole("button", { name: "Expandir menu" })
  ).toBeVisible();
});

test("desktop: item Admin só para operador (US2)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "Desktop", "trilho só existe em md+");
  await mockAuthSession(page);
  await mockLocation(page);
  mockJson("GET", /^\/users\/me$/, { ...ME, isOperator: true });
  mockMyProducts([]);

  await page.goto("/");
  const rail = page.locator("aside");
  await expect(rail.getByRole("link", { name: /Admin/ })).toHaveAttribute("href", "/admin");
  await expect(rail.getByRole("link", { name: /Meus produtos/ })).not.toContainText("0");
});

test("mobile: gaveta abre pelo topo, navega e fecha (US2)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "Mobile", "gaveta só em telas estreitas");
  await mockAuthSession(page);
  await mockLocation(page);
  mockJson("GET", /^\/users\/me$/, ME);
  mockMyProducts([{ ean: "1111111111111", name: "Café Pendente", status: "PENDING" }]);

  await page.goto("/");
  await expect(page.locator("aside")).toBeHidden();

  await page.getByRole("button", { name: "Abrir menu" }).click();
  const drawer = page.getByRole("dialog", { name: "Menu de navegação" });
  await expect(drawer).toBeVisible();
  for (const label of ITEMS) {
    await expect(drawer.getByRole("link", { name: new RegExp(label) })).toBeVisible();
  }

  await drawer.getByRole("link", { name: /Meus produtos/ }).click();
  await expect(page).toHaveURL(/\/my-products$/);
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("main").getByText("Café Pendente")).toBeVisible();

  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("button", { name: "Fechar menu" }).click();
  await expect(drawer).toBeHidden();
});

test("anônimo: sem contador e sem Admin, com Entrar (US2)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "Desktop", "trilho só existe em md+");
  await mockLocation(page);

  await page.goto("/");
  const rail = page.locator("aside");
  await expect(rail.getByRole("link", { name: /Meus produtos/ })).toBeVisible();
  await expect(rail.getByRole("link", { name: /Admin/ })).toHaveCount(0);
  await expect(rail.getByRole("link", { name: "Entrar" })).toBeVisible();
});
