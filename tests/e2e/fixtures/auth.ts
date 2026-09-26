import type { Page } from "@playwright/test";

function projectRef(supabaseUrl: string): string {
  const { hostname } = new URL(supabaseUrl);
  return hostname.split(".")[0];
}

/**
 * Injeta uma sessão Supabase falsa no localStorage antes da navegação, para
 * telas atrás de `useRequireAuth` sem depender de OAuth real do Google.
 * Chave/formato replicam o que `@supabase/supabase-js` (GoTrueClient) grava.
 */
export async function mockAuthSession(page: Page) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não definido — configure .env.local antes de rodar test:e2e"
    );
  }
  const storageKey = `sb-${projectRef(supabaseUrl)}-auth-token`;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const session = {
    access_token: "e2e-fake-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: nowSeconds + 3600,
    refresh_token: "e2e-fake-refresh-token",
    user: {
      id: "00000000-0000-4000-8000-000000000000",
      aud: "authenticated",
      email: "e2e@poupecerto.test",
      user_metadata: { full_name: "E2E Test", avatar_url: null },
      app_metadata: {},
      created_at: new Date().toISOString(),
    },
  };

  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [storageKey, JSON.stringify(session)] as [string, string]
  );
}
