import { expect, test } from "@playwright/test";

import { resetMockRoutes, startMockBackend } from "./fixtures/mock-backend";

const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";

test.beforeAll(() => startMockBackend());
test.beforeEach(() => resetMockRoutes());

test("visitante anônimo escolhe cidade e continua sem precisar logar", async ({
  page,
}) => {
  await page.route(`${IBGE_BASE}/estados?orderBy=nome`, (route) =>
    route.fulfill({
      json: [{ sigla: "GO", nome: "Goiás" }],
    })
  );
  await page.route(`${IBGE_BASE}/estados/GO/municipios`, (route) =>
    route.fulfill({
      json: [{ nome: "Goianésia" }],
    })
  );

  const requestedPaths: string[] = [];
  page.on("request", (request) => {
    requestedPaths.push(new URL(request.url()).pathname);
  });

  await page.goto("/onboarding");
  await page.getByRole("button", { name: "GO", exact: true }).click();
  await page.getByRole("button", { name: "Goianésia" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/$/);
  expect(requestedPaths).not.toContain("/users/me/location");
});
