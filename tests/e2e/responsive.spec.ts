import { expect, test, type Page } from "@playwright/test";

import { mockAuthSession } from "./fixtures/auth";
import { mockLocation } from "./fixtures/location";
import { mockJson, resetMockRoutes, startMockBackend } from "./fixtures/mock-backend";
import { mockMyProducts } from "./fixtures/my-products";

const EAN = "7891234567890";
const MARKET_ID = "b1e1b1e1-0000-0000-0000-000000000000";

const productDetail = {
  ean: EAN,
  name: "Arroz Camil Tipo 1 — Pacote Econômico Família Grande",
  brand: "Camil",
  qty: "5kg",
  category: "merc",
  offers: [
    {
      market: { id: MARKET_ID, name: "Supermercado Extra Compre Bem Central" },
      price: 25.9,
      reportedAt: new Date().toISOString(),
      confirmations: 8,
      priceReportId: "c0ffee00-0000-0000-0000-000000000000",
    },
  ],
  stats: { lowest: 25.9, average: 27.65, highest: 29.9 },
  history: [{ period: "set 2", lowestPrice: 25.9 }],
};

const searchResult = {
  items: [
    {
      ean: EAN,
      name: productDetail.name,
      brand: "Camil",
      qty: "5kg",
      category: "merc",
      lowestOffer: {
        market: { id: MARKET_ID, name: productDetail.offers[0].market.name },
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

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

async function registerCommonRoutes() {
  mockJson("GET", /^\/products\/search$/, searchResult);
  mockJson("GET", new RegExp(`^/products/${EAN}$`), productDetail);
  mockJson("GET", /^\/leaderboard/, []);
  mockJson(
    "GET",
    /^\/markets$/,
    [{ id: MARKET_ID, name: productDetail.offers[0].market.name, address: null, city: null, uf: null }]
  );
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
  mockJson("GET", /^\/users\/me\/contributions$/, { items: [], page: 1, pageSize: 10, total: 0 });
  mockMyProducts([
    {
      ean: EAN,
      name: "Produto com um nome muito comprido que precisa truncar sem estourar o layout",
      status: "PENDING",
    },
  ]);
}

async function expectNoHorizontalOverflow(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `${path} @ ${clientWidth}px: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth}) — overflow horizontal`
  ).toBeLessThanOrEqual(clientWidth);
}

test.beforeAll(() => startMockBackend());
test.beforeEach(() => resetMockRoutes());

const PUBLIC_ROUTES = ["/", "/search?q=arroz", `/product/${EAN}`];
const AUTH_ROUTES = [
  `/confirm-price?ean=${EAN}`,
  "/new-product?ean=0000000000000",
  "/profile",
  "/my-products",
];

for (const viewport of VIEWPORTS) {
  test.describe(`overflow horizontal em ${viewport.width}px`, () => {
    test(`rotas públicas — ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockLocation(page);
      await registerCommonRoutes();

      for (const path of PUBLIC_ROUTES) {
        await expectNoHorizontalOverflow(page, path);
      }
    });

    test(`rotas autenticadas — ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockAuthSession(page);
      await mockLocation(page);
      await registerCommonRoutes();

      for (const path of AUTH_ROUTES) {
        await expectNoHorizontalOverflow(page, path);
      }
    });
  });
}
