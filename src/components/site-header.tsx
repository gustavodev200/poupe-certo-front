"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Search,
  ScanBarcode,
  ShoppingBasket,
  Wine,
  SprayCan,
  Droplet,
  Milk,
  Croissant,
  LayoutGrid,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { useSession } from "@/lib/auth-client";
import { useLocationStore } from "@/stores/location-store";
import { CATEGORIES } from "@/lib/mock/catalog";
import { PLATFORM_STATS } from "@/lib/mock/community";

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
  const { data: session } = useSession();
  const { uf, city } = useLocationStore();
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  const cityLabel = city ? `${city}, ${uf}` : "Escolher cidade";
  const initials = session?.user.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="hidden bg-primary py-2 text-xs text-primary-foreground/70 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-trust-fresh" />
              {PLATFORM_STATS.totalPrices} preços informados pela comunidade
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 opacity-60" />
              {PLATFORM_STATS.totalContributors} pessoas contribuindo
            </span>
          </div>
          <Link href="#" className="text-primary-foreground/70 no-underline">
            Como funciona
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ScanBarcode className="size-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Poupe Certo</span>
        </Link>

        <Link
          href="/onboarding"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium"
        >
          <MapPin className="size-3.5 opacity-55" />
          {cityLabel}
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
              <AvatarFallback>{initials}</AvatarFallback>
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
