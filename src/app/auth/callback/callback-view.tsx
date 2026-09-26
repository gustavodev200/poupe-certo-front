"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@/hooks/use-session";
import { safeNextPath } from "@/lib/auth";

export function CallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const { session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (session) {
      router.replace(next);
    } else {
      router.replace(`/login?next=${encodeURIComponent(next)}&error=1`);
    }
  }, [isPending, session, next, router]);

  return (
    <main className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
      Entrando...
    </main>
  );
}
