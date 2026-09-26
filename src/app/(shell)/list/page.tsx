"use client";

import Link from "next/link";
import { ScanBarcode, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/query-error";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  useRemoveListItem,
  useShoppingList,
  useToggleListItem,
} from "@/hooks/use-shopping-list";
import { mapApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { ShoppingListItem } from "@/lib/api/shopping-list";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",");
}

function ListItemRow({ item }: Readonly<{ item: ShoppingListItem }>) {
  const toggle = useToggleListItem();
  const remove = useRemoveListItem();

  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-border p-3.5">
      <input
        type="checkbox"
        checked={item.purchased}
        disabled={toggle.isPending}
        onChange={(e) =>
          toggle.mutate(
            { id: item.id, purchased: e.target.checked },
            { onError: (error) => toast.error(mapApiError(error)) }
          )
        }
        className="size-4.5 shrink-0 accent-primary"
        aria-label={`Marcar ${item.product.name} como comprado`}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-medium",
            item.purchased && "text-muted-foreground line-through"
          )}
        >
          {item.product.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.product.qty} · {item.market.name}
        </div>
      </div>
      <div className="shrink-0 text-right font-semibold tabular-nums">
        R$ {formatPrice(item.price)}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={remove.isPending}
        onClick={() =>
          remove.mutate(item.id, {
            onError: (error) => toast.error(mapApiError(error)),
          })
        }
        aria-label={`Remover ${item.product.name} da lista`}
      >
        <Trash2 className="size-4 opacity-60" />
      </Button>
    </div>
  );
}

export default function ListaPage() {
  const { isReady } = useRequireAuth("/list");
  const { data, isLoading, isError, refetch } = useShoppingList();

  if (!isReady) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h1 className="mb-1 text-xl font-semibold tracking-tight md:text-2xl">
        Minha Lista
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Produtos que você marcou pra comprar, com o preço de quando foram
        adicionados.
      </p>

      {isLoading && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-19 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {isError && <QueryError error={undefined} onRetry={() => refetch()} />}

      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Sua lista está vazia.{" "}
          <Link href="/scan" className="underline underline-offset-4">
            Escaneie um produto
          </Link>{" "}
          pra começar.
        </div>
      )}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {data.map((item) => (
            <ListItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      <Button asChild variant="outline" className="mt-5 gap-2">
        <Link href="/scan">
          <ScanBarcode className="size-4" />
          Escanear outro produto
        </Link>
      </Button>
    </div>
  );
}
