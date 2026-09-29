"use client";

import Link from "next/link";
import { cn } from "cn";
import {
  House,
  ListChecks,
  LogIn,
  Package,
  ScanBarcode,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { Sidebar, SidebarUserFooter, type SidebarItem } from "@/components/sidebar/sidebar";
import { useMyProfile } from "@/hooks/use-profile-location";
import { usePendingProductsCount } from "@/hooks/use-my-products";
import { useSession } from "@/hooks/use-session";
import { useAppSidebarStore } from "@/stores/sidebar-store";

const BRAND = { icon: ScanBarcode, label: "Poupe Certo" };

export function AppSidebar() {
  const state = useAppSidebarStore();
  const { session } = useSession();
  const profile = useMyProfile();
  const pending = usePendingProductsCount();

  const items: SidebarItem[] = [
    { href: "/", label: "Início", icon: House },
    { href: "/search", label: "Buscar", icon: Search },
    { href: "/scan", label: "Escanear", icon: ScanBarcode },
    { href: "/list", label: "Minha Lista", icon: ListChecks },
    { href: "/my-products", label: "Meus produtos", icon: Package, badge: pending },
    { href: "/profile", label: "Perfil", icon: User },
  ];
  if (profile.data?.isOperator) {
    items.push({ href: "/admin", label: "Admin", icon: ShieldCheck });
  }

  return (
    <Sidebar
      brand={BRAND}
      items={items}
      rootHref="/"
      state={state}
      footer={(collapsed) => (
        <SidebarUserFooter collapsed={collapsed}>
          {session ? (
            !collapsed && <SignOutButton />
          ) : (
            <Link
              href="/login"
              title={collapsed ? "Entrar" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <LogIn className="size-4 shrink-0" />
              {!collapsed && "Entrar"}
            </Link>
          )}
        </SidebarUserFooter>
      )}
    />
  );
}
