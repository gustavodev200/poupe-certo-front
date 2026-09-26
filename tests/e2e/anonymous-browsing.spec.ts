import { expect, test } from "@playwright/test";

import { mockLocation } from "./fixtures/location";
import { mockJson, resetMockRoutes, startMockBackend } from "./fixtures/mock-backend";

test.beforeAll(() => startMockBackend());
test.beforeEach(() => resetMockRoutes());

test("visitante anônimo navega o catálogo sem chamar /users/me", async ({
  page,
}) => {
  await mockLocation(page);
  mockJson("GET", /^\/markets$/, []);
  mockJson("GET", /^\/leaderboard$/, []);
  mockJson("GET", /^\/products\/search$/, {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
  });

  const requestedPaths: string[] = [];
  page.on("request", (request) => {
    requestedPaths.push(new URL(request.url()).pathname);
  });

  await page.goto("/");
  await expect(
    page.getByText("Ainda não há produtos cadastrados. Escaneie o primeiro!")
  ).toBeVisible();

  expect(requestedPaths).not.toContain("/users/me");
});
