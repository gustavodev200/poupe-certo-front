"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Menu,
  Search,
  ScanBarcode,
  ShoppingBasket,
  Wine,
  SprayCan,
  Droplet,
  Milk,
  Croissant,
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { useSession } from "@/hooks/use-session";
import { getDisplayUser } from "@/lib/auth";
import { useLocationStore } from "@/stores/location-store";
import { CATEGORIES } from "@/lib/categories";
import { useAppSidebarStore } from "@/stores/sidebar-store";

const CATEGORY_ICONS = {
  ShoppingBasket,
  Wine,
  SprayCan,
  Droplet,
  Milk,
  Croissant,
} as const;

export function SiteHeader() {
  const router = useRouter();
  const { session } = useSession();
  const { uf, city } = useLocationStore();
  const [query, setQuery] = useState("");
  const openMenu = useAppSidebarStore((s) => s.setMobileOpen);

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  const cityLabel = city ? `${city}, ${uf}` : "Escolher cidade";
  const user = session ? getDisplayUser(session) : null;

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => openMenu(true)}
          aria-label="Abrir menu"
          className="md:hidden"
        >
          <Menu className="size-4.5" />
        </Button>

        {/* Em md+ a marca já aparece no topo do menu lateral. */}
        <Link
          href="/"
          aria-label="Poupe Certo — início"
          className="flex shrink-0 items-center md:hidden"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ScanBarcode className="size-4.5" />
          </div>
        </Link>

        <Link
          href="/onboarding"
          className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium"
        >
          <MapPin className="size-3.5 shrink-0 opacity-55" />
          <span className="truncate">{cityLabel}</span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button asChild className="hidden gap-1.5 md:inline-flex">
            <Link href="/scan">
              <ScanBarcode className="size-4" />
              Escanear preço
            </Link>
          </Button>
          <ModeToggle />
          <Link href="/profile">
            <Avatar>
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              )}
              <AvatarFallback>{user?.initials ?? "?"}</AvatarFallback>
            </Avatar>
          </Link>
        </div>

        <form
          onSubmit={submitSearch}
          className="order-last flex w-full items-center gap-2 rounded-lg border border-border py-0.5 pr-1 pl-3 shadow-xs"
        >
          <Search className="size-4 shrink-0 opacity-50" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto, marca ou código de barras"
            className="h-8 border-none px-0 shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="sm" variant="secondary">
            Buscar
          </Button>
        </form>
      </div>

      <div className="no-scrollbar mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-2.5 md:px-6">
        <Link
          href="/search"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium"
        >
          <LayoutGrid className="size-3.5 opacity-60" />
          Todos
        </Link>
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS];
          return (
            <Link
              key={cat.id}
              href={`/search?categoria=${cat.id}`}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium"
            >
              <Icon className="size-3.5 opacity-60" />
              {cat.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
