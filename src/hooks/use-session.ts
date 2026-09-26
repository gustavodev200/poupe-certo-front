"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { getQueryClient } from "@/lib/query-client";

interface SessionState {
  session: Session | null;
  isPending: boolean;
}

const PENDING: SessionState = { session: null, isPending: true };

let state: SessionState = PENDING;
let knownUserId: string | null | undefined; // undefined = ainda não observado
const listeners = new Set<() => void>();
let listening = false;

function applySession(session: Session | null) {
  const userId = session?.user.id ?? null;
  // Cache do react-query não sabe de quem é cada query ("me", stats,
  // detalhe de produto filtrado por cidade do perfil, ...) — sem isso, trocar
  // de conta na mesma aba mostra dado da conta anterior até o staleTime
  // (60s) expirar, porque a query key não muda e nada força o refetch.
  if (knownUserId !== undefined && knownUserId !== userId) {
    getQueryClient().clear();
  }
  knownUserId = userId;
  state = { session, isPending: false };
  listeners.forEach((l) => l());
}

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
      applySession(data.session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
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
