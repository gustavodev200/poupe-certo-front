"use client";

import { useState } from "react";
import Link from "next/link";

import { QueryError } from "@/components/query-error";
import { TrustBadge } from "@/components/trust-badge";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";
import { useSearchProducts } from "@/hooks/use-products";

const SORT_OPTIONS = [
  { id: "preco", label: "Menor preço" },
  { id: "recente", label: "Mais recente" },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",");
}

export function ResultsView({
  query,
  category,
}: Readonly<{
  query: string;
  category?: string;
}>) {
  const [sort, setSort] = useState<SortId>("preco");

  const { data, isPending, isError, refetch } = useSearchProducts({
    q: query || undefined,
    category,
    sort,
  });

  const categoryLabelText = categoryLabel(category);
  const title = query
    ? `Resultados para "${query}"`
    : categoryLabelText ?? "Todos os produtos";

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
        {data ? `${data.total} produtos encontrados` : "Buscando..."}
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

      {isPending && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {isError && <QueryError error={undefined} onRetry={() => refetch()} />}

      {data && (
        <div className="flex flex-col gap-2.5">
          {data.items.map((product) => (
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
                  {product.lowestOffer && (
                    <TrustBadge reportedAt={product.lowestOffer.reportedAt} />
                  )}
                  <span className="rounded-lg border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {product.offerCount} mercados
                  </span>
                </div>
              </div>
              <div className="ml-auto shrink-0 text-right">
                {product.lowestOffer ? (
                  <>
                    <div className="text-[11px] text-muted-foreground">
                      a partir de
                    </div>
                    <div className="text-xl font-semibold tracking-tight tabular-nums">
                      R$ {formatPrice(product.lowestOffer.price)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {product.lowestOffer.market.name}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-muted-foreground">
                    sem preço ainda
                  </div>
                )}
              </div>
            </Link>
          ))}
          {data.items.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado. Que tal ser o primeiro a informar um
              preço?
            </p>
          )}
        </div>
      )}
    </div>
  );
}
