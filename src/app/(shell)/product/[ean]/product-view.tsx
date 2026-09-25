"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ScanBarcode, ThumbsDown, ThumbsUp, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrustBadge } from "@/components/trust-badge";
import { cn } from "@/lib/utils";
import { CATEGORIES, type Product } from "@/lib/mock/catalog";
import { formatAge } from "@/lib/trust";

export function ProductView({ product }: Readonly<{ product: Product }>) {
  const [favorite, setFavorite] = useState(false);
  const offers = [...product.offers].sort((a, b) => a.price - b.price);
  const best = offers[0];
  const prices = product.offers.map((o) => o.price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const max = Math.max(...prices);
  const categoryLabel = CATEGORIES.find((c) => c.id === product.category)?.label;

  const historyMax = Math.max(...product.history.map((h) => h.price));

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <p className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          Início
        </Link>{" "}
        ›{" "}
        <Link href="/search" className="underline underline-offset-4">
          {categoryLabel}
        </Link>
      </p>

      <div className="mb-3 flex flex-wrap gap-5 rounded-xl border border-border p-5 shadow-xs">
        <div className="size-35 shrink-0 rounded-lg bg-muted" />
        <div className="min-w-60 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground uppercase">
                {product.brand} · {categoryLabel}
              </div>
              <h1 className="text-2xl leading-tight font-semibold tracking-tight md:text-[26px]">
                {product.name}
              </h1>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {product.qty}
              </div>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                EAN {product.ean}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFavorite((f) => !f)}
              className={cn(favorite && "border-destructive/40")}
            >
              <Heart
                className={cn(
                  "size-4",
                  favorite && "fill-destructive text-destructive"
                )}
              />
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-trust-fresh/35 bg-trust-fresh/8 p-2.5">
              <div className="text-[11px] font-medium text-muted-foreground">
                MENOR
              </div>
              <div className="text-lg font-semibold tabular-nums">
                R$ {best.price.toFixed(2).replace(".", ",")}
              </div>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <div className="text-[11px] font-medium text-muted-foreground">
                MÉDIA
              </div>
              <div className="text-lg font-semibold tabular-nums">
                R$ {avg.toFixed(2).replace(".", ",")}
              </div>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <div className="text-[11px] font-medium text-muted-foreground">
                MAIOR
              </div>
              <div className="text-lg font-semibold tabular-nums">
                R$ {max.toFixed(2).replace(".", ",")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-xl border-2 border-trust-fresh p-4.5">
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg bg-trust-fresh/12 px-2.5 py-1 text-xs font-medium text-trust-fresh">
          <Trophy className="size-3.5" />
          MELHOR PREÇO
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[15px] font-medium">{best.market}</div>
            <div className="text-xs text-muted-foreground">
              {best.distance}
            </div>
            <div className="mt-2">
              <TrustBadge
                reportedAt={best.reportedAt}
                confirmations={best.confirmations}
              />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight tabular-nums">
            R$ {best.price.toFixed(2).replace(".", ",")}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            className="flex-1"
            onClick={() => toast.success("Adicionado à sua lista")}
          >
            Adicionar à lista
          </Button>
          <Button asChild variant="outline" className="flex-1 gap-1.5">
            <Link href="/scan">
              <ScanBarcode className="size-4 opacity-65" />
              Escanear outro preço
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-3 overflow-hidden rounded-xl border border-border">
        <div className="p-4.5 pb-3">
          <div className="text-base font-semibold">Ofertas por mercado</div>
          <div className="text-sm text-muted-foreground">
            A idade do preço importa tanto quanto o valor.
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mercado</TableHead>
              <TableHead>Confiança</TableHead>
              <TableHead className="text-right">Preço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o, i) => (
              <TableRow key={o.market}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        i === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{o.market}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {o.distance}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <TrustBadge
                    reportedAt={o.reportedAt}
                    confirmations={o.confirmations}
                  />
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  R$ {o.price.toFixed(2).replace(".", ",")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <div className="text-[15px] font-semibold">Histórico de preço</div>
          <div className="mb-4.5 text-xs text-muted-foreground">
            menor preço por quinzena
          </div>
          <div className="flex h-27.5 items-end gap-2">
            {product.history.map((h, i) => (
              <div
                key={h.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <div className="text-[10px] font-medium text-muted-foreground">
                  R$ {h.price.toFixed(2).replace(".", ",")}
                </div>
                <div
                  className={cn(
                    "w-full rounded-t-md",
                    i === product.history.length - 1
                      ? "bg-trust-fresh"
                      : "bg-border"
                  )}
                  style={{ height: `${(h.price / historyMax) * 90}px` }}
                />
                <div className="text-[10px] text-muted-foreground">
                  {h.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-5">
          <div className="mb-1.5 text-[15px] font-semibold">
            Esse preço ainda está correto?
          </div>
          <div className="mb-4 text-sm leading-relaxed text-muted-foreground">
            R$ {best.price.toFixed(2).replace(".", ",")} no {best.market},
            visto {formatAge(best.reportedAt)}.
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-center gap-2"
              onClick={() => toast.success("Obrigado por confirmar!")}
            >
              <ThumbsUp className="size-4 opacity-65" />
              Sim, está correto
            </Button>
            <Button asChild variant="outline" className="justify-center gap-2">
              <Link href="/scan">
                <ThumbsDown className="size-4 opacity-65" />
                Não, mudou
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
