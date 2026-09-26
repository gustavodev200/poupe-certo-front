"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useModerationQueue } from "@/hooks/use-moderation";
import { mapApiError } from "@/lib/api/errors";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { isReady } = useRequireAuth("/admin");
  const queue = useModerationQueue();

  if (!isReady) {
    return null;
  }

  if (queue.isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    );
  }

  if (queue.isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldAlert className="size-8 text-destructive" />
        <p className="text-sm font-semibold">Acesso restrito</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {mapApiError(queue.error)}
        </p>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao site</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
