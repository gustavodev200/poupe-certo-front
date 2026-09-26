import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local ausente (ex.: CI sem segredo configurado) — testes que
  // dependem de sessão autenticada simulada vão falhar com erro claro.
}

const PORT = process.env.PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

// Porta dedicada pro backend mockado (tests/e2e/fixtures/mock-backend.ts),
// diferente da porta real do poupe-certo-back (3333) — evita EADDRINUSE
// quando o backend real também está de pé na máquina de quem roda os testes.
const MOCK_API_PORT = process.env.PLAYWRIGHT_MOCK_API_PORT ?? "3334";
const mockApiUrl = `http://localhost:${MOCK_API_PORT}`;
process.env.NEXT_PUBLIC_API_URL = mockApiUrl;

export default defineConfig({
  testDir: "./tests/e2e",
  // workers: 1 — o backend mockado (tests/e2e/fixtures/mock-backend.ts) usa
  // estado em memória num único processo; specs em paralelo colidiriam nele.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "Desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
