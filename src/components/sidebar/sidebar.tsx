"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/hooks/use-session";
import { getDisplayUser } from "@/lib/auth";
import type { SidebarState } from "@/stores/sidebar-store";

export type SidebarItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
};

type SidebarProps = {
  brand: { icon: ComponentType<{ className?: string }>; label: string };
  items: readonly SidebarItem[];
  footer: (collapsed: boolean) => ReactNode;
  state: SidebarState;
  /** Rota raiz da área — ativa só em match exato (senão casaria com tudo). */
  rootHref: string;
};

function formatBadge(n: number): string {
  return n > 99 ? "99+" : String(n);
}

function isActive(pathname: string, href: string, rootHref: string): boolean {
  if (href === rootHref) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  items,
  collapsed,
  rootHref,
  onNavigate,
}: {
  items: readonly SidebarItem[];
  collapsed: boolean;
  rootHref: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const active = isActive(pathname, item.href, rootHref);
        const badge = item.badge ? formatBadge(item.badge) : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
              collapsed && "justify-center"
            )}
          >
            <item.icon className="size-4.5 shrink-0" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
            {badge &&
              (collapsed ? (
                <span
                  className="absolute top-1 right-1 min-w-4 rounded-full bg-primary px-1 text-center text-[0.6rem] leading-4 font-semibold text-primary-foreground tabular-nums"
                  aria-label={`${badge} pendentes`}
                >
                  {badge}
                </span>
              ) : (
                <span
                  className="rounded-full bg-primary px-1.5 text-[0.7rem] leading-5 font-semibold text-primary-foreground tabular-nums"
                  aria-label={`${badge} pendentes`}
                >
                  {badge}
                </span>
              ))}
          </Link>
        );
      })}
    </nav>
  );
}

/** Rodapé com a pessoa logada; `children` entra entre o usuário e o fim. */
export function SidebarUserFooter({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children?: ReactNode;
}) {
  const { session } = useSession();
  const user = session ? getDisplayUser(session) : null;

  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-border p-3">
      {user && (
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <Avatar size="sm">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{user.name}</div>
              <div className="truncate text-[0.7rem] text-sidebar-foreground/60">
                {user.email}
              </div>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function SidebarBrand({
  brand,
  collapsed,
  href,
  onNavigate,
}: {
  brand: SidebarProps["brand"];
  collapsed: boolean;
  href: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn("flex items-center gap-2 px-3 py-4", collapsed && "justify-center px-0")}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <brand.icon className="size-4.5" />
      </div>
      {!collapsed && <span className="text-sm font-bold tracking-tight">{brand.label}</span>}
    </Link>
  );
}

/**
 * Menu lateral: trilho colapsável em `md+` e gaveta em telas estreitas. O
 * botão que abre a gaveta fica fora daqui (topo de cada área) e usa
 * `state.setMobileOpen`.
 */
export function Sidebar({ brand, items, footer, state, rootHref }: SidebarProps) {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = state;

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarBrand brand={brand} collapsed={collapsed} href={rootHref} />
        <SidebarNav items={items} collapsed={collapsed} rootHref={rootHref} />
        {footer(collapsed)}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="absolute top-4 -right-3 z-10 rounded-full border border-sidebar-border bg-sidebar shadow-xs"
        >
          {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
        </Button>
      </aside>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Content
            className="fixed inset-y-0 left-0 z-50 flex h-full w-64 max-w-[85vw] flex-col overflow-y-auto bg-sidebar text-sidebar-foreground duration-200 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left"
            aria-describedby={undefined}
          >
            <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>
            <div className="flex items-center justify-between pr-3">
              <SidebarBrand
                brand={brand}
                collapsed={false}
                href={rootHref}
                onNavigate={() => setMobileOpen(false)}
              />
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Fechar menu">
                  <X className="size-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
            <SidebarNav
              items={items}
              collapsed={false}
              rootHref={rootHref}
              onNavigate={() => setMobileOpen(false)}
            />
            {footer(false)}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
