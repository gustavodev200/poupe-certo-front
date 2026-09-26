"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/hooks/use-session";

export function useRequireAuth(next: string) {
  const router = useRouter();
  const { session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isPending, session, next, router]);

  return { session, isPending, isReady: !isPending && !!session };
}
