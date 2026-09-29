"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AxiosError } from "axios";
import { Check, RefreshCw, ScanBarcode, ThumbsUp, Trophy } from "lucide-react";
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
import { categoryLabel } from "@/lib/categories";
import { formatAge } from "@/lib/trust";
import { useConfirmPrice } from "@/hooks/use-price-reports";
import { useProductDetail } from "@/hooks/use-products";
import { useAddToList, useShoppingList } from "@/hooks/use-shopping-list";
import { mapApiError } from "@/lib/api/errors";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",");
}

export function ProductView({ ean }: Readonly<{ ean: string }>) {
  const confirmPrice = useConfirmPrice(ean);
  const addToList = useAddToList();
  const shoppingList = useShoppingList();
  const alreadyInList = shoppingList.data?.some(
    (item) => item.product.ean === ean
  );
  const { data: product, isLoading, isError, error, refetch } =
    useProductDetail(ean);

  if (isError) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            Não conseguimos carregar este produto agora.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-3.5" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Carregando produto…
        </div>
      </div>
    );
  }

  const offers = [...product.offers].sort((a, b) => a.price - b.price);
  const best = offers[0] as (typeof offers)[number] | undefined;
  const categoryLabelText = categoryLabel(product.category);
  const historyMax = Math.max(1, ...product.history.map((h) => h.lowestPrice));

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <p className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          Início
        </Link>{" "}
        ›{" "}
        <Link href="/search" className="underline underline-offset-4">
          {categoryLabelText}
        </Link>
      </p>

      <div className="mb-3 flex flex-wrap gap-5 rounded-xl border border-border p-5 shadow-xs">
        <div className="relative size-35 shrink-0 overflow-hidden rounded-lg bg-muted">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={`Foto de ${product.name}`}
              fill
              sizes="140px"
              unoptimized
              className="object-contain"
            />
          )}
        </div>
        <div className="min-w-60 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground uppercase">
                {product.brand} · {categoryLabelText}
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
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-trust-fresh/35 bg-trust-fresh/8 p-2.5">
              <div className="text-[11px] font-medium text-muted-foreground">
                MENOR
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {product.stats.lowest !== null
                  ? `R$ ${formatPrice(product.stats.lowest)}`
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <div className="text-[11px] font-medium text-muted-foreground">
                MÉDIA
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {product.stats.average !== null
                  ? `R$ ${formatPrice(product.stats.average)}`
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <div className="text-[11px] font-medium text-muted-foreground">
                MAIOR
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {product.stats.highest !== null
                  ? `R$ ${formatPrice(product.stats.highest)}`
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {best ? (
        <div className="mb-3 rounded-xl border-2 border-trust-fresh p-4.5">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg bg-trust-fresh/12 px-2.5 py-1 text-xs font-medium text-trust-fresh">
            <Trophy className="size-3.5" />
            MELHOR PREÇO
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[15px] font-medium">{best.market.name}</div>
              <div className="mt-2">
                <TrustBadge
                  reportedAt={best.reportedAt}
                  confirmations={best.confirmations}
                />
              </div>
            </div>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              R$ {formatPrice(best.price)}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              className="flex-1 gap-1.5"
              disabled={alreadyInList || addToList.isPending}
              onClick={() =>
                addToList.mutate(product.ean, {
                  onSuccess: () => toast.success("Adicionado à sua lista"),
                  onError: (error) => toast.error(mapApiError(error)),
                })
              }
            >
              {alreadyInList && <Check className="size-4" />}
              {alreadyInList ? "Já está na lista" : "Adicionar à lista"}
            </Button>
            <Button asChild variant="outline" className="flex-1 gap-1.5">
              <Link href="/scan">
                <ScanBarcode className="size-4 opacity-65" />
                Escanear outro preço
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-dashed border-border p-4.5 text-center text-sm text-muted-foreground">
          Ainda não há preço reportado para este produto.{" "}
          <Link href="/scan" className="underline underline-offset-4">
            Seja o primeiro a informar
          </Link>
          .
        </div>
      )}

      {offers.length > 0 && (
        <div className="mb-3 overflow-hidden rounded-xl border border-border">
          <div className="p-4.5 pb-3">
            <div className="text-base font-semibold">Ofertas por mercado</div>
            <div className="text-sm text-muted-foreground">
              A idade do preço importa tanto quanto o valor.
            </div>
          </div>

          <div className="flex flex-col gap-2.5 px-4.5 pb-4.5 sm:hidden">
            {offers.map((o, i) => (
              <div
                key={o.priceReportId}
                className="flex items-center gap-2.5 rounded-lg border border-border p-3"
              >
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{o.market.name}</div>
                  <TrustBadge
                    reportedAt={o.reportedAt}
                    confirmations={o.confirmations}
                  />
                </div>
                <div className="shrink-0 font-semibold tabular-nums">
                  R$ {formatPrice(o.price)}
                </div>
              </div>
            ))}
          </div>

          <Table className="hidden sm:table">
            <TableHeader>
              <TableRow>
                <TableHead>Mercado</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead className="text-right">Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((o, i) => (
                <TableRow key={o.priceReportId}>
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
                      <div className="text-sm font-medium">{o.market.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TrustBadge
                      reportedAt={o.reportedAt}
                      confirmations={o.confirmations}
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    R$ {formatPrice(o.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-border p-5">
          <div className="text-[15px] font-semibold">Histórico de preço</div>
          <div className="mb-4.5 text-xs text-muted-foreground">
            menor preço por período
          </div>
          {product.history.length > 0 ? (
            <div className="flex h-27.5 items-end gap-2">
              {product.history.map((h, i) => (
                <div
                  key={h.period}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <div className="text-[10px] font-medium text-muted-foreground">
                    R$ {formatPrice(h.lowestPrice)}
                  </div>
                  <div
                    className={cn(
                      "w-full rounded-t-md",
                      i === product.history.length - 1
                        ? "bg-trust-fresh"
                        : "bg-border"
                    )}
                    style={{ height: `${(h.lowestPrice / historyMax) * 90}px` }}
                  />
                  <div className="text-[10px] text-muted-foreground">
                    {h.period}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem histórico suficiente ainda.
            </p>
          )}
        </div>

        <div className="min-w-0 rounded-xl border border-border p-5">
          <div className="mb-1.5 text-[15px] font-semibold">
            Esse preço ainda está correto?
          </div>
          {best ? (
            <>
              <div className="mb-4 text-sm leading-relaxed text-muted-foreground">
                R$ {formatPrice(best.price)} no {best.market.name}, visto{" "}
                {formatAge(best.reportedAt)}.
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="justify-center gap-2"
                  disabled={confirmPrice.isPending}
                  onClick={() =>
                    confirmPrice.mutate(best.priceReportId, {
                      onSuccess: () =>
                        toast.success("Obrigado por confirmar!"),
                      onError: (error) =>
                        toast.error(mapApiError(error)),
                    })
                  }
                >
                  <ThumbsUp className="size-4 opacity-65" />
                  Sim, está correto
                </Button>
                <Button asChild variant="outline" className="justify-center gap-2">
                  <Link href={`/confirm-price?ean=${product.ean}`}>
                    Não, mudou — informar novo preço
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <Button asChild variant="outline" className="justify-center gap-2">
              <Link href={`/confirm-price?ean=${product.ean}`}>
                Informar o primeiro preço
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
