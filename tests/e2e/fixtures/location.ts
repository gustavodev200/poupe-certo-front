import type { Page } from "@playwright/test";

/**
 * Pré-popula o `location-store` (zustand persist) no localStorage, senão o
 * `(shell)/layout.tsx` redireciona toda rota do catálogo pra `/onboarding`
 * por falta de cidade escolhida.
 */
export async function mockLocation(page: Page, uf = "GO", city = "Goianésia") {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [
      "poupe-certo:location",
      JSON.stringify({ state: { uf, city }, version: 0 }),
    ] as [string, string]
  );
}
