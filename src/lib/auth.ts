import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const DEFAULT_NEXT = "/profile";

// Só caminho interno: bloqueia open redirect via ?next=https://... ou //host.
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return DEFAULT_NEXT;
  }
  return raw;
}

export async function signInWithGoogle(next: string | null) {
  const redirectTo = new URL("/auth/callback", window.location.origin);
  redirectTo.searchParams.set("next", safeNextPath(next));
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo.toString() },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}

export interface DisplayUser {
  name: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
}

export function getDisplayUser(session: Session): DisplayUser {
  const meta = session.user.user_metadata as Record<string, unknown>;
  const email = session.user.email ?? "";
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    email;
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  return { name, email, avatarUrl, initials: name.slice(0, 2).toUpperCase() };
}
