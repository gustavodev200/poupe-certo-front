"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  PackageCheck,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { useAdminSidebarStore } from "@/stores/admin-sidebar-store";
import { useSession } from "@/hooks/use-session";
import { getDisplayUser } from "@/lib/auth";

const NAV_ITEMS = [{ href: "/admin", label: "Moderação", icon: PackageCheck }] as const;

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
              collapsed && "justify-center",
            )}
          >
            <item.icon className="size-4.5 shrink-0" />
            {!collapsed && item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { session } = useSession();
  const user = session ? getDisplayUser(session) : null;

  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-border p-3">
      <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
        <Avatar size="sm">
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback>{user?.initials ?? "?"}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user?.name}</div>
            <div className="truncate text-[0.7rem] text-sidebar-foreground/60">
              {user?.email}
            </div>
          </div>
        )}
      </div>
      <Link
        href="/"
        title={collapsed ? "Voltar ao site" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed && "justify-center",
        )}
      >
        <ArrowLeft className="size-3.5 shrink-0" />
        {!collapsed && "Voltar ao site"}
      </Link>
      {!collapsed && <SignOutButton />}
    </div>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-4", collapsed && "justify-center px-0")}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-4.5" />
      </div>
      {!collapsed && <span className="text-sm font-bold tracking-tight">Painel admin</span>}
    </div>
  );
}

export function AdminSidebar() {
  const { collapsed, toggle } = useAdminSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarBrand collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          className="absolute top-4 -right-3 rounded-full border border-sidebar-border bg-sidebar shadow-xs"
        >
          {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
        </Button>
      </aside>

      {/* Mobile topbar + drawer */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-4.5" />
        </Button>
        <span className="text-sm font-bold tracking-tight">Painel admin</span>
      </div>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Content
            className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground duration-200 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left"
            aria-describedby={undefined}
          >
            <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>
            <div className="flex items-center justify-between px-3 py-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="size-4.5" />
                </div>
                <span className="text-sm font-bold tracking-tight">Painel admin</span>
              </div>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Fechar menu">
                  <X className="size-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
            <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter collapsed={false} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
