"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

interface SessionState {
  session: Session | null;
  isPending: boolean;
}

const PENDING: SessionState = { session: null, isPending: true };

let state: SessionState = PENDING;
const listeners = new Set<() => void>();
let listening = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!listening) {
    listening = true;
    // INITIAL_SESSION chega depois da troca do ?code= (PKCE) — marca fim do carregamento.
    supabase.auth.onAuthStateChange((_event, session) => {
      state = { session, isPending: false };
      listeners.forEach((l) => l());
    });
  }
  return () => listeners.delete(listener);
}

export function useSession(): SessionState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => PENDING,
  );
}
