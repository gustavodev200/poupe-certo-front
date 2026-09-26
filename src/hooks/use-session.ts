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
    // `onAuthStateChange` só dispara INITIAL_SESSION uma vez, logo depois do
    // client ser construído — se essa assinatura (lazy, no primeiro mount)
    // chegar depois disso, o evento já passou e nunca mais vem. `getSession()`
    // não depende de timing: sempre lê o estado atual, então também serve pra
    // popular a sessão já restaurada de um F5 (não só a troca do ?code= PKCE).
    supabase.auth.getSession().then(({ data }) => {
      state = { session: data.session, isPending: false };
      listeners.forEach((l) => l());
    });
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
