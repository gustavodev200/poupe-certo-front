"use client";

import Link from "next/link";
import { cn } from "cn";
import { ArrowLeft, Menu, PackageCheck, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { Sidebar, SidebarUserFooter } from "@/components/sidebar/sidebar";
import { useAdminSidebarStore } from "@/stores/sidebar-store";

const NAV_ITEMS = [{ href: "/admin", label: "Moderação", icon: PackageCheck }] as const;
const BRAND = { icon: ShieldCheck, label: "Painel admin" };

export function AdminSidebar() {
  const state = useAdminSidebarStore();

  return (
    <>
      <Sidebar
        brand={BRAND}
        items={NAV_ITEMS}
        rootHref="/admin"
        state={state}
        footer={(collapsed) => (
          <SidebarUserFooter collapsed={collapsed}>
            <Link
              href="/"
              title={collapsed ? "Voltar ao site" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <ArrowLeft className="size-3.5 shrink-0" />
              {!collapsed && "Voltar ao site"}
            </Link>
            {!collapsed && <SignOutButton />}
          </SidebarUserFooter>
        )}
      />

      {/* Topbar mobile própria — o admin não usa o SiteHeader do app. */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => state.setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-4.5" />
        </Button>
        <span className="text-sm font-bold tracking-tight">Painel admin</span>
      </div>
    </>
  );
}
