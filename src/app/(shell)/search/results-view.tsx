"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { TrustBadge } from "@/components/trust-badge";
import { cn } from "@/lib/utils";
import { CATEGORIES, lowestOffer, searchProducts } from "@/lib/mock/catalog";

const SORT_OPTIONS = [
  { id: "preco", label: "Menor preço" },
  { id: "recente", label: "Mais recente" },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

export function ResultsView({
  query,
  category,
}: {
  query: string;
  category?: string;
}) {
  const [sort, setSort] = useState<SortId>("preco");

  const results = useMemo(() => {
    const found = searchProducts(query, category);
    const withOffer = found.map((p) => ({ product: p, offer: lowestOffer(p) }));
    if (sort === "preco") {
      return withOffer.sort((a, b) => a.offer.price - b.offer.price);
    }
    return withOffer.sort(
      (a, b) =>
        new Date(b.offer.reportedAt).getTime() -
        new Date(a.offer.reportedAt).getTime()
    );
  }, [query, category, sort]);

  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label;
  const title = query
    ? `Resultados para "${query}"`
    : categoryLabel ?? "Todos os produtos";

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <p className="mb-1 text-xs text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          Início
        </Link>{" "}
        › Resultados
      </p>
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h1>
      <p className="mt-0.5 mb-5 text-sm text-muted-foreground">
        {results.length} produtos encontrados
      </p>

      <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setSort(o.id)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium",
              sort === o.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-transparent"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {results.map(({ product, offer }) => (
          <Link
            key={product.ean}
            href={`/product/${product.ean}`}
            className="flex flex-wrap items-center gap-3.5 rounded-xl border border-border p-3.5 shadow-xs"
          >
            <div className="size-18 shrink-0 rounded-lg bg-muted" />
            <div className="min-w-[200px] flex-1">
              <div className="text-[15px] font-medium">{product.name}</div>
              <div className="mb-2 text-xs text-muted-foreground">
                {product.qty} · {product.brand}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <TrustBadge reportedAt={offer.reportedAt} />
                <span className="rounded-lg border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {product.offers.length} mercados
                </span>
              </div>
            </div>
            <div className="ml-auto shrink-0 text-right">
              <div className="text-[11px] text-muted-foreground">
                a partir de
              </div>
              <div className="text-xl font-semibold tracking-tight tabular-nums">
                R$ {offer.price.toFixed(2).replace(".", ",")}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {offer.market}
              </div>
            </div>
          </Link>
        ))}
        {results.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado. Que tal ser o primeiro a informar um
            preço?
          </p>
        )}
      </div>
    </div>
  );
}
