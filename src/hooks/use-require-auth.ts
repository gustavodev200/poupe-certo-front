"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/lib/auth-client";

export function useRequireAuth(next: string) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isPending, session, next, router]);

  return { session, isPending, isReady: !isPending && !!session };
}
