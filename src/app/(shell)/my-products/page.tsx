"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package, ScanBarcode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/query-error";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useMyProducts } from "@/hooks/use-my-products";
import { cn } from "@/lib/utils";
import {
  PRODUCT_STATUSES,
  type MyProduct,
  type ProductStatus,
} from "@/lib/api/users";

const STATUS_LABEL: Record<ProductStatus, string> = {
  PENDING: "Pendentes",
  APPROVED: "Aprovados",
  REJECTED: "Rejeitados",
};

const EMPTY_TEXT: Record<ProductStatus, string> = {
  PENDING: "Nenhum produto aguardando aprovação.",
  APPROVED: "Nenhum produto aprovado ainda.",
  REJECTED: "Nenhum produto rejeitado.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function ProductCard({ product }: Readonly<{ product: MyProduct }>) {
  const content = (
    <>
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`Foto de ${product.name}`}
            fill
            sizes="56px"
            unoptimized
            className="object-contain"
          />
        ) : (
          <Package className="absolute inset-0 m-auto size-5 opacity-40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{product.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {product.brand} · {product.qty}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
          EAN {product.ean} · enviado em {formatDate(product.createdAt)}
          {product.reviewedAt && ` · revisado em ${formatDate(product.reviewedAt)}`}
        </div>
      </div>
      {product.status === "APPROVED" && (
        <ChevronRight className="size-4 shrink-0 opacity-50" />
      )}
    </>
  );

  const className =
    "flex items-center gap-3.5 rounded-xl border border-border p-3.5";

  if (product.status === "APPROVED") {
    return (
      <Link
        href={`/product/${product.ean}`}
        className={cn(className, "hover:bg-muted/50")}
      >
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

export default function MyProductsPage() {
  const { isReady } = useRequireAuth("/my-products");
  const [status, setStatus] = useState<ProductStatus>("PENDING");
  const query = useMyProducts(status);

  if (!isReady) return null;

  const pages = query.data?.pages ?? [];
  const items = pages.flatMap((p) => p.items);
  const counts = pages[0]?.counts;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="mb-1 text-xl font-semibold tracking-tight md:text-2xl">
        Meus produtos
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Produtos que você cadastrou. Eles aparecem pra todo mundo depois que
        um admin aprova.
      </p>

      <div
        role="tablist"
        aria-label="Status"
        className="mb-4 flex flex-wrap gap-1.5"
      >
        {PRODUCT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            onClick={() => setStatus(s)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium",
              status === s && "border-primary bg-primary text-primary-foreground"
            )}
          >
            {STATUS_LABEL[s]}
            {counts && (
              <Badge
                variant={status === s ? "secondary" : "outline"}
                className="tabular-nums"
              >
                {counts[s]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {query.isPending && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-21 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {query.isError && (
        <QueryError error={query.error} onRetry={() => query.refetch()} />
      )}

      {query.isSuccess && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {EMPTY_TEXT[status]}
          {counts &&
            counts.PENDING + counts.APPROVED + counts.REJECTED === 0 && (
              <>
                {" "}
                Pra cadastrar um produto,{" "}
                <Link href="/scan" className="underline underline-offset-4">
                  escaneie um código de barras
                </Link>{" "}
                que ainda não existe no app.
              </>
            )}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {items.map((product) => (
            <ProductCard key={product.ean} product={product} />
          ))}
        </div>
      )}

      {query.hasNextPage && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </Button>
      )}

      <Button asChild variant="outline" className="mt-5 gap-2">
        <Link href="/scan">
          <ScanBarcode className="size-4" />
          Escanear produto
        </Link>
      </Button>
    </div>
  );
}
